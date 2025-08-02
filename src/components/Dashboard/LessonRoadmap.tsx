import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Play, Lock, ChevronDown, ChevronUp, Clock, FileQuestion, Brain, Star, Award, TrendingUp, BarChart3, Book, Calculator, Atom, Globe, Users, Award as Trophy, Target, CheckCircle } from 'lucide-react';
import { DataStorage } from '../../utils/dataStorage';
import { User } from '../../types';

interface LessonRoadmapProps {
  user?: User;
}

// Dersleri ve konuları içeren veri yapısı (LessonModule'den alındı)
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

// Gerçek kullanıcı verilerini tutan state
interface ProgressData {
  timeSpent: number;
  questionsSolved: number;
  lessonCompleted: boolean;
  examCompleted: boolean;
  examScore?: number;
}

// Bir konunun ilerleme durumunu belirleyen ana mantık
const getProgressStatus = (progress: ProgressData) => {
  // Eğer hem ders hem de sınav tamamlanmışsa
  if (progress.lessonCompleted && progress.examCompleted) {
    return 'completed';
  }
  
  // Eğer en az biri tamamlanmışsa veya herhangi bir ilerleme varsa
  if (progress.lessonCompleted || progress.examCompleted || progress.timeSpent > 0) {
    return 'in-progress';
  }
  
  return 'locked';
};

