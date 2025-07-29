import React from 'react';
import { 
  Brain, 
  Eye, 
  Clock, 
  Target, 
  BookOpen, 
  CheckCircle, 
  Zap,
  ArrowRight 
} from 'lucide-react';
import { User } from '../../types';

interface PreExamWelcomeProps {
  user: User;
  onStartExam: () => void;
}

export const PreExamWelcome: React.FC<PreExamWelcomeProps> = ({
  user,
  onStartExam
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Hoşgeldin {user.firstName}! 🎉
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Hadi dikkat eksikliğinizi ve seviyenizi ölçmek için bir deneme yapalım 😊
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {/* Ana Açıklama */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Size Özel İlk Değerlendirme Sınavı
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                Bu sınav sayesinde öğrenme tarzınızı, dikkat seviyenizi ve akademik seviyenizi belirleyeceğiz. 
                Sonuçlara göre size en uygun öğrenme planını hazırlayacağız!
              </p>
            </div>

            {/* Özellikler */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full mb-4">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">LGS Formatı</h3>
                <p className="text-sm text-gray-600">
                  Gerçek LGS sınavına uygun sorular
                </p>
              </div>

              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-full mb-4">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Dikkat Takibi</h3>
                <p className="text-sm text-gray-600">
                  Gelişmiş göz takibi teknolojisi
                </p>
              </div>

              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Kişisel Analiz</h3>
                <p className="text-sm text-gray-600">
                  Size özel detaylı performans raporu
                </p>
              </div>

              <div className="text-center p-6 bg-orange-50 rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-600 rounded-full mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Anında Sonuç</h3>
                <p className="text-sm text-gray-600">
                  Sınav biter bitmez detaylı analiz
                </p>
              </div>
            </div>

            {/* Sınav Bilgileri */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Sınav Hakkında
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">90 Dakika</div>
                    <div className="text-sm text-gray-600">Toplam süre</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">{user.grade === '8' ? 'LGS 2025' : 'LGS 2024'} Formatı</div>
                    <div className="text-sm text-gray-600">Sınıfınıza uygun</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Tüm Dersler</div>
                    <div className="text-sm text-gray-600">Matematik, Türkçe, Fen...</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ADHD Bilgilendirme */}
            {user.adhdType !== 'none' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Size Özel Dikkat Analizi
                </h3>
                <p className="text-blue-800 leading-relaxed">
                  ADHD profilinize göre dikkat seviyenizi özel olarak analiz edeceğiz. 
                  Göz takibi teknolojisi ile odaklanma sürenizi, dikkat dağınıklığı paternlerinizi 
                  ve en verimli çalışma saatlerinizi belirleyeceğiz.
                </p>
              </div>
            )}

            {/* Öğrenme Stili Bilgilendirme */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-green-900 mb-3">
                Öğrenme Stilinize Uygun Sorular
              </h3>
              <p className="text-green-800 mb-3">
                Seçtiğiniz öğrenme stillerine göre size en uygun soru formatlarını hazırladık:
              </p>
              <div className="flex flex-wrap gap-2">
                {user.learningStyle.map(style => (
                  <span
                    key={style}
                    className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium"
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>

            {/* Motivasyonel Mesaj */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Hazır mısın?
              </h3>
              <p className="text-gray-600">
                Bu sadece bir değerlendirme sınavı. Rahat ol, elinden geleni yap ve öğrenme yolculuğuna başla!
              </p>
            </div>

            {/* Başlat Butonu */}
            <div className="text-center">
              <button
                onClick={onStartExam}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span className="mr-3">Hazırım, Başlayalım!</span>
                <ArrowRight className="h-6 w-6" />
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Sınava başladığınızda geri sayım başlayacak
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 