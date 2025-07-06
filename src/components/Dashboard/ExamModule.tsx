import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Loader2, Target } from 'lucide-react';
import { User } from '../../types';
import { geminiService } from '../../services/gemini';
import { DataStorage } from '../../utils/dataStorage';

interface ExamModuleProps {
  user: User;
}

export const ExamModule: React.FC<ExamModuleProps> = ({ user }) => {
  const [selectedTopic, setSelectedTopic] = useState('');
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

  const topics = [
    'Cebirsel İfadeler',
    'Denklemler',
    'Eşitsizlikler',
    'Üslü İfadeler',
    'Köklü İfadeler',
    'Veri Analizi',
    'Olasılık',
    'Üçgenler',
    'Çember ve Daire',
    'Prizmalar',
    'Piramitler',
    'Küreler',
    'Basit Makineler',
    'Işık',
    'Ses',
    'Elektrik',
    'Maddenin Yapısı',
    'Kimyasal Değişimler',
    'Hücre Bölünmesi',
    'Kalıtım',
    "Türkiye'nin Coğrafi Bölgeleri",
    'İklim ve Doğal Bitki Örtüsü',
    'Nüfus ve Yerleşme',
    'Ekonomik Faaliyetler',
    'Osmanlı Devleti',
    'Cumhuriyet Dönemi',
    'Atatürk İlkeleri',
    'Demokrasi ve İnsan Hakları',
  ];

  const handleGenerateExam = async () => {
    if (!selectedTopic) {
      setError('Lütfen bir konu seçin');
      return;
    }

    setLoading(true);
    setError('');
    
    // Start tracking study session
    const sessionId = DataStorage.startStudySession(user.id, 'exam', selectedTopic, selectedTopic);
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
      } else {
        setError(response.error || 'Sınav oluşturulamadı');
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
    
    if (currentSessionId) {
      // Calculate focus score based on time spent and performance
      const timeSpent = sessionStartTime ? (new Date().getTime() - sessionStartTime.getTime()) / (1000 * 60) : 0;
      const expectedTime = generatedExam.sorular.length * 2; // 2 minutes per question
      const timeRatio = Math.min(1, expectedTime / timeSpent);
      const focusScore = Math.round((score * 0.7) + (timeRatio * 30)); // 70% score, 30% time efficiency
      
      DataStorage.endStudySession(currentSessionId, score, focusScore);
      setCurrentSessionId(null);
      setSessionStartTime(null);
    }
    
    setShowResults(true);
  };

  const resetExam = () => {
    setGeneratedExam(null);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
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

  if (showResults) {
    const score = calculateScore();
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
              {currentSessionId && (
                <div className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <Clock className="h-3 w-3 mr-1" />
                  {getCurrentSessionTime()}
                </div>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Konu Seçin
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Bir konu seçin...</option>
              {topics.map(topic => (
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
              <option value="Kolay">Kolay</option>
              <option value="Orta">Orta</option>
              <option value="Zor">Zor</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Soru Sayısı
          </label>
          <select
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={5}>5 Soru</option>
            <option value={10}>10 Soru</option>
            <option value={15}>15 Soru</option>
            <option value={20}>20 Soru</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleGenerateExam}
          disabled={loading}
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