import React, { useState, useEffect } from 'react';
import { BookOpen, Play, Clock, Target, Lightbulb, Loader2, Brain, Star, Award, ChevronRight, Book, Calculator, Atom, Globe, Users, Award as Trophy } from 'lucide-react';
import { User } from '../../types';
import { geminiService } from '../../services/gemini';
import { DataStorage } from '../../utils/dataStorage';

interface LessonModuleProps {
  user: User;
}

// Dersleri ve konuları içeren veri yapısı, daha gerçekçi LGS müfredatına göre güncellendi
const lgsSubjects = {
  'Türkçe': {
    icon: Book,
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    topics: [
      'Sözcükte Anlam ve Söz Varlığı',
      'Cümlede Anlam',
      'Söz Sanatları',
      'Paragrafta Anlam ve Yapı',
      'Metin Türleri',
      'Cümlenin Ögeleri',
      'Fiilde Çatı',
      'Cümle Çeşitleri',
      'Yazım Kuralları',
      'Noktalama İşaretleri'
    ]
  },
  'Matematik': {
    icon: Calculator,
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    topics: [
      'Çarpanlar ve Katlar',
      'Üslü İfadeler',
      'Kareköklü İfadeler',
      'Veri Analizi',
      'Olasılık',
      'Cebirsel İfadeler ve Özdeşlikler',
      'Doğrusal Denklemler',
      'Eşitsizlikler',
      'Üçgenler',
      'Eşlik ve Benzerlik',
      'Dönüşüm Geometrisi',
      'Katı Cisimler'
    ]
  },
  'Fen Bilimleri': {
    icon: Atom,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    topics: [
      'Mevsimler ve İklim',
      'DNA ve Genetik Kod',
      'Basınç',
      'Madde ve Endüstri',
      'Basit Makineler',
      'Enerji Dönüşümleri',
      'Elektrik Yükleri ve Elektrik Enerjisi',
      'Canlılar ve Enerji İlişkileri'
    ]
  },
  'İnkılap Tarihi ve Atatürkçülük': {
    icon: Trophy,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    topics: [
      'Bir Kahraman Doğuyor',
      'Millî Uyanış: Bağımsızlık Yolunda Atılan Adımlar',
      'Millî Bir Destan: Ya İstiklal Ya Ölüm!',
      'Atatürkçülük ve Çağdaşlaşan Türkiye'
    ]
  },
  'Din Kültürü ve Ahlak Bilgisi': {
    icon: Users,
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    topics: [
      'Kader İnancı',
      'Zekât, Sadaka ve Hac',
      'Din ve Hayat',
      "Hz. Muhammed'in Örnekliği"
    ]
  },
  'İngilizce': {
    icon: Globe,
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    topics: [
      'Friendship',
      'Teen Life',
      'In the Kitchen',
      'On the Phone',
      'The Internet',
      'Adventures'
    ]
  }
};