export const LessonRoadmap: React.FC<LessonRoadmapProps> = ({ user }) => {
  const [selectedSubject, setSelectedSubject] = useState('Matematik');
  const [progressData, setProgressData] = useState<Record<string, ProgressData>>({});

  // Kullanıcı verilerini yükle
  useEffect(() => {
    const loadUserProgress = async () => {
      if (!user) return;
      
      try {
        const userActivity = await DataStorage.getUserActivity(user.id);
        const newProgressData: Record<string, ProgressData> = {};
        
        // Tüm dersler ve konular için progress data oluştur
        Object.entries(lgsSubjects).forEach(([subject, data]) => {
          data.topics.forEach(topic => {
            const progressKey = `${subject}-${topic}`;
            
            // Bu konu için ders oturumlarını bul
            const lessonSessions = userActivity.studySessions.filter(
              session => session.type === 'lesson' && 
                        session.subject === subject && 
                        session.topic === topic
            );
            
            // Bu konu için sınav oturumlarını bul
            const examSessions = userActivity.studySessions.filter(
              session => session.type === 'exam' && 
                        session.subject === subject && 
                        session.topic === topic
            );
            
            const totalTime = lessonSessions.reduce((sum, session) => sum + session.duration, 0);
            const lessonCompleted = lessonSessions.length > 0 && totalTime >= 20; // En az 20 dakika çalışma
            const examCompleted = examSessions.length > 0;
            const examScore = examSessions.length > 0 ? examSessions[examSessions.length - 1].score : undefined;
            
            newProgressData[progressKey] = {
              timeSpent: totalTime,
              questionsSolved: examSessions.length,
              lessonCompleted,
              examCompleted,
              examScore
            };
          });
        });
        
        setProgressData(newProgressData);
      } catch (error) {
        console.error('Error loading user progress:', error);
      }
    };

    loadUserProgress();
  }, [user]);

  const renderTopicNode = (subject: string, topic: string, index: number) => {
    const progressKey = `${subject}-${topic}`;
    const progress = progressData[progressKey] || { 
      timeSpent: 0, 
      questionsSolved: 0, 
      lessonCompleted: false, 
      examCompleted: false 
    };
    const progressStatus = getProgressStatus(progress);

    let icon, bgColor, textColor, borderColor, lineStyle, infoText;

    switch (progressStatus) {
      case 'completed':
        icon = <CheckCircle2 className="w-5 h-5" />;
        bgColor = 'bg-green-500';
        textColor = 'text-green-500';
        borderColor = 'border-green-500';
        lineStyle = 'bg-green-500';
        if (progress.lessonCompleted && progress.examCompleted) {
          infoText = `Bu konunun konu anlatımı ve sınavı tamamlanmıştır! ${progress.examScore ? `(Sınav: ${progress.examScore}%)` : ''}`;
        } else {
          infoText = `Tamamlandı! (${progress.timeSpent}dk)`;
        }
        break;
      case 'in-progress':
        icon = <Play className="w-5 h-5" />;
        bgColor = 'bg-blue-500 animate-pulse';
        textColor = 'text-blue-500';
        borderColor = 'border-blue-500';
        lineStyle = 'bg-blue-500';
        let statusParts = [];
        if (progress.lessonCompleted) {
          statusParts.push('Bu konunun konu anlatımı tamamlanmıştır');
        }
        if (progress.examCompleted) {
          statusParts.push(`Bu konunun sınavı başarıyla tamamlanmıştır ${progress.examScore ? `(${progress.examScore}%)` : ''}`);
        }
        if (statusParts.length === 0) {
          statusParts.push(`Devam Ediyor (${progress.timeSpent}dk)`);
        }
        infoText = statusParts.join('. ');
        break;
      case 'locked':
      default:
        icon = <Lock className="w-5 h-5" />;
        bgColor = 'bg-gray-300';
        textColor = 'text-gray-400';
        borderColor = 'border-gray-400';
        lineStyle = 'bg-gray-300';
        infoText = 'Henüz başlanmamış';
        break;
    }

    const isLastTopic = index === lgsSubjects[selectedSubject].topics.length - 1;

    return (
      <div key={index} className="flex items-start group mb-8">
        <div className="flex flex-col items-center">
          <div
            className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-white cursor-pointer transition-all duration-300 transform hover:scale-110 hover:rotate-3 ${bgColor} shadow-lg`}
            onClick={() => {
              if (progressStatus !== 'locked') {
                alert(`Konu: "${topic}" seçildi!`);
              } else {
                alert('Bu konuya erişim kilitli.');
              }
            }}
          >
            {icon}
            
            {/* Hover Effect */}
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
          </div>
          {!isLastTopic && (
            <div className={`w-1 h-20 ${lineStyle} rounded-full mt-2 opacity-60`}></div>
          )}
        </div>
        
        <div className="ml-6 mt-1 flex-1">
          <div className={`bg-white rounded-xl p-4 shadow-sm border-2 transition-all duration-200 hover:shadow-md ${borderColor} group-hover:border-opacity-60`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className={`font-semibold text-lg ${textColor}`}>
                {index + 1}. {topic}
              </h4>
              
              {/* Status Badge */}
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                progressStatus === 'completed' ? 'bg-green-100 text-green-700' :
                progressStatus === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {progressStatus === 'completed' ? '✅ Tamamlandı' :
                 progressStatus === 'in-progress' ? '🔄 Devam Ediyor' : '🔒 Kilitli'}
              </div>
            </div>
            
            <p className={`text-sm leading-relaxed ${
              progressStatus === 'completed' ? 'text-green-600' :
              progressStatus === 'in-progress' ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {infoText}
            </p>
            
            {/* Progress Details */}
            {progress.timeSpent > 0 && (
              <div className="mt-3 flex items-center space-x-4 text-xs text-gray-600">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{progress.timeSpent} dakika</span>
                </div>
                {progress.examScore && (
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    <span>Sınav: {progress.examScore}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Modern Header */}
      <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-8 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mr-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Ders Yol Haritası</h2>
              <p className="text-teal-100 mt-1">İlerlemenizi takip edin ve hedeflerinize ulaşın</p>
            </div>
          </div>
          
          {/* Progress Stats */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
              <div className="text-white font-bold text-lg">
                {Object.values(progressData).filter(p => getProgressStatus(p) === 'completed').length}
              </div>
              <div className="text-teal-100 text-xs">Tamamlanan</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
              <div className="text-white font-bold text-lg">
                {Object.values(progressData).filter(p => getProgressStatus(p) === 'in-progress').length}
              </div>
              <div className="text-teal-100 text-xs">Devam Eden</div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full"></div>
      </div>

      {/* Ders Seçim Kartları */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Brain className="h-6 w-6 text-emerald-600 mr-2" />
          Ders Seçin
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(lgsSubjects).map(([subject, data]) => {
            const IconComponent = data.icon;
            const isSelected = selectedSubject === subject;
            
            // Bu ders için progress hesapla
            const subjectProgress = data.topics.map(topic => {
              const progressKey = `${subject}-${topic}`;
              return progressData[progressKey] || { timeSpent: 0, questionsSolved: 0, lessonCompleted: false, examCompleted: false };
            });
            
            const completedTopics = subjectProgress.filter(p => getProgressStatus(p) === 'completed').length;
            const inProgressTopics = subjectProgress.filter(p => getProgressStatus(p) === 'in-progress').length;
            const totalTopics = data.topics.length;
            const progressPercentage = Math.round((completedTopics / totalTopics) * 100);
            
            return (
              <div
                key={subject}
                onClick={() => setSelectedSubject(selectedSubject === subject ? '' : subject)}
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  isSelected 
                    ? `border-transparent bg-gradient-to-br ${data.color} text-white shadow-lg` 
                    : `border-gray-200 ${data.bgColor} hover:border-gray-300 hover:shadow-md`
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-white'} mr-3`}>
                      <IconComponent className={`h-6 w-6 ${isSelected ? 'text-white' : data.textColor}`} />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {subject}
                      </h4>
                      <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                        {totalTopics} konu
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <ChevronUp className="h-5 w-5 text-white" />
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className={`w-full h-2 rounded-full ${isSelected ? 'bg-white/20' : 'bg-gray-200'}`}>
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isSelected ? 'bg-white/60' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
                
                {/* Progress Stats */}
                <div className="flex justify-between text-xs">
                  <span className={isSelected ? 'text-white/90' : 'text-gray-600'}>
                    ✅ {completedTopics} Tamamlandı
                  </span>
                  <span className={isSelected ? 'text-white/90' : 'text-gray-600'}>
                    🔄 {inProgressTopics} Devam Ediyor
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedSubject && (
        <div className="animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${lgsSubjects[selectedSubject].bgColor} mr-4`}>
                  {React.createElement(lgsSubjects[selectedSubject].icon, { 
                    className: `h-8 w-8 ${lgsSubjects[selectedSubject].textColor}` 
                  })}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedSubject} Yol Haritası</h3>
                  <p className="text-gray-600 mt-1">Adım adım öğrenme rotanız</p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="bg-green-100 px-3 py-2 rounded-lg text-center">
                  <div className="text-green-700 font-bold text-sm">
                    {lgsSubjects[selectedSubject].topics.filter((topic, index) => {
                      const progressKey = `${selectedSubject}-${topic}`;
                      const progress = progressData[progressKey] || { timeSpent: 0, questionsSolved: 0, lessonCompleted: false, examCompleted: false };
                      return getProgressStatus(progress) === 'completed';
                    }).length}
                  </div>
                  <div className="text-green-600 text-xs">Tamamlandı</div>
                </div>
                <div className="bg-blue-100 px-3 py-2 rounded-lg text-center">
                  <div className="text-blue-700 font-bold text-sm">
                    {lgsSubjects[selectedSubject].topics.filter((topic, index) => {
                      const progressKey = `${selectedSubject}-${topic}`;
                      const progress = progressData[progressKey] || { timeSpent: 0, questionsSolved: 0, lessonCompleted: false, examCompleted: false };
                      return getProgressStatus(progress) === 'in-progress';
                    }).length}
                  </div>
                  <div className="text-blue-600 text-xs">Devam Ediyor</div>
                </div>
              </div>
            </div>
            
            <div className="relative pl-8">
              {lgsSubjects[selectedSubject].topics.map((topic, index) => renderTopicNode(selectedSubject, topic, index))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
