import React, { useState, useEffect, useRef } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Loader2, Target, Eye, EyeOff, Camera, AlertTriangle, PlayCircle, PauseCircle, Brain, Star, Award, ChevronRight, Book, Calculator, Atom, Globe, Users, Award as Trophy } from 'lucide-react';
import { User, EyeTrackingData } from '../../types';
import { geminiService } from '../../services/gemini';
import { DataStorage } from '../../utils/dataStorage';
import { EyeTrackingService } from '../../services/eyeTracking';

interface ExamModuleProps {
  user: User;
}

// Data structure for subjects and topics, updated with more realistic LGS curriculum
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

export const ExamModule: React.FC<ExamModuleProps> = ({ user }) => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState('Orta');
  const [questionCount, setQuestionCount] = useState(5);
  const [generatedExam, setGeneratedExam] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  // Göz takibi için state'ler
  const [isEyeTrackingEnabled, setIsEyeTrackingEnabled] = useState(false);
  const [eyeTrackingService] = useState(() => EyeTrackingService.getInstance());
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [isExamPaused, setIsExamPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState<string>('');
  const [eyeTrackingData, setEyeTrackingData] = useState<EyeTrackingData | null>(null);

  // Effect to update topics whenever a new subject is selected
  useEffect(() => {
    if (selectedSubject) {
      setAvailableTopics(lgsSubjects[selectedSubject]?.topics || []);
      setSelectedTopic(''); // Reset topic when subject changes
    } else {
      setAvailableTopics([]);
    }
  }, [selectedSubject]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      eyeTrackingService.cleanup();
    };
  }, [eyeTrackingService]);

  // Kamera izni kontrolü
  const checkCameraPermission = async () => {
    try {
      const hasPermission = await EyeTrackingService.checkCameraPermissions();
      setCameraPermission(hasPermission);
      
      if (hasPermission) {
        await eyeTrackingService.initialize();
        // Kamera izni varsa hemen preview'ı başlat
        if (isEyeTrackingEnabled) {
          startCameraPreview();
        }
      }
    } catch (error) {
      console.error('Camera permission check failed:', error);
      setCameraPermission(false);
    }
  };

  // Kamera önizlemesi başlat
  const startCameraPreview = async () => {
    try {
      await eyeTrackingService.startCameraPreview();
    } catch (error) {
      console.error('Camera preview start failed:', error);
    }
  };

  // İlk yüklemede kamera iznini kontrol et
  useEffect(() => {
    checkCameraPermission();
  }, []);

  // Göz takibi etkinleştirildiğinde kamera önizlemesini başlat
  useEffect(() => {
    if (isEyeTrackingEnabled && cameraPermission) {
      startCameraPreview();
    } else if (!isEyeTrackingEnabled) {
      // Göz takibi kapatıldığında preview'ı kapat
      eyeTrackingService.stopCameraPreview();
    }
  }, [isEyeTrackingEnabled, cameraPermission]);

  const handleGenerateExam = async () => {
    if (!selectedSubject) {
      setError('Lütfen bir ders seçin.');
      return;
    }
    if (!selectedTopic) {
      setError('Lütfen bir konu seçin');
      return;
    }

    setLoading(true);
    setError('');
    
    // Start tracking study session
    const sessionId = DataStorage.startStudySession(user.id, 'exam', selectedSubject, selectedTopic);
    setCurrentSessionId(sessionId);
    setSessionStartTime(new Date());
    
    try {
      const response = await geminiService.generateExam({
        topic: selectedTopic,
        questionCount,
        difficulty,
        questionTypes: ['Problem Çözme', 'Kavramsal'],
        studentProfile: user
      });

      if (response.success) {
        setGeneratedExam(response.data);
        setCurrentQuestion(0);
        setAnswers({});
        setShowResults(false);
        setError(''); // Clear any previous errors
        
        // Göz takibi etkinse başlat
        if (cameraPermission && isEyeTrackingEnabled && sessionId) {
          try {
            await eyeTrackingService.startTracking(user.id, sessionId, (reason: string) => {
              setIsExamPaused(true);
              setPauseReason(reason);
            });
          } catch (error) {
            console.error('Eye tracking start failed:', error);
            // Don't show this error to user as it's optional
          }
        }
        
        // Show success message if using fallback questions
        if (response.data.sinav_basligi.includes('Seviye Sınav')) {
          console.log('Using fallback questions due to API issues');
        }
      } else {
        console.error('Exam generation failed:', response.error);
        setError('Sınav oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.');
        // End session if failed
        if (sessionId) {
          DataStorage.endStudySession(sessionId);
          setCurrentSessionId(null);
          setSessionStartTime(null);
        }
      }
    } catch (err) {
      console.error('Unexpected error during exam generation:', err);
      setError('Beklenmeyen bir hata oluştu. İnternet bağlantınızı kontrol edip tekrar deneyin.');
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

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestion < generatedExam.sorular.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    if (!generatedExam || !generatedExam.sorular) return 0;
    
    const correctAnswers = generatedExam.sorular.filter((q: any) => 
      answers[q.soru_id] === q.dogru_cevap
    ).length;
    
    return Math.round((correctAnswers / generatedExam.sorular.length) * 100);
  };

  const handleFinishExam = () => {
    const score = calculateScore();
    
    // Göz takibi verilerini al
    const eyeData = eyeTrackingService.stopTracking();
    if (eyeData) {
      setEyeTrackingData(eyeData);
    }
    
    if (currentSessionId) {
      const timeSpent = sessionStartTime ? (new Date().getTime() - sessionStartTime.getTime()) / (1000 * 60) : 0;
      const expectedTime = generatedExam.sorular.length * 2;
      const timeRatio = Math.min(1, expectedTime / timeSpent);
      const focusScore = Math.round((score * 0.7) + (timeRatio * 30));
      
      DataStorage.endStudySession(currentSessionId, score, focusScore);
      setCurrentSessionId(null);
      setSessionStartTime(null);
    }
    
    setShowResults(true);
  };

  // Sınavı devam ettirme fonksiyonu
  const resumeExam = () => {
    setIsExamPaused(false);
    setPauseReason('');
  };

  const resetExam = () => {
    setGeneratedExam(null);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setSelectedSubject('');
    setSelectedTopic('');
  };

  const getCurrentSessionTime = () => {
    if (!sessionStartTime) return '0dk';
    const minutes = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / (1000 * 60));
    return `${minutes}dk`;
  };

  useEffect(() => {
    if (currentSessionId && sessionStartTime) {
      const interval = setInterval(() => {
        setSessionStartTime(new Date(sessionStartTime));
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [currentSessionId, sessionStartTime]);

  if (showResults) {
    const score = calculateScore();
    const attentionAnalysis = eyeTrackingData ? eyeTrackingService.generateAttentionAnalysis(eyeTrackingData) : null;
    
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            score >= 70 ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {score >= 70 ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sınav Tamamlandı!</h2>
          <p className="text-lg text-gray-600">
            Skorunuz: <span className="font-bold">{score}%</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {generatedExam.sorular.filter((q: any) => answers[q.soru_id] === q.dogru_cevap).length} / {generatedExam.sorular.length} doğru
          </p>
        </div>

        {/* Göz Takibi Analizi */}
        {attentionAnalysis && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Dikkat Analizi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{attentionAnalysis.overallScore}</div>
                <div className="text-sm text-gray-600">Dikkat Puanı</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{attentionAnalysis.focusPercentage}%</div>
                <div className="text-sm text-gray-600">Odaklanma Oranı</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{attentionAnalysis.distractionCount}</div>
                <div className="text-sm text-gray-600">Dikkat Dağınıklığı</div>
              </div>
            </div>
            {attentionAnalysis.recommendations.length > 0 && (
              <div className="bg-white rounded-md p-4">
                <h4 className="font-medium text-gray-900 mb-2">Öneriler:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {attentionAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 mb-6">
          {generatedExam.sorular.map((question: any, index: number) => {
            const userAnswer = answers[question.soru_id];
            const isCorrect = userAnswer === question.dogru_cevap;
            
            return (
              <div key={question.soru_id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    {index + 1}. {question.soru_metni}
                  </h3>
                  {isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 ml-2" />
                  )}
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Sizin cevabınız:</strong> {userAnswer || 'Boş'} 
                  <span className={`ml-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    ({isCorrect ? 'Doğru' : 'Yanlış'})
                  </span>
                </div>
                
                {!isCorrect && (
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Doğru cevap:</strong> {question.dogru_cevap}
                  </div>
                )}
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Açıklama:</strong> {question.cozum_metni}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={resetExam}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Yeni Sınav Yap
          </button>
        </div>
      </div>
    );
  }

  // Sınav duraklatıldıysa özel ekran göster
  if (isExamPaused) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-red-200 rounded-xl shadow-lg p-8 text-center">
            <div className="text-red-500 text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-red-700 mb-4">Sınav Duraklatıldı</h2>
            <p className="text-red-600 mb-6 text-lg leading-relaxed">{pauseReason}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">
                Dikkat seviyenizi artırmak için:
              </p>
              <ul className="text-red-600 text-sm mt-2 space-y-1">
                <li>• Derin nefes alın ve rahatlamaya çalışın</li>
                <li>• Ekrana doğrudan bakın</li>
                <li>• Çevrenizden dikkat dağıtıcı unsurları kaldırın</li>
                <li>• Hazır olduğunuzda sınava devam edin</li>
              </ul>
            </div>
            <button
              onClick={resumeExam}
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Sınava Devam Et
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (generatedExam && !showResults) {
    const question = generatedExam.sorular[currentQuestion];
    const progress = ((currentQuestion + 1) / generatedExam.sorular.length) * 100;
    
    return (
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">{generatedExam.sinav_basligi}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{currentQuestion + 1} / {generatedExam.sorular.length}</span>
              {isEyeTrackingEnabled && (
                <div className="flex items-center text-green-600">
                  <Eye className="h-4 w-4 mr-1" />
                  <span className="text-sm">Dikkat takibi aktif</span>
                </div>
              )}
              {currentSessionId && (
                <div className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <Clock className="h-3 w-3 mr-1" />
                  {getCurrentSessionTime()}
                </div>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-label="Sınav ilerleme durumu">
            <div 
              className={`bg-blue-600 h-2 rounded-full transition-all duration-300`}
              style={{ width: `${Math.round(progress)}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {question.soru_metni}
          </h3>
          
          <div className="space-y-2">
            {Object.entries(question.secenekler).map(([key, value]) => (
              <label key={key} className="flex items-center p-3 bg-white rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.soru_id}`}
                  value={key}
                  checked={answers[question.soru_id] === key}
                  onChange={() => handleAnswerSelect(question.soru_id, key)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">{key}) {value}</span>
              </label>
            ))}
          </div>

          {question.ipucu && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>İpucu:</strong> {question.ipucu}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Önceki
          </button>
          
          <div className="flex space-x-2">
            {currentQuestion < generatedExam.sorular.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sonraki
              </button>
            ) : (
              <button
                onClick={handleFinishExam}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Sınavı Bitir
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Modern Header */}
      <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl p-8 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mr-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Sınavlar</h2>
              <p className="text-purple-100 mt-1">Bilginizi test edin ve gelişiminizi takip edin</p>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full"></div>
      </div>

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
                value: "Kolay", 
                title: "Kolay", 
                description: "Temel sorular ve kavramlar",
                color: "from-green-500 to-emerald-500",
                bgColor: "bg-green-50",
                icon: "🌱"
              },
              { 
                value: "Orta", 
                title: "Orta", 
                description: "LGS seviyesinde standart sorular",
                color: "from-blue-500 to-indigo-500",
                bgColor: "bg-blue-50",
                icon: "📚"
              },
              { 
                value: "Zor", 
                title: "Zor", 
                description: "Analitik düşünme gerektiren sorular",
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

        {/* Soru Sayısı Kartları */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-6 w-6 text-indigo-600 mr-2" />
            Soru Sayısı
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: 5, label: "5 Soru", time: "~10 dk", icon: "⚡" },
              { value: 10, label: "10 Soru", time: "~20 dk", icon: "🎯" },
              { value: 15, label: "15 Soru", time: "~30 dk", icon: "📖" },
              { value: 20, label: "20 Soru", time: "~40 dk", icon: "🏆" }
            ].map((option) => {
              const isSelected = questionCount === option.value;
              
              return (
                <div
                  key={option.value}
                  onClick={() => setQuestionCount(option.value)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                    isSelected 
                      ? 'border-transparent bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xl mb-1">{option.icon}</div>
                    <h5 className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {option.label}
                    </h5>
                    <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                      {option.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kamera İzni ve Göz Takibi */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="flex items-center text-xl font-semibold text-amber-900 mb-4">
            <div className="bg-amber-100 rounded-lg p-2 mr-3">
              <Camera className="h-6 w-6 text-amber-600" />
            </div>
            📊 Dikkat Analizi (İsteğe Bağlı)
          </h3>
          <p className="text-amber-800 mb-4 leading-relaxed">
            Sınav sırasında dikkat seviyenizi analiz etmek için kameranızı kullanabiliriz. 
            Bu özellik tamamen isteğe bağlıdır ve verileriniz güvenli tutulur.
          </p>
          
          {cameraPermission === null ? (
            <div className="flex items-center text-amber-700 bg-amber-100 rounded-lg p-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600 mr-3"></div>
              <span className="font-medium">Kamera izni kontrol ediliyor...</span>
            </div>
          ) : cameraPermission ? (
            <div className="space-y-3">
              <div className="flex items-center text-green-700 bg-green-100 rounded-lg p-3">
                <CheckCircle className="mr-3 h-5 w-5" />
                <span className="font-medium">✅ Kamera erişimi mevcut</span>
              </div>
              <label className="flex items-center bg-white rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={isEyeTrackingEnabled}
                  onChange={(e) => setIsEyeTrackingEnabled(e.target.checked)}
                  className="mr-3 h-5 w-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
                <div>
                  <span className="text-gray-900 font-medium">Dikkat analizi etkinleştir</span>
                  <p className="text-gray-600 text-sm mt-1">Sınav sırasında dikkat dağılma uyarıları alın</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="flex items-center text-red-700 bg-red-100 rounded-lg p-3">
              <AlertTriangle className="mr-3 h-5 w-5" />
              <span className="font-medium">⚠️ Kamera erişimi reddedildi. Sınavı kamera olmadan da yapabilirsiniz.</span>
            </div>
          )}
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
            onClick={handleGenerateExam}
            disabled={loading || !selectedSubject || !selectedTopic}
            className="relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center">
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-3" />
                  <span>Kişiselleştirilmiş sınav oluşturuluyor...</span>
                </>
              ) : (
                <>
                  <Target className="h-5 w-5 mr-3 group-hover:animate-pulse" />
                  <span>Sınav Oluştur</span>
                  <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