export const LessonModule: React.FC<LessonModuleProps> = ({ user }) => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState('Seviye 2-Standart Pratik');
  const [generatedLesson, setGeneratedLesson] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // useEffect ile seçilen ders değiştiğinde konu listesini güncelle
  useEffect(() => {
    if (selectedSubject) {
      setAvailableTopics(lgsSubjects[selectedSubject]?.topics || []);
      setSelectedTopic(''); // Ders değişince konuyu sıfırla
    } else {
      setAvailableTopics([]);
    }
  }, [selectedSubject]);

  const handleGenerateLesson = async () => {
    if (!selectedSubject) {
      setError('Lütfen bir ders seçin.');
      return;
    }
    if (!selectedTopic) {
      setError('Lütfen bir konu seçin.');
      return;
    }

    setLoading(true);
    setError('');
    
    // Start tracking study session
    const sessionId = DataStorage.startStudySession(user.id, 'lesson', selectedSubject, selectedTopic);
    setCurrentSessionId(sessionId);
    setSessionStartTime(new Date());
    
    try {
      const response = await geminiService.generateLesson({
        topic: selectedTopic,
        studentLevel: difficulty,
        learningStyle: user.learningStyle,
        importantPoints: [],
        previousErrors: [],
        exampleType: 'Günlük Hayat Örneği'
      });

      if (response.success) {
        setGeneratedLesson(response.data);
      } else {
        setError(response.error || 'Konu anlatımı oluşturulamadı');
        // End session if failed
        if (sessionId) {
          DataStorage.endStudySession(sessionId);
          setCurrentSessionId(null);
          setSessionStartTime(null);
        }
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      // End session if failed
      if (sessionId) {
        DataStorage.endStudySession(sessionId);
        setCurrentSessionId(null);
        setSessionStartTime(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinishLesson = () => {
    if (currentSessionId) {
      // Calculate a focus score based on time spent (simple algorithm)
      const timeSpent = sessionStartTime ? (new Date().getTime() - sessionStartTime.getTime()) / (1000 * 60) : 0;
      const focusScore = Math.min(100, Math.max(50, Math.round(timeSpent * 2))); // 2 points per minute, max 100
      
      DataStorage.endStudySession(currentSessionId, undefined, focusScore);
      setCurrentSessionId(null);
      setSessionStartTime(null);
    }
    setGeneratedLesson(null);
    setSelectedSubject(''); // Dersi ve konuyu bitirince sıfırla
    setSelectedTopic('');
  };

  const getCurrentSessionTime = () => {
    if (!sessionStartTime) return '0dk';
    const minutes = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / (1000 * 60));
    return `${minutes}dk`;
  };

  // Update session time every minute
  useEffect(() => {
    if (currentSessionId && sessionStartTime) {
      const interval = setInterval(() => {
        // Force re-render to update time display
        setSessionStartTime(new Date(sessionStartTime));
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [currentSessionId, sessionStartTime]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Modern Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mr-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Konu Anlatımı</h2>
              <p className="text-blue-100 mt-1">Öğrenme yolculuğunuza hoş geldiniz</p>
            </div>
          </div>
          {currentSessionId && (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
              <div className="flex items-center text-white">
                <Clock className="h-5 w-5 mr-2" />
                <span className="font-medium">Çalışma süresi: {getCurrentSessionTime()}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full"></div>
      </div>

      {!generatedLesson ? (
        <div className="space-y-8">
          {/* Ders Seçim Kartları */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Brain className="h-6 w-6 text-purple-600 mr-2" />
              Ders Seçin
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(lgsSubjects).map(([subject, data]) => {
                const IconComponent = data.icon;
                const isSelected = selectedSubject === subject;
                
                return (
                  <div
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                      isSelected 
                        ? `border-transparent bg-gradient-to-br ${data.color} text-white shadow-lg` 
                        : `border-gray-200 ${data.bgColor} hover:border-gray-300 hover:shadow-md`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-white'} mr-3`}>
                          <IconComponent className={`h-6 w-6 ${isSelected ? 'text-white' : data.textColor}`} />
                        </div>
                        <div>
                          <h4 className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                            {subject}
                          </h4>
                          <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                            {data.topics.length} konu
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="bg-white/20 rounded-full p-1">
                          <ChevronRight className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Konu Seçim Kartları */}
          {selectedSubject && (
            <div className="animate-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-6 w-6 text-blue-600 mr-2" />
                Konu Seçin
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableTopics.map((topic) => {
                  const isSelected = selectedTopic === topic;
                  const subjectData = lgsSubjects[selectedSubject];
                  
                  return (
                    <div
                      key={topic}
                      onClick={() => setSelectedTopic(topic)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                        isSelected 
                          ? `border-transparent bg-gradient-to-br ${subjectData.color} text-white shadow-lg` 
                          : `border-gray-200 ${subjectData.bgColor} hover:border-gray-300 hover:shadow-md`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h5 className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                          {topic}
                        </h5>
                        {isSelected && (
                          <Star className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Zorluk Seviyesi Kartları */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="h-6 w-6 text-amber-600 mr-2" />
              Zorluk Seviyesi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  value: "Seviye 1-Destek Odaklı", 
                  title: "Temel Seviye", 
                  description: "Temel kavramlar ve destekleyici örnekler",
                  color: "from-green-500 to-emerald-500",
                  bgColor: "bg-green-50",
                  icon: "🌱"
                },
                { 
                  value: "Seviye 2-Standart Pratik", 
                  title: "Standart Seviye", 
                  description: "LGS seviyesinde pratik sorular",
                  color: "from-blue-500 to-indigo-500",
                  bgColor: "bg-blue-50",
                  icon: "📚"
                },
                { 
                  value: "Seviye 3-İleri Düzey", 
                  title: "İleri Seviye", 
                  description: "Analitik düşünme ve karmaşık sorular",
                  color: "from-purple-500 to-violet-500",
                  bgColor: "bg-purple-50",
                  icon: "🚀"
                }
              ].map((level) => {
                const isSelected = difficulty === level.value;
                
                return (
                  <div
                    key={level.value}
                    onClick={() => setDifficulty(level.value)}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                      isSelected 
                        ? `border-transparent bg-gradient-to-br ${level.color} text-white shadow-lg` 
                        : `border-gray-200 ${level.bgColor} hover:border-gray-300 hover:shadow-md`
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{level.icon}</div>
                      <h4 className={`font-semibold mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {level.title}
                      </h4>
                      <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                        {level.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Öğrenme Stili */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Brain className="h-6 w-6 text-indigo-600 mr-2" />
              Öğrenme Stiliniz
            </h3>
            <div className="flex flex-wrap gap-3">
              {user.learningStyle.map(style => (
                <div
                  key={style}
                  className="bg-white px-4 py-2 rounded-full border border-indigo-200 shadow-sm"
                >
                  <span className="text-indigo-700 font-medium text-sm">{style}</span>
                </div>
              ))}
            </div>
            <p className="text-indigo-600 text-sm mt-3">
              Ders anlatımları öğrenme stilinize göre kişiselleştirilecektir.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-in slide-in-from-top-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm">⚠️</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center pt-4">
            <button
              onClick={handleGenerateLesson}
              disabled={loading || !selectedSubject || !selectedTopic}
              className="relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-3" />
                    <span>Kişiselleştirilmiş ders oluşturuluyor...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-3 group-hover:animate-pulse" />
                    <span>Konu Anlatımı Oluştur</span>
                    <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
          {/* Modern Lesson Header */}
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mr-6">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{generatedLesson.konu_adi}</h3>
                  <div className="flex items-center space-x-4 text-white/80">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      {generatedLesson.seviye}
                    </span>
                    {currentSessionId && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="text-sm">Çalışma süresi: {getCurrentSessionTime()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleFinishLesson}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/20"
              >
                ✅ Dersi Bitir
              </button>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full"></div>
          </div>

          {/* Lesson Content Modules */}
          <div className="space-y-6">
            {generatedLesson.icerik_modulleri?.map((module: any, index: number) => (
              <div key={index} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-2 mr-3">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">{module.modul_basligi}</h4>
                  </div>
                  
                  <div className="prose max-w-none text-gray-700 mb-4 leading-relaxed whitespace-pre-line">
                    {module.metin_icerigi}
                  </div>
                  
                  {module.ek_ipucu && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mt-4">
                      <div className="flex items-start">
                        <div className="bg-amber-100 rounded-lg p-2 mr-3">
                          <Lightbulb className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-amber-900 mb-1">💡 ADHD İpucu</h5>
                          <p className="text-sm text-amber-800 leading-relaxed">{module.ek_ipucu}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary Section */}
          {generatedLesson.ozet_ve_sonraki_adim && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-2 mr-3">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-green-900">🎯 Özet ve Sonraki Adım</h4>
              </div>
              <p className="text-green-800 leading-relaxed">{generatedLesson.ozet_ve_sonraki_adim}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
