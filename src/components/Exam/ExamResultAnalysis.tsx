import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  Eye,
  Brain,
  Target,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Home
} from 'lucide-react';
import { ExamResult, AttentionAnalysis, SubjectResult } from '../../types';

interface ExamResultAnalysisProps {
  result: ExamResult;
  onContinueToDashboard: () => void;
}

export const ExamResultAnalysis: React.FC<ExamResultAnalysisProps> = ({
  result,
  onContinueToDashboard
}) => {
  const navigate = useNavigate();

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 85) return CheckCircle;
    if (score >= 70) return AlertTriangle;
    return XCircle;
  };

  const getAttentionColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}s ${remainingMinutes}dk`;
    }
    return `${remainingMinutes}dk`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Award className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sınav Sonuçlarınız
          </h1>
          <p className="text-lg text-gray-600">
            Tebrikler! İlk değerlendirme sınavınızı tamamladınız.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Genel Skor */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {result.academicScore}
              </div>
              <div className="text-sm text-gray-600 mb-4">Genel Başarı Puanı</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${result.academicScore}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Dikkat Puanı */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getAttentionColor(result.attentionAnalysis.overallScore)}`}>
                {result.attentionAnalysis.overallScore}
              </div>
              <div className="text-sm text-gray-600 mb-4">Dikkat Puanı</div>
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Eye className="h-4 w-4 mr-1" />
                %{result.attentionAnalysis.focusPercentage} odaklanma
              </div>
            </div>
          </div>

          {/* Zaman Yönetimi */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {result.timeManagement.timeEfficiency}
              </div>
              <div className="text-sm text-gray-600 mb-4">Zaman Verimliliği</div>
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                {formatTime(result.timeManagement.totalTimeUsed)} kullanıldı
              </div>
            </div>
          </div>
        </div>

        {/* Detaylı Analiz */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Konu Bazında Performans */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Konu Bazında Performans
            </h3>
            <div className="space-y-4">
              {result.subjectBreakdown.map((subject: SubjectResult, index: number) => {
                const ScoreIcon = getScoreIcon(subject.score);
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <ScoreIcon className={`h-5 w-5 mr-3 ${getScoreColor(subject.score)}`} />
                      <div>
                        <div className="font-medium text-gray-900">{subject.subject}</div>
                        <div className="text-sm text-gray-600">
                          {subject.correctAnswers}/{subject.totalQuestions} doğru
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(subject.score)}`}>
                        %{subject.score}
                      </div>
                      <div className="text-xs text-gray-500">
                        Ort. {subject.averageTimePerQuestion}s
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dikkat Analizi Detayları */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              Dikkat Analizi
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Odaklanma Oranı</span>
                  <span className="text-lg font-bold text-blue-600">
                    %{result.attentionAnalysis.focusPercentage}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${result.attentionAnalysis.focusPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Dikkat Dağınıklığı</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {result.attentionAnalysis.distractionCount} kez
                  </span>
                </div>
                {result.attentionAnalysis.distractionCount > 0 && (
                  <div className="text-xs text-gray-600">
                    Ortalama süre: {Math.round(result.attentionAnalysis.averageDistractionDuration / 1000)}s
                  </div>
                )}
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Dikkat Paterni</span>
                  <span className="text-sm font-bold text-purple-600 capitalize">
                    {result.attentionAnalysis.attentionPattern === 'consistent' && 'Tutarlı'}
                    {result.attentionAnalysis.attentionPattern === 'variable' && 'Değişken'}
                    {result.attentionAnalysis.attentionPattern === 'declining' && 'Azalan'}
                    {result.attentionAnalysis.attentionPattern === 'improving' && 'Gelişen'}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  Yaş grubuna göre: 
                  <span className={`ml-1 font-medium ${
                    result.attentionAnalysis.comparedToAverage === 'above' ? 'text-green-600' :
                    result.attentionAnalysis.comparedToAverage === 'below' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {result.attentionAnalysis.comparedToAverage === 'above' && 'Ortalamanın üstünde'}
                    {result.attentionAnalysis.comparedToAverage === 'average' && 'Ortalama'}
                    {result.attentionAnalysis.comparedToAverage === 'below' && 'Ortalamanın altında'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Geri Bildirim ve Öneriler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Genel Geri Bildirim */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Genel Değerlendirme
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {result.overallFeedback}
              </pre>
            </div>
          </div>

          {/* Öneriler */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Gelişim Önerileri
            </h3>
            <div className="space-y-3">
              {result.nextSteps.map((step, index) => (
                <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                    {index + 1}
                  </div>
                  <div className="text-sm text-gray-700">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Zaman Analizi */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Zaman Yönetimi Analizi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatTime(result.timeManagement.totalTimeUsed)}
              </div>
              <div className="text-sm text-gray-600">Toplam Süre</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                %{result.timeManagement.timeEfficiency}
              </div>
              <div className="text-sm text-gray-600">Verimlilik</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {result.timeManagement.quickestQuestion}s
              </div>
              <div className="text-sm text-gray-600">En Hızlı</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {result.timeManagement.slowestQuestion}s
              </div>
              <div className="text-sm text-gray-600">En Yavaş</div>
            </div>
          </div>
          
          {/* Konu Bazında Zaman Dağılımı */}
          <div className="mt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Konu Bazında Zaman Dağılımı</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(result.timeManagement.timeDistribution).map(([subject, time]) => (
                <div key={subject} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{subject}</span>
                  <span className="text-sm text-gray-600">{formatTime(time)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Öğrenme Yolculuğunuza Başlayın!
            </h3>
            <p className="text-gray-600 mb-6">
              Bu analiz sonuçlarına göre size özel bir öğrenme planı hazırladık. 
              Dashboard'unuzda kişiselleştirilmiş dersler ve egzersizlerle gelişiminizi sürdürebilirsiniz.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onContinueToDashboard}
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                Dashboard'a Git
              </button>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="mr-2 h-5 w-5" />
                Ana Sayfaya Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 