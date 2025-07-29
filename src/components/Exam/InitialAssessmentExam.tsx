import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Eye, 
  EyeOff, 
  Camera, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  PlayCircle,
  PauseCircle
} from 'lucide-react';
import { LGSExam, LGSQuestion, ExamSession, ExamResult, User } from '../../types';
import { LGSExamService } from '../../services/lgsExamService';
import { EyeTrackingService } from '../../services/eyeTracking';

interface InitialAssessmentExamProps {
  user: User;
  onExamComplete: (result: ExamResult) => void;
}

export const InitialAssessmentExam: React.FC<InitialAssessmentExamProps> = ({
  user,
  onExamComplete
}) => {
  const navigate = useNavigate();
  const [exam, setExam] = useState<LGSExam | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isEyeTrackingEnabled, setIsEyeTrackingEnabled] = useState(false);
  const [eyeTrackingService] = useState(() => EyeTrackingService.getInstance());
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Exam ve session başlatma
  useEffect(() => {
    initializeExam();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      eyeTrackingService.cleanup();
    };
  }, []);

  // Timer
  useEffect(() => {
    if (examStarted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [examStarted, timeLeft]);

  const initializeExam = async () => {
    try {
      setIsLoading(true);
      
      // Sınav oluştur
      const createdExam = await LGSExamService.createInitialAssessmentExam(
        user.grade,
        user.learningStyle
      );
      setExam(createdExam);
      
      // Session başlat
      const createdSession = LGSExamService.startExamSession(createdExam.id, user.id);
      setSession(createdSession);
      
      // Timer ayarla (dakika -> saniye)
      setTimeLeft(createdExam.timeLimit * 60);
      
      // Kamera izni kontrol et
      checkCameraPermission();
      
      setIsLoading(false);
    } catch (error) {
      console.error('Exam initialization error:', error);
      setIsLoading(false);
    }
  };

  const checkCameraPermission = async () => {
    try {
      const hasPermission = await EyeTrackingService.checkCameraPermissions();
      setCameraPermission(hasPermission);
      
      if (hasPermission) {
        // Eye tracking'i başlatmaya hazır
        await eyeTrackingService.initialize();
      }
    } catch (error) {
      console.error('Camera permission check failed:', error);
      setCameraPermission(false);
    }
  };

  const startExam = async () => {
    if (!exam || !session) return;
    
    setExamStarted(true);
    setQuestionStartTime(Date.now());
    
    // Eye tracking başlat (izin varsa)
    if (cameraPermission && isEyeTrackingEnabled) {
      try {
        await eyeTrackingService.startTracking(user.id, session.id);
      } catch (error) {
        console.error('Eye tracking start failed:', error);
      }
    }
  };

  const selectAnswer = (answer: 'A' | 'B' | 'C' | 'D') => {
    setSelectedAnswer(answer);
  };

  const nextQuestion = () => {
    if (!exam || !session || selectedAnswer === null) return;
    
    // Cevabı kaydet
    const timeSpent = Date.now() - questionStartTime;
    const currentQuestion = exam.questions[currentQuestionIndex];
    
    LGSExamService.saveAnswer(
      session.id,
      currentQuestion.id,
      selectedAnswer,
      timeSpent
    );

    // Sonraki soruya geç
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setQuestionStartTime(Date.now());
    } else {
      // Sınav bitti
      finishExam();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setQuestionStartTime(Date.now());
    }
  };

  const finishExam = async () => {
    if (!session) return;
    
    try {
      // Eye tracking durdur
      const eyeTrackingData = eyeTrackingService.stopTracking();
      
      // Sınavı bitir ve sonuçları hesapla
      const result = await LGSExamService.finishExam(session.id, eyeTrackingData || undefined);
      
      // Sonuçları parent'a gönder
      onExamComplete(result);
    } catch (error) {
      console.error('Exam finish error:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Sınavınız hazırlanıyor...</p>
          <p className="text-sm text-gray-500 mt-2">Size özel sorular oluşturuluyor</p>
        </div>
      </div>
    );
  }

  if (!examStarted && exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                🎯 Hoşgeldiniz {user.firstName}!
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                {exam.title}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">Sınav Bilgileri</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{exam.questions.length}</div>
                    <div className="text-sm text-gray-600">Toplam Soru</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{exam.timeLimit} dk</div>
                    <div className="text-sm text-gray-600">Süre</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{exam.subjects.length}</div>
                    <div className="text-sm text-gray-600">Ders</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kamera İzni ve Göz Takibi */}
            <div className="mb-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="flex items-center text-lg font-semibold text-yellow-800 mb-4">
                  <Camera className="mr-2 h-5 w-5" />
                  Dikkat Analizi (İsteğe Bağlı)
                </h3>
                <p className="text-yellow-700 mb-4">
                  Sınav sırasında dikkat seviyenizi analiz etmek için kameranızı kullanabiliriz. 
                  Bu özellik tamamen isteğe bağlıdır ve verileriniz güvenli tutulur.
                </p>
                
                {cameraPermission === null ? (
                  <div className="flex items-center text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Kamera izni kontrol ediliyor...
                  </div>
                ) : cameraPermission ? (
                  <div>
                    <div className="flex items-center text-green-600 mb-3">
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Kamera erişimi mevcut
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isEyeTrackingEnabled}
                        onChange={(e) => setIsEyeTrackingEnabled(e.target.checked)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700">Dikkat analizi etkinleştir</span>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Kamera erişimi reddedildi. Sınavı kamera olmadan da yapabilirsiniz.
                  </div>
                )}
              </div>
            </div>

            {/* Başlat Butonu */}
            <div className="text-center">
              <button
                onClick={startExam}
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-lg"
              >
                <PlayCircle className="mr-3 h-6 w-6" />
                Sınava Başla
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Sınava başladığınızda geri sayım başlayacaktır
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!exam || !session || currentQuestionIndex >= exam.questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Sınav sonuçları hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">{exam.title}</h1>
              {isEyeTrackingEnabled && (
                <div className="flex items-center text-green-600">
                  <Eye className="h-4 w-4 mr-1" />
                  <span className="text-sm">Dikkat takibi aktif</span>
                </div>
              )}
            </div>
                         <div className="flex items-center space-x-4">
               <div className="flex items-center text-gray-600">
                 <Clock className="h-5 w-5 mr-2" />
                 <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
               </div>
               {/* Canlı Göz Takibi Görüntüsü */}
               {isEyeTrackingEnabled && cameraPermission && (
                 <div className="relative">
                   <div className="w-32 h-24 bg-gray-900 rounded-lg overflow-hidden border-2 border-green-500 relative">
                     <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                       <div className="text-white text-xs text-center">
                         <Eye className="h-4 w-4 mx-auto mb-1" />
                         <div>Kamera</div>
                       </div>
                     </div>
                     <div className="absolute top-1 right-1">
                       <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                     </div>
                     <div className="absolute inset-x-0 bottom-0 bg-green-500 h-1"></div>
                   </div>
                   <div className="absolute -bottom-5 left-0 right-0 text-center">
                     <span className="text-xs text-green-600 bg-white px-1 rounded">Göz Takibi Aktif</span>
                   </div>
                 </div>
               )}
             </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="text-sm text-gray-600">
            Soru {currentQuestionIndex + 1} / {exam.questions.length} - {currentQuestion.subject}
          </div>
        </div>

        {/* Question */}
        <div className="bg-white shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6 leading-relaxed">
              {currentQuestion.questionText}
            </h2>
            
            <div className="space-y-3">
              {Object.entries(currentQuestion.options).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => selectAnswer(key as 'A' | 'B' | 'C' | 'D')}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAnswer === key
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium mr-3">{key})</span>
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-b-xl shadow-lg p-6">
          <div className="flex justify-between items-center">
            <button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Önceki
            </button>
            
            <div className="text-sm text-gray-500">
              {selectedAnswer ? 'Cevap seçildi' : 'Lütfen bir cevap seçin'}
            </div>
            
            <button
              onClick={nextQuestion}
              disabled={!selectedAnswer}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {currentQuestionIndex === exam.questions.length - 1 ? 'Sınavı Bitir' : 'Sonraki'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 