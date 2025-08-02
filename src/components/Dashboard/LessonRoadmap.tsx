import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Play, Lock, ChevronDown, ChevronUp, Clock, FileQuestion } from 'lucide-react';
import { DataStorage } from '../../utils/dataStorage';
import { User } from '../../types';

interface LessonRoadmapProps {
  user?: User;
}

// Dersleri ve konuları içeren veri yapısı (LessonModule'den alındı)
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
        Object.entries(lgsSubjects).forEach(([subject, topics]) => {
          topics.forEach(topic => {
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

    const isLastTopic = index === lgsSubjects[selectedSubject].length - 1;

    return (
      <div key={index} className="flex items-start">
        <div className="flex flex-col items-center">
          <div
            className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white cursor-pointer transition-all duration-300 transform hover:scale-110 ${bgColor}`}
            onClick={() => {
              if (progressStatus !== 'locked') {
                alert(`Konu: "${topic}" seçildi!`);
              } else {
                alert('Bu konuya erişim kilitli.');
              }
            }}
          >
            {icon}
          </div>
          {!isLastTopic && (
            <div className={`w-1 h-16 ${lineStyle} rounded-b-full`}></div>
          )}
        </div>
        <div className="ml-4 mt-2 mb-12">
          <h4 className={`font-semibold text-lg ${textColor}`}>
            {index + 1}. {topic}
          </h4>
          <p className={`text-sm mt-1 flex items-center ${
            progressStatus === 'completed' ? 'text-green-600' :
            progressStatus === 'in-progress' ? 'text-blue-600' : 'text-gray-500'
          }`}>
            {infoText}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex items-center mb-6">
        <BookOpen className="h-8 w-8 text-blue-600 mr-4" />
        <h2 className="text-3xl font-bold text-gray-900">Ders Yol Haritası</h2>
      </div>

      <div className="w-full max-w-2xl mx-auto mb-8">
        <div className="relative">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 cursor-pointer flex items-center justify-between"
                 onClick={() => setSelectedSubject('')}>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-gray-800">
                  {selectedSubject || 'Bir Ders Seçin'}
                </span>
              </div>
              {selectedSubject ? (
                <ChevronUp className="w-6 h-6 text-gray-500" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-500" />
              )}
            </div>
            {!selectedSubject && (
              <div className="p-2 bg-gray-50">
                {Object.keys(lgsSubjects).map((subject) => (
                  <div
                    key={subject}
                    className="p-3 hover:bg-gray-200 cursor-pointer rounded-md transition-colors"
                    onClick={() => setSelectedSubject(subject)}
                  >
                    <span className="text-gray-700 font-medium">{subject}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedSubject && (
        <div className="w-full max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">{selectedSubject} Yol Haritası</h3>
          <div className="relative pl-5">
            {lgsSubjects[selectedSubject].map((topic, index) => renderTopicNode(selectedSubject, topic, index))}
          </div>
        </div>
      )}
    </div>
  );
};
