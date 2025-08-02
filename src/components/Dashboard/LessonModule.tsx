import React, { useState, useEffect } from 'react';
import { BookOpen, Play, Clock, Target, Lightbulb, Loader2 } from 'lucide-react';
import { User } from '../../types';
import { geminiService } from '../../services/gemini';
import { DataStorage } from '../../utils/dataStorage';

interface LessonModuleProps {
  user: User;
}

// Dersleri ve konuları içeren veri yapısı, daha gerçekçi LGS müfredatına göre güncellendi
const lgsSubjects = {
  'Türkçe': [
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
  ],
  'Matematik': [
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
  ],
  'Fen Bilimleri': [
    'Mevsimler ve İklim',
    'DNA ve Genetik Kod',
    'Basınç',
    'Madde ve Endüstri',
    'Basit Makineler',
    'Enerji Dönüşümleri',
    'Elektrik Yükleri ve Elektrik Enerjisi',
    'Canlılar ve Enerji İlişkileri'
  ],
  'İnkılap Tarihi ve Atatürkçülük': [
    'Bir Kahraman Doğuyor',
    'Millî Uyanış: Bağımsızlık Yolunda Atılan Adımlar',
    'Millî Bir Destan: Ya İstiklal Ya Ölüm!',
    'Atatürkçülük ve Çağdaşlaşan Türkiye'
  ],
  'Din Kültürü ve Ahlak Bilgisi': [
    'Kader İnancı',
    'Zekât, Sadaka ve Hac',
    'Din ve Hayat',
    'Hz. Muhammed’in Örnekliği'
  ],
  'İngilizce': [
    'Friendship',
    'Teen Life',
    'In the Kitchen',
    'On the Phone',
    'The Internet',
    'Adventures'
  ]
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
      setAvailableTopics(lgsSubjects[selectedSubject] || []);
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Konu Anlatımı</h2>
        </div>
        {currentSessionId && (
          <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <Clock className="h-4 w-4 mr-1" />
            Çalışma süresi: {getCurrentSessionTime()}
          </div>
        )}
      </div>

      {!generatedLesson ? (
        <div className="space-y-6">
          {/* Ders Seçim Dropdown'ı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ders Seçin
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Bir ders seçin...</option>
              {Object.keys(lgsSubjects).map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          {/* Konu Seçim Dropdown'ı (Artık dinamik) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Konu Seçin
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              disabled={!selectedSubject} // Ders seçilmeden devre dışı kalır
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{selectedSubject ? 'Bir konu seçin...' : 'Önce bir ders seçin'}</option>
              {availableTopics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zorluk Seviyesi
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Seviye 1-Destek Odaklı">Seviye 1 - Destek Odaklı</option>
              <option value="Seviye 2-Standart Pratik">Seviye 2 - Standart Pratik</option>
              <option value="Seviye 3-İleri Düzey">Seviye 3 - İleri Düzey</option>
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Öğrenme Stiliniz</h3>
            <div className="flex flex-wrap gap-2">
              {user.learningStyle.map(style => (
                <span
                  key={style}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {style}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerateLesson}
            disabled={loading || !selectedSubject || !selectedTopic}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Konu Anlatımı Oluştur
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{generatedLesson.konu_adi}</h3>
              <p className="text-sm text-gray-600">{generatedLesson.seviye}</p>
              {currentSessionId && (
                <p className="text-xs text-blue-600 mt-1">
                  Çalışma süresi: {getCurrentSessionTime()}
                </p>
              )}
            </div>
            <button
              onClick={handleFinishLesson}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Dersi Bitir
            </button>
          </div>

          <div className="space-y-4">
            {generatedLesson.icerik_modulleri?.map((module: any, index: number) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Target className="h-4 w-4 mr-2 text-blue-600" />
                  {module.modul_basligi}
                </h4>
                <div className="prose text-sm text-gray-700 mb-3 whitespace-pre-line">
                  {module.metin_icerigi}
                </div>
                {module.ek_ipucu && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800 flex items-start">
                      <Lightbulb className="h-4 w-4 mr-2 mt-0.5 text-yellow-600" />
                      <strong>ADHD İpucu:</strong> {module.ek_ipucu}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {generatedLesson.ozet_ve_sonraki_adim && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h4 className="font-medium text-green-900 mb-2">Özet ve Sonraki Adım</h4>
              <p className="text-sm text-green-800">{generatedLesson.ozet_ve_sonraki_adim}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
