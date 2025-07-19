import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Target, BookOpen, FileText, Brain, Calendar } from 'lucide-react';
import { User } from '../../types';
import { DataStorage } from '../../utils/dataStorage';

interface AnalyticsModuleProps {
  user: User;
}

export const AnalyticsModule: React.FC<AnalyticsModuleProps> = ({ user }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [userActivity, setUserActivity] = useState<any>(null);
  const [timeRangeData, setTimeRangeData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const activity = await DataStorage.getUserActivity(user.id);
        const rangeData = DataStorage.getTimeRangeData(user.id, timeRange);
        setUserActivity(activity);
        setTimeRangeData(rangeData);
      } catch (error) {
        console.error('Error loading analytics data:', error);
        // Set empty data to show no data state
        setUserActivity({
          userId: user.id,
          studySessions: [],
          totalStudyTime: 0,
          completedLessons: 0,
          completedExams: 0,
          averageScore: 0,
          subjectProgress: {},
          weeklyActivity: {},
          monthlyActivity: {}
        });
        setTimeRangeData({
          studyTime: 0,
          lessonsCompleted: 0,
          examsCompleted: 0,
          averageScore: 0,
          focusScore: 0
        });
      }
    };
    
    loadData();
  }, [user.id, timeRange]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'week': return 'Bu Hafta';
      case 'month': return 'Bu Ay';
      case 'year': return 'Bu Yıl';
      default: return 'Bu Hafta';
    }
  };

  const getSubjectName = (subject: string) => {
    const subjectMap: Record<string, string> = {
      'Cebirsel İfadeler': 'Matematik',
      'Denklemler': 'Matematik',
      'Eşitsizlikler': 'Matematik',
      'Üslü İfadeler': 'Matematik',
      'Köklü İfadeler': 'Matematik',
      'Veri Analizi': 'Matematik',
      'Olasılık': 'Matematik',
      'Üçgenler': 'Matematik',
      'Çember ve Daire': 'Matematik',
      'Prizmalar': 'Matematik',
      'Piramitler': 'Matematik',
      'Küreler': 'Matematik',
      'Basit Makineler': 'Fen Bilimleri',
      'Işık': 'Fen Bilimleri',
      'Ses': 'Fen Bilimleri',
      'Elektrik': 'Fen Bilimleri',
      'Maddenin Yapısı': 'Fen Bilimleri',
      'Kimyasal Değişimler': 'Fen Bilimleri',
      'Hücre Bölünmesi': 'Fen Bilimleri',
      'Kalıtım': 'Fen Bilimleri',
      "Türkiye'nin Coğrafi Bölgeleri": 'Sosyal Bilgiler',
      'İklim ve Doğal Bitki Örtüsü': 'Sosyal Bilgiler',
      'Nüfus ve Yerleşme': 'Sosyal Bilgiler',
      'Ekonomik Faaliyetler': 'Sosyal Bilgiler',
      'Osmanlı Devleti': 'Sosyal Bilgiler',
      'Cumhuriyet Dönemi': 'Sosyal Bilgiler',
      'Atatürk İlkeleri': 'Sosyal Bilgiler',
      'Demokrasi ve İnsan Hakları': 'Sosyal Bilgiler',
    };
    return subjectMap[subject] || subject;
  };

  const getSubjectProgress = () => {
    if (!userActivity) return [];
    
    const subjectMap: Record<string, { totalTime: number; completedLessons: number; completedExams: number; averageScore: number; topics: Set<string> }> = {};
    
    userActivity.studySessions.forEach((session: any) => {
      const subject = getSubjectName(session.topic);
      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          totalTime: 0,
          completedLessons: 0,
          completedExams: 0,
          averageScore: 0,
          topics: new Set()
        };
      }
      
      subjectMap[subject].totalTime += session.duration;
      subjectMap[subject].topics.add(session.topic);
      
      if (session.type === 'lesson') {
        subjectMap[subject].completedLessons++;
      } else if (session.type === 'exam') {
        subjectMap[subject].completedExams++;
      }
    });
    
    // Calculate average scores for each subject
    Object.keys(subjectMap).forEach(subject => {
      const examSessions = userActivity.studySessions.filter((s: any) => 
        getSubjectName(s.topic) === subject && s.type === 'exam' && s.score !== undefined
      );
      
      if (examSessions.length > 0) {
        subjectMap[subject].averageScore = Math.round(
          examSessions.reduce((total: number, session: any) => total + session.score, 0) / examSessions.length
        );
      }
    });
    
    return Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      progress: Math.min(100, Math.round((data.topics.size / 7) * 100)), // Assuming 7 topics per subject
      time: data.totalTime,
      lessons: data.completedLessons,
      exams: data.completedExams,
      averageScore: data.averageScore
    }));
  };

  if (!userActivity || !timeRangeData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Henüz analiz edilecek veri yok.</p>
            <p className="text-sm text-gray-400 mt-2">Ders çalışmaya başladığınızda verileriniz burada görünecek.</p>
          </div>
        </div>
      </div>
    );
  }

  const subjectProgress = getSubjectProgress();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Performans Analizi</h2>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="week">Bu Hafta</option>
          <option value="month">Bu Ay</option>
          <option value="year">Bu Yıl</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-blue-600 font-medium">Çalışma Süresi</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatTime(timeRangeData.studyTime)}
              </p>
              <p className="text-xs text-blue-500 mt-1">{getTimeRangeLabel()}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-green-600 font-medium">Tamamlanan Ders</p>
              <p className="text-2xl font-bold text-green-900">
                {timeRangeData.lessonsCompleted}
              </p>
              <p className="text-xs text-green-500 mt-1">{getTimeRangeLabel()}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm text-purple-600 font-medium">Tamamlanan Sınav</p>
              <p className="text-2xl font-bold text-purple-900">
                {timeRangeData.examsCompleted}
              </p>
              <p className="text-xs text-purple-500 mt-1">{getTimeRangeLabel()}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm text-yellow-600 font-medium">Ortalama Puan</p>
              <p className="text-2xl font-bold text-yellow-900">
                {timeRangeData.averageScore > 0 ? `${timeRangeData.averageScore}%` : '-'}
              </p>
              <p className="text-xs text-yellow-500 mt-1">{getTimeRangeLabel()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Progress */}
      {subjectProgress.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ders Bazında İlerleme</h3>
          <div className="space-y-4">
            {subjectProgress.map((subject, index) => (
              <div key={index} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
                  <span className="text-sm text-gray-500">{subject.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-4 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Süre:</span> {formatTime(subject.time)}
                  </div>
                  <div>
                    <span className="font-medium">Ders:</span> {subject.lessons}
                  </div>
                  <div>
                    <span className="font-medium">Sınav:</span> {subject.exams}
                  </div>
                  <div>
                    <span className="font-medium">Ortalama:</span> {subject.averageScore > 0 ? `${subject.averageScore}%` : '-'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Activity */}
      {userActivity.weeklyActivity && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Haftalık Aktivite
          </h3>
          <div className="space-y-2">
            {Object.entries(userActivity.weeklyActivity).map(([day, minutes]) => (
              <div key={day} className="flex items-center">
                <div className="w-20 text-sm text-gray-600">{day}</div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (minutes as number / 120) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-500 w-12 text-right">
                  {formatTime(minutes as number)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADHD Specific Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ADHD Odaklı Metrikler</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Odak Puanı</h4>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 rounded-full h-3 mr-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${timeRangeData.focusScore}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {timeRangeData.focusScore > 0 ? `${timeRangeData.focusScore}%` : 'Veri yok'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {getTimeRangeLabel()} odak performansı
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Öğrenme Stili Uyumu</h4>
            <div className="flex flex-wrap gap-2">
              {user.learningStyle.map(style => (
                <span
                  key={style}
                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                >
                  {style}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Toplam {userActivity.totalStudyTime > 0 ? formatTime(userActivity.totalStudyTime) : '0dk'} çalışma
            </p>
          </div>
        </div>

        {userActivity.studySessions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-3">Son Aktiviteler</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {userActivity.studySessions
                .slice(-5)
                .reverse()
                .map((session: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    {session.type === 'lesson' ? (
                      <BookOpen className="h-4 w-4 text-blue-500 mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 text-purple-500 mr-2" />
                    )}
                    <span className="text-gray-700">{session.topic}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <span>{formatTime(session.duration)}</span>
                    {session.score && (
                      <span className="text-green-600 font-medium">{session.score}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};