import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, Target, BookOpen, FileText, Calendar, Award, PlusCircle, Save, Loader2 } from 'lucide-react';
import { DataStorage } from '../../utils/dataStorage';

// Uygulama içinde kullanılacak veri modelleri.
// Firebase'e gerek kalmadığı için types.ts gibi harici bir dosyaya ihtiyaç duyulmuyor.
interface User {
  id: string;
  name: string;
  learningStyle: string[];
}

interface ExamQuestion {
  id: string;
  text: string;
}

interface Exam {
  id: string;
  title: string;
  questions: ExamQuestion[];
}

interface EyeTrackingData {
  attentionScore: number;
  totalFocusTime: number;
  distractionEvents: string[];
}

interface Activity {
  id: string;
  type: 'lesson' | 'exam';
  subject: string;
  topic: string;
  duration: number;
  questionsSolved?: number;
  score?: number;
  examId?: string;
  timestamp: Date;
  completionPercentage: number;
  eyeTrackingData?: EyeTrackingData;
  userId: string;
}

interface AnalyticsModuleProps {
  user: User;
}

// LGS konuları için daha kapsamlı ve tutarlı bir veri yapısı
const lgsContent: { [key: string]: string[] } = {
  'Türkçe': [
    'Sözcükte Anlam ve Söz Varlığı',
    'Cümlede Anlam',
    'Söz Sanatları',
    'Paragrafta Anlam ve Yapı',
    'Yazım Kuralları ve Noktalama İşaretleri',
    'Metin Türleri ve Dil Bilgisi'
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
    'Genetik ve Biyoteknoloji'
  ],
  'T.C. İnkılap Tarihi ve Atatürkçülük': [
    'Bir Kahraman Doğuyor',
    'Milli Uyanış: Bağımsızlık Yolunda Atılan Adımlar',
    'Milli Bir Destan: Ya İstiklal Ya Ölüm!',
    'Çağdaş Türkiye Yolunda Adımlar'
  ],
  'Din Kültürü ve Ahlak Bilgisi': [
    'Kader İnancı',
    'Zekat ve Sadaka',
    'Din ve Hayat',
    'Hz. Muhammed\'in Hayatı'
  ],
  'İngilizce': [
    'Friendship',
    'Teen Life',
    'In The Kitchen',
    'On The Phone'
  ]
};

// Sınavlar için mock veri
const mockExams: Exam[] = [
  { id: 'lgs-exam-1', title: 'LGS Deneme Sınavı-1', questions: [{ id: 'q1', text: 'Soru 1' }, { id: 'q2', text: 'Soru 2' }, { id: 'q3', text: 'Soru 3' }] },
  { id: 'lgs-exam-2', title: 'LGS Deneme Sınavı-2', questions: [{ id: 'q1', text: 'Soru 1' }, { id: 'q2', text: 'Soru 2' }, { id: 'q3', text: 'Soru 3' }, { id: 'q4', text: 'Soru 4' }] },
];

// Kullanıcı verilerini DataStorage'dan yükle

