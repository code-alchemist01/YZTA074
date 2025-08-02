import React, { useState, useEffect, useRef } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Loader2, Target, Eye, EyeOff, Camera, AlertTriangle, PlayCircle, PauseCircle } from 'lucide-react';
import { User, EyeTrackingData } from '../../types';
import { geminiService } from '../../services/gemini';
import { DataStorage } from '../../utils/dataStorage';
import { EyeTrackingService } from '../../services/eyeTracking';

interface ExamModuleProps {
  user: User;
}

// Data structure for subjects and topics, updated with more realistic LGS curriculum
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
      setAvailableTopics(lgsSubjects[selectedSubject] || []);
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Sınavlar</h2>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ders Seçin
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            aria-label="Ders seçin"
          >
            <option value="">Bir ders seçin...</option>
            {Object.keys(lgsSubjects).map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Konu Seçin
          </label>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            disabled={!selectedSubject}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            aria-label="Konu seçin"
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
            aria-label="Zorluk seviyesi seçin"
          >
            <option value="Kolay">Kolay</option>
            <option value="Orta">Orta</option>
            <option value="Zor">Zor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Soru Sayısı
          </label>
          <select
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            aria-label="Soru sayısı seçin"
          >
            <option value={5}>5 Soru</option>
            <option value={10}>10 Soru</option>
            <option value={15}>15 Soru</option>
            <option value={20}>20 Soru</option>
          </select>
        </div>

        {/* Kamera İzni ve Göz Takibi */}
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="flex items-center text-lg font-semibold text-yellow-800 mb-3">
              <Camera className="mr-2 h-5 w-5" />
              Dikkat Analizi (İsteğe Bağlı)
            </h3>
            <p className="text-yellow-700 mb-3 text-sm">
              Sınav sırasında dikkat seviyenizi analiz etmek için kameranızı kullanabiliriz. 
              Kamera açıldığında sağ üst köşede kendinizi görebileceksiniz. 
              Bu özellik tamamen isteğe bağlıdır ve verileriniz güvenli tutulur.
            </p>
            
            {cameraPermission === null ? (
              <div className="flex items-center text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Kamera izni kontrol ediliyor...
              </div>
            ) : cameraPermission ? (
              <div>
                <div className="flex items-center text-green-600 mb-2">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Kamera erişimi mevcut
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isEyeTrackingEnabled}
                    onChange={(e) => setIsEyeTrackingEnabled(e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700 text-sm">Dikkat analizi etkinleştir</span>
                </label>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <AlertTriangle className="mr-2 h-4 w-4" />
                <span className="text-sm">Kamera erişimi reddedildi. Sınavı kamera olmadan da yapabilirsiniz.</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleGenerateExam}
          disabled={loading || !selectedSubject || !selectedTopic}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Sınav Oluşturuluyor...
            </>
          ) : (
            <>
              <Target className="h-4 w-4 mr-2" />
              Sınav Oluştur
            </>
          )}
        </button>
      </div>
    </div>
  );
};
