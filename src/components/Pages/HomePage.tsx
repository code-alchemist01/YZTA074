// src/components/Pages/HomePage.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCalculator, // For calculator icons
  FaPlayCircle, // For video play icons
  FaQuoteLeft, // For review quotes
} from 'react-icons/fa';

// Lucide React icons
import {
  Brain,
  Target,
  Video,
  BookOpen,
  Award,
  Monitor,
  GraduationCap,
  BookText, // Türkçe için
  Calculator, // Matematik için
  Atom, // Fen Bilimleri için
  Landmark, // T.C. İnkılap Tarihi ve Atatürkçülük için
  Globe, // Yabancı Dil için
  BookOpenText, // Din Kültürü ve Ahlâk Bilgisi için
} from 'lucide-react';

import Button from '../ui/button'; // Correct relative path for button.tsx
import Chatbot from '../Chatbot/Chatbot'; // Chatbot bileşenini import ediyoruz
import TopBar from '../Layout/TopBar'; // Yeni TopBar bileşenini import ediyoruz
import Navbar from '../Layout/Navbar'; // Yeni Navbar bileşenini import ediyoruz
import Footer from '../Layout/Footer'; // Yeni Footer bileşenini import ediyoruz


const Homepage = () => {
  // State for current slide index
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Hero Section slide data, updated for ADHD focus
  const heroSlides = [
    {
      image: '/images/Blue and Yellow Illustrative Digital Education Presentation.png', // Senin birinci özel görselin
    },
    {
      image: '/images/Blue and Yellow Illustrative Digital Education Presentation (2).png', // Senin ikinci özel görselin
    },
    {
      image: '/images/Blue and Yellow Illustrative Digital Education Presentation (1).png', // Senin üçüncü özel görselin
    },
  ];

  // Automatic slide transition for the slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlideIndex((prevIndex) =>
        prevIndex === heroSlides.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(interval); // Clear interval when component unmounts
  }, [heroSlides.length]);

  // Package data (only LGS 2026 packages are kept)
  const packages = {
    'LGS 2026': [
      {
        id: 1,
        title: 'LGS Tüm Dersler 2026',
        price: '21.999 TL',
        features: [
          '1842 Ders Videosu',
          '9.100 Video Çözümlü Soru',
          'Akıllı Test Paneli',
          'Veliye Özel Gelişim Bilgilendirme Sistemi',
          'Bireysel Öğretmen Desteği',
          'Koçluk Hizmeti',
        ],
        icon: <GraduationCap size={40} className="text-marathon-primary-blue mb-2" />,
      },
      {
        id: 2,
        title: 'LGS Türkçe 2026',
        price: '5.999 TL',
        features: [
          'Ders Videoları',
          'Video Çözümlü Sorular',
          'Akıllı Test Paneli',
          'Konu Anlatımları',
        ],
        icon: <BookText size={40} className="text-marathon-primary-blue mb-2" />,
      },
      {
        id: 3,
        title: 'LGS Matematik 2026',
        price: '10.999 TL',
        features: [
          '819 Ders Videosu',
          '2.238 Video Çözümlü Soru',
          'Akıllı Test Paneli',
          'Video Çözümlü Deneme Sınavları',
          'Mobil Destekli Çalışma Programı',
        ],
        icon: <Calculator size={40} className="text-marathon-primary-blue mb-2" />,
      },
      {
        id: 4,
        title: 'LGS Fen Bilimleri 2026',
        price: '9.999 TL',
        features: [
          '528 Ders Videosu',
          '2.078 Video Çözümlü Soru',
          'Akıllı Test Paneli',
          'Video Çözümlü Deneme Sınavları',
          'Mobil Destekli Çalışma Programı',
        ],
        icon: <Atom size={40} className="text-marathon-primary-blue mb-2" />,
      },
      {
        id: 5,
        title: 'LGS T.C. İnkılap Tarihi ve Atatürkçülük 2026',
        price: '4.999 TL',
        features: [
          'Ders Videoları',
          'Video Çözümlü Sorular',
          'Akıllı Test Paneli',
          'Konu Anlatımları',
        ],
        icon: <Landmark size={40} className="text-marathon-primary-blue mb-2" />,
      },
      {
        id: 6,
        title: 'LGS Yabancı Dil 2026',
        price: '3.999 TL',
        features: [
          'Ders Videoları',
          'Video Çözümlü Sorular',
          'Akıllı Test Paneli',
          'Kelime Çalışmaları',
        ],
        icon: <Globe size={40} className="text-marathon-primary-blue mb-2" />,
      },
      {
        id: 7,
        title: 'LGS Din Kültürü ve Ahlâk Bilgisi 2026',
        price: '3.499 TL',
        features: [
          'Ders Videoları',
          'Video Çözümlü Sorular',
          'Akıllı Test Paneli',
          'Konu Özetleri',
        ],
        icon: <BookOpenText size={40} className="text-marathon-primary-blue mb-2" />,
      },
    ],
  };

  // Differences section data - Updated according to project report for ADHD focus
  const differences = [
    {
      icon: <Brain size={48} className="text-marathon-primary-blue mb-4" />,
      title: 'Yapay Zeka Destekli Akıllı Test Paneli ve Adaptif Müdahale',
      description: 'Öğrencinin uygulama içi davranışları analiz edilerek odaklanma ve enerji seviyeleri hakkında çıkarımlar yapılır; bu çıkarımlara göre adaptif müdahaleler ve kişiselleştirilmiş öneriler sunulur.',
    },
    {
      icon: <Video size={48} className="text-marathon-primary-blue mb-4" />,
      title: 'Biyolojik Ritimlere Uyumlu Zincirleme Çalışma Modülleri',
      description: '14 adet 30 dakikalık ultra-odaklanma modülü ve her modül sonrası 5 dakikalık biyomekanik molalarla ADHD beyninin doğal döngülerine uygun verimli çalışma sağlar.',
    },
    {
      icon: <BookOpen size={48} className="text-marathon-primary-blue mb-4" />,
      title: 'Video Çözümlü Geniş Soru Bankası ve AI Destekli Açıklamalar',
      description: 'Her sorunun detaylı video çözümleriyle eksiklerinizi kapatın. Yanlış cevaplanan veya talep edilen sorular için AI tarafından adım adım metin tabanlı çözümler ve ek açıklamalar üretilir.',
    },
    {
      icon: <Award size={48} className="text-marathon-primary-blue mb-4" />,
      title: 'ADHD Dostu Kişiselleştirilmiş Günlük Maraton Planlayıcı',
      description: 'Tek tıkla 7 saatlik çalışmayı 30 dakikalık modüllere ve 5 dakikalık molalara bölen, size özel otomatik programlarla sürdürülebilir verimlilik sağlayın.',
    },
    {
      icon: <Target size={48} className="text-marathon-primary-blue mb-4" />,
      title: 'Gerçek Dünya Simülasyonları ve ADHD Dostu Sınav Modu',
      description: 'Günlük 120 dakikalık LGS formatında AI destekli simülasyonlar ve dikkat dağılması tespitinde otomatik nefes molası önerileri ile gerçek sınav deneyimi sunar. Zaman baskısı ve formatı gerçek sınavla eşdeğer, ADHD dostu molalı versiyon.',
    },
    {
      icon: <Monitor size={48} className="text-marathon-primary-blue mb-4" />,
      title: 'Tüm Cihazlarda Kesintisiz Erişim ve Çöküş Önleyici Algoritma',
      description: 'Dilediğiniz yerden, dilediğiniz cihazdan erişim imkanı sunarken, odak puanınız 60 altına düştüğünde otomatik rota değişikliği ve simülasyon önerileri sunar.',
    },
    {
      icon: <GraduationCap size={48} className="text-marathon-primary-blue mb-4" />,
      title: 'Oyunlaştırılmış Ödül Mekanizmaları ve Sanal Rehber/Mentor',
      description: 'Tamamlanan her modüle "Zincir Halkası" kazanarak 3 halka karşılığında "Gerçek Dünya Simülasyon Hakkı" elde edin. Ayrıca, akademik ve motivasyonel konularda kişiselleştirilmiş tavsiyeler sunan AI destekli sanal rehber/mentor desteği.',
    },
  ];

  // Sample Videos data - Arka planlardaki yazılar kaldırıldı
  const sampleVideos = [
    { title: 'Veli Yorumları', count: '20 Video', thumbnail: 'https://placehold.co/300x180/FFD700/000000' }, // Yazısız sarı arka plan
    { title: 'LGS Örnek Videolar', count: '30 Video', thumbnail: 'https://placehold.co/300x180/FF6347/000000' }, // Yazısız turuncu arka plan
  ];

  // User Reviews data (made more generic to fit ADHD/LGS context)
  const userReviews = [
    {
      text: 'MARATHON sayesinde odaklanma sorunlarımı aştım ve akademik başarıma büyük katkı sağladım! Harika bir platform.',
      author: 'Ayşe Y., Öğrenci',
      image: 'images/png-transparent-child-computer-icons-avatar-user-avatar-child-face-orange-thumbnail.png',
    },
    {
      text: 'MARATHON\'un kişiselleştirilmiş programları sayesinde ders çalışmak artık çok daha keyifli ve verimli. Kesinlikle tavsiye ederim!',
      author: 'Hale D., Öğrenci',
      image: 'images/png-transparent-child-computer-icons-avatar-user-avatar-child-face-orange-thumbnail.png',
    },
    {
      text: 'LGS hazırlık sürecimde MARATHON en büyük destekçim oldu. Odaklanma modülleri sayesinde çok daha düzenli çalışabildim. Teşekkürler!',
      author: 'Elif S., Öğrenci',
      image: 'images/png-transparent-child-computer-icons-avatar-user-avatar-child-face-orange-thumbnail.png',
    },
    {
      text: 'MARATHON ile ders çalışmak artık bir eziyet değil, eğlenceli bir maraton! Hayallerime ulaşmamda çok yardımcı oldu.',
      author: 'Deniz A., Öğrenci',
      image: 'images/png-transparent-child-computer-icons-avatar-user-avatar-child-face-orange-thumbnail.png',
    },
  ];

  // Exam Score Calculation data (only LGS is kept)
  const examCalculators = [
    { title: 'LGS', subtitle: 'LGS Puan Hesaplama', icon: <FaCalculator size={40} className="text-white" />, bgColor: 'bg-marathon-primary-blue', path: '/lgs-calculator' },
  ];

  return (
    <div className="flex flex-col min-h-screen font-inter"> {/* Font Inter is added by default */}
      <TopBar /> {/* TopBar bileşeni eklendi */}
      <Navbar /> {/* Navbar bileşeni eklendi */}

      {/* Hero Section - Main Introduction Area (Updated as Slider) */}
      <div className="relative w-full min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden
                  bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-6 md:p-12">
        {/* Slider Content - Only the image is displayed */}
        <div className="container mx-auto flex items-center justify-center z-10 transition-opacity duration-700 ease-in-out w-full h-full">
          {/* Image Container - Now holds a single image that fills its space */}
          <div className="relative flex items-center justify-center w-full h-full">
            {/* Display only one image at a time, filling the container */}
            <img
              src={heroSlides[currentSlideIndex].image} // Using the 'image' property from heroSlides
              alt="MARATHON Tanıtım Görseli"
              className="w-full h-full object-contain rounded-lg shadow-2xl" // object-contain to fit the image without cropping
            />
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlideIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                index === currentSlideIndex ? 'bg-white' : 'bg-gray-400 hover:bg-gray-300'
              }`}
              aria-label={`Slayt ${index + 1}`}
            ></button>
          ))}
        </div>
      </div>

      {/* Packages Section */}
      <div id="packages" className="bg-white px-6 py-10 md:py-16">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 text-marathon-primary-blue">ADHD Odaklı LGS 2026 Paketlerimiz</h2>

        {/* Package Categories (Tabs) - Simplified as only LGS package is present */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8 max-w-4xl mx-auto">
          <button
            className="px-4 py-2 rounded-full text-sm md:text-base font-semibold bg-marathon-primary-blue text-white shadow-md"
          >
            LGS 2026
          </button>
        </div>

        {/* Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {packages['LGS 2026']?.map((pkg) => ( // Directly accessing LGS 2026 packages
            <div key={pkg.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 overflow-hidden">
              <div className="p-6">
                {/* Package Icon added here */}
                {pkg.icon && <div className="flex justify-center mb-3">{pkg.icon}</div>}
                <h3 className="text-xl font-bold text-marathon-primary-blue mb-2 text-center">{pkg.title}</h3>
                <ul className="text-gray-600 text-sm mb-4 list-disc pl-5">
                  {pkg.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                <div className="text-2xl font-extrabold text-green-600 mb-4 text-center">{pkg.price}</div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1">Detayları Gör</Button>
                  <Button variant="default" className="flex-1 bg-marathon-primary-blue hover:bg-[#0A1240]">Hemen Satın Al</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Our Difference Section */}
      <div className="px-6 py-10 md:py-16 bg-gray-50">
        <h2 className="text-2xl md:text-4xl font-bold mb-8 text-center text-marathon-primary-blue">MARATHON'u Farklı Kılan Ne?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {differences.map((diff, index) => (
            <div key={index} className="p-6 bg-white rounded-xl shadow-lg flex flex-col items-center text-center border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              {diff.icon}
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{diff.title}</h3>
              <p className="text-gray-600 text-sm">{diff.description}</p>
            </div>
          ))}
        </div>
      </div>

      
      {/* User Reviews Section */}
      <div id="comments" className="px-6 py-10 md:py-16 bg-gray-50">
        <h2 className="text-2xl md:text-4xl font-bold mb-8 text-center text-marathon-primary-blue">Kullanıcı Yorumları ve Başarılarımız</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {userReviews.map((review, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <FaQuoteLeft className="text-marathon-primary-blue text-4xl mb-4" /> {/* Renk güncellendi */}
              <p className="text-gray-700 text-base italic mb-4">"{review.text}"</p>
              <img src={review.image} alt={`Yorum Yapan: ${review.author}`} className="w-24 h-24 rounded-full object-cover mb-2" />
              <p className="font-semibold text-gray-800">{review.author}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Exam Score Calculation Section */}
      <div className="px-6 py-10 md:py-16 bg-white">
        <h2 className="text-2xl md:text-4xl font-bold mb-8 text-center text-marathon-primary-blue">
          MARATHON ile Sınav Puanınızı Hesaplayın!
        </h2>
        {/* Changed grid to flex and added justify-center for centering the single card */}
        <div className="flex justify-center max-w-6xl mx-auto">
          {examCalculators.map((exam, index) => (
            // Link bileşeni eklendi
            <Link
              key={index}
              to={exam.path} // Yeni sayfaya yönlendirme
              className={`p-6 rounded-xl shadow-lg flex flex-col items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform duration-300 ${exam.bgColor}`}
            >
              {exam.icon}
              <h3 className="text-xl font-bold mt-4 mb-1">{exam.title}</h3>
              <p className="text-sm font-light">{exam.subtitle}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Contact Form Section */}
      <div id="contact-form" className="px-6 py-10 md:py-16 bg-gray-100">
        <h2 className="text-2xl md:text-4xl font-bold mb-8 text-center text-marathon-primary-blue">Bize Ulaşın</h2>
        <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">Adınız Soyadınız</label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Adınız Soyadınız"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">E-posta Adresiniz</label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ornek@eposta.com"
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-gray-700 text-sm font-semibold mb-2">Konu</label>
              <input
                type="text"
                id="subject"
                name="subject"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mesajınızın konusu"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-gray-700 text-sm font-semibold mb-2">Mesajınız</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                placeholder="Mesajınızı buraya yazın..."
              ></textarea>
            </div>
            <Button type="submit" variant="default" className="w-full bg-marathon-primary-blue hover:bg-[#0A1240] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200">
              Mesaj Gönder
            </Button>
          </form>
        </div>
      </div>

      <Footer /> {/* Footer bileşeni eklendi */}
      {/* Chatbot bileşeni sayfanın en altına eklendi */}
      <Chatbot />
    </div>
  );
};

export default Homepage;