export const AnalyticsModule: React.FC<AnalyticsModuleProps> = ({ user }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [userActivity, setUserActivity] = useState<Activity[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const initialSubject = Object.keys(lgsContent)[0];
  const initialTopic = lgsContent[initialSubject][0];

  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    type: 'lesson',
    subject: initialSubject,
    topic: initialTopic,
    duration: 30,
    questionsSolved: 20,
    score: 80,
    examId: mockExams[0].id
  });

  // Kullanıcı verilerini yükle
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const userActivityData = await DataStorage.getUserActivity(user.id);
        
        // StudySession'ları Activity formatına dönüştür
        const activities: Activity[] = userActivityData.studySessions.map(session => ({
          id: session.id,
          type: session.type,
          subject: session.subject,
          topic: session.topic,
          duration: session.duration,
          questionsSolved: session.type === 'exam' ? 1 : undefined,
          score: session.score,
          timestamp: session.startTime,
          completionPercentage: session.completed ? 100 : 0,
          eyeTrackingData: session.focusScore ? {
            attentionScore: session.focusScore,
            totalFocusTime: session.duration * 0.8,
            distractionEvents: []
          } : undefined,
          userId: session.userId
        }));

        setUserActivity(activities);
      } catch (error) {
        console.error('Error loading user data:', error);
        setUserActivity([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user.id]);

  // Yeni aktivite ekleme
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // DataStorage'a gerçek bir session başlat ve bitir
      const sessionId = await DataStorage.startStudySession(
        user.id, 
        newActivity.type!, 
        newActivity.subject!, 
        newActivity.topic!
      );

      // Session'ı hemen bitir (simülasyon)
      await DataStorage.endStudySession(
        sessionId, 
        newActivity.score, 
        newActivity.type === 'exam' ? Math.floor(Math.random() * 101) : 85
      );

      // Verileri yeniden yükle
      const userActivityData = await DataStorage.getUserActivity(user.id);
      const activities: Activity[] = userActivityData.studySessions.map(session => ({
        id: session.id,
        type: session.type,
        subject: session.subject,
        topic: session.topic,
        duration: session.duration,
        questionsSolved: session.type === 'exam' ? 1 : undefined,
        score: session.score,
        timestamp: session.startTime,
        completionPercentage: session.completed ? 100 : 0,
        eyeTrackingData: session.focusScore ? {
          attentionScore: session.focusScore,
          totalFocusTime: session.duration * 0.8,
          distractionEvents: []
        } : undefined,
        userId: session.userId
      }));

      setUserActivity(activities);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const getFilteredActivities = () => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }
    
    return userActivity.filter(activity => activity.timestamp >= startDate);
  };
  
  const filteredActivities = getFilteredActivities();

  // Veri hesaplama
  const totalStudyTime = filteredActivities.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const lessonsCompleted = filteredActivities.filter(a => a.type === 'lesson').length;
  const examsCompleted = filteredActivities.filter(a => a.type === 'exam').length;
  const examScores = filteredActivities.filter(a => a.type === 'exam' && a.score !== undefined).map(a => a.score);
  const averageScore = examScores.length > 0 ? Math.round(examScores.reduce((sum, score) => sum + score, 0) / examScores.length) : 0;
  const focusScores = filteredActivities.filter(a => a.eyeTrackingData).map(a => a.eyeTrackingData!.attentionScore);
  const focusScore = focusScores.length > 0 ? Math.round(focusScores.reduce((sum, score) => sum + score, 0) / focusScores.length) : 0;

  const weeklyActivity: { [key: string]: number } = {
    'Pazartesi': 0, 'Salı': 0, 'Çarşamba': 0, 'Perşembe': 0, 'Cuma': 0, 'Cumartesi': 0, 'Pazar': 0
  };
  filteredActivities.forEach(activity => {
    const day = new Date(activity.timestamp).toLocaleDateString('tr-TR', { weekday: 'long' });
    weeklyActivity[day] = (weeklyActivity[day] || 0) + (activity.duration || 0);
  });

  const getSubjectProgress = () => {
    const subjectMap: Record<string, { totalTime: number; lessons: number; exams: number; scores: number[]; topics: Set<string> }> = {};
    
    filteredActivities.forEach(session => {
      const subject = session.subject;
      if (!subject) return;

      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          totalTime: 0,
          lessons: 0,
          exams: 0,
          scores: [],
          topics: new Set()
        };
      }
      
      subjectMap[subject].totalTime += session.duration || 0;
      subjectMap[subject].topics.add(session.topic);
      
      if (session.type === 'lesson') {
        subjectMap[subject].lessons++;
      } else if (session.type === 'exam') {
        subjectMap[subject].exams++;
        if (session.score !== undefined) {
          subjectMap[subject].scores.push(session.score);
        }
      }
    });

    return Object.entries(subjectMap).map(([subject, data]) => {
      const averageScore = data.scores.length > 0 ? Math.round(data.scores.reduce((total, score) => total + score, 0) / data.scores.length) : 0;
      const totalTopics = lgsContent[subject]?.length || 1;
      return {
        subject,
        progress: Math.min(100, Math.round((data.topics.size / totalTopics) * 100)),
        time: data.totalTime,
        lessons: data.lessons,
        exams: data.exams,
        averageScore: averageScore
      };
    });
  };

  const subjectProgress = getSubjectProgress();

  const formatTime = (minutes: number) => {
    if (isNaN(minutes)) return '0dk';
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Analiz verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* ADD ACTIVITY FORM */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Aktivite Ekle</h3>
          <button onClick={() => setShowAddForm(!showAddForm)} className="text-blue-600 hover:text-blue-700">
            <PlusCircle className="h-6 w-6" />
          </button>
        </div>
        {showAddForm && (
          <form onSubmit={handleAddActivity} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Türü</label>
                <select
                  value={newActivity.type}
                  onChange={(e) => {
                    setNewActivity(prev => ({
                      ...prev,
                      type: e.target.value as 'lesson' | 'exam',
                      examId: e.target.value === 'exam' ? mockExams[0].id : undefined
                    }));
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="lesson">Ders Çalışma</option>
                  <option value="exam">Sınav</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ders</label>
                <select
                  value={newActivity.subject}
                  onChange={(e) => setNewActivity({ ...newActivity, subject: e.target.value, topic: lgsContent[e.target.value][0] })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {Object.keys(lgsContent).map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Konu</label>
              <select
                value={newActivity.topic}
                onChange={(e) => setNewActivity({ ...newActivity, topic: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {lgsContent[newActivity.subject || initialSubject]?.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Süre (dk)</label>
                <input
                  type="number"
                  value={newActivity.duration}
                  onChange={(e) => setNewActivity({ ...newActivity, duration: parseInt(e.target.value, 10) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              {newActivity.type === 'exam' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Puan (%)</label>
                    <input
                      type="number"
                      value={newActivity.score}
                      onChange={(e) => setNewActivity({ ...newActivity, score: parseInt(e.target.value, 10) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sınav Adı</label>
                    <select
                      value={newActivity.examId}
                      onChange={(e) => setNewActivity({ ...newActivity, examId: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {mockExams.map(exam => (
                        <option key={exam.id} value={exam.id}>{exam.title}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            <button
              type="submit"
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              Kaydet
            </button>
          </form>
        )}
      </div>

      {/* Analytics Display */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Performans Analizi</h2>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          title="Zaman aralığı seç"
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
                {formatTime(totalStudyTime)}
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
                {lessonsCompleted}
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
                {examsCompleted}
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
                {averageScore > 0 ? `${averageScore}%` : '-'}
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
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Haftalık Aktivite
        </h3>
        <div className="space-y-2">
          {Object.entries(weeklyActivity).map(([day, minutes]) => (
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

      {/* LGS Sınav Sonuçları */}
      {filteredActivities.filter(a => a.type === 'exam' && a.examId).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2 text-blue-600" />
            LGS Sınav Sonuçları
          </h3>
          <div className="space-y-4">
            {filteredActivities
              .filter(a => a.type === 'exam' && a.examId)
              .slice(-3).reverse()
              .map((session, index) => {
              const exam = mockExams.find(e => e.id === session.examId);
              if (!exam) return null;
              
              const academicScore = session.score || 0;
              const hasEyeTracking = session.eyeTrackingData;
              
              return (
                <div key={index} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{exam.title}</h4>
                      <p className="text-sm text-gray-500">
                        {session.timestamp.toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{academicScore}%</div>
                      <div className="text-sm text-gray-500">
                        {Math.round((academicScore / 100) * exam.questions.length)}/{exam.questions.length} doğru
                      </div>
                    </div>
                  </div>
                  
                  {hasEyeTracking && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center mb-2">
                        <BarChart3 className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-900">Dikkat Analizi</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700 font-medium">Dikkat Puanı:</span>
                          <div className="text-blue-900 font-bold">{session.eyeTrackingData.attentionScore}/100</div>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Odaklanma:</span>
                          <div className="text-blue-900 font-bold">
                            %{Math.round((session.eyeTrackingData.totalFocusTime / (session.duration || 1)) * 100)}
                          </div>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Dikkat Dağınıklığı:</span>
                          <div className="text-blue-900 font-bold">{session.eyeTrackingData.distractionEvents.length} kez</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Süre:</span>
                      <span className="ml-2 font-medium">
                        {formatTime(session.duration || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tamamlama:</span>
                      <span className="ml-2 font-medium">{session.completionPercentage || 100}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredActivities.filter(a => a.type === 'exam' && a.examId).length > 3 && (
            <div className="text-center mt-4">
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Tüm sınav sonuçlarını görüntüle ({filteredActivities.filter(a => a.type === 'exam').length} sınav)
              </button>
            </div>
          )}
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
                  style={{ width: `${focusScore}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {focusScore > 0 ? `${focusScore}%` : 'Veri yok'}
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
              Toplam {userActivity.length > 0 ? formatTime(totalStudyTime) : '0dk'} çalışma
            </p>
          </div>
        </div>

        {userActivity.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-3">Son Aktiviteler</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {userActivity
                .slice(0, 5)
                .map((session, index) => (
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
                    <span>{formatTime(session.duration || 0)}</span>
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
