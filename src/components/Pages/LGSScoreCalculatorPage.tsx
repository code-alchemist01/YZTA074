// src/components/Pages/LGSScoreCalculatorPage.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react'; // Geri butonu için ikon
import TopBar from '../Layout/TopBar'; // TopBar bileşenini import ediyoruz
import Navbar from '../Layout/Navbar'; // Navbar bileşenini import ediyoruz
import Footer from '../Layout/Footer'; // Footer bileşenini import ediyoruz

const LGSScoreCalculatorPage: React.FC = () => {
  // Her ders için doğru ve yanlış sayıları state'leri
  const [turkishCorrect, setTurkishCorrect] = useState(0);
  const [turkishWrong, setTurkishWrong] = useState(0);
  const [mathCorrect, setMathCorrect] = useState(0);
  const [mathWrong, setMathWrong] = useState(0);
  const [scienceCorrect, setScienceCorrect] = useState(0);
  const [scienceWrong, setScienceWrong] = useState(0);
  const [historyCorrect, setHistoryCorrect] = useState(0);
  const [historyWrong, setHistoryWrong] = useState(0);
  const [religionCorrect, setReligionCorrect] = useState(0);
  const [religionWrong, setReligionWrong] = useState(0);
  const [englishCorrect, setEnglishCorrect] = useState(0);
  const [englishWrong, setEnglishWrong] = useState(0);

  const [calculatedScore, setCalculatedScore] = useState<string | null>(null);

  // Net doğru sayısını hesaplayan yardımcı fonksiyon
  const calculateNet = (correct: number, wrong: number) => {
    return correct - (wrong / 3);
  };

  // LGS puanını hesaplayan ana fonksiyon
  const calculateLGSScore = () => {
    const baseScore = 100; // Başlangıç puanı

    // Derslerin net doğru sayıları
    const netTurkish = calculateNet(turkishCorrect, turkishWrong);
    const netMath = calculateNet(mathCorrect, mathWrong);
    const netScience = calculateNet(scienceCorrect, scienceWrong);
    const netHistory = calculateNet(historyCorrect, historyWrong);
    const netReligion = calculateNet(religionCorrect, religionWrong);
    const netEnglish = calculateNet(englishCorrect, englishWrong);

    // Derslerin katsayıları ve puanları
    const turkishPoints = netTurkish * 4;
    const mathPoints = netMath * 4;
    const sciencePoints = netScience * 4;
    const historyPoints = netHistory * 1;
    const religionPoints = netReligion * 1;
    const englishPoints = netEnglish * 1;

    // Toplam puan
    const totalScore = baseScore + turkishPoints + mathPoints + sciencePoints + historyPoints + religionPoints + englishPoints;

    // Puanın negatif olmamasını sağla
    return Math.max(0, totalScore).toFixed(2); // İki ondalık basamağa yuvarla ve negatif olmasın
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const score = calculateLGSScore();
    setCalculatedScore(score);
  };

  // Input alanları için ortak bileşen
  const SubjectInput = ({ label, correct, setCorrect, wrong, setWrong, maxQuestions }: {
    label: string;
    correct: number;
    setCorrect: (value: number) => void;
    wrong: number;
    setWrong: (value: number) => void;
    maxQuestions: number;
  }) => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor={`${label.toLowerCase().replace(/\s/g, '-')}-correct`} className="block text-gray-700 text-sm font-semibold mb-2 text-left">
          {label} Doğru Sayısı
        </label>
        <input
          type="number"
          id={`${label.toLowerCase().replace(/\s/g, '-')}-correct`}
          value={correct}
          onChange={(e) => setCorrect(Math.max(0, Math.min(maxQuestions, Number(e.target.value))))}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-marathon-primary-blue"
          min="0"
          max={maxQuestions}
        />
      </div>
      <div>
        <label htmlFor={`${label.toLowerCase().replace(/\s/g, '-')}-wrong`} className="block text-gray-700 text-sm font-semibold mb-2 text-left">
          {label} Yanlış Sayısı
        </label>
        <input
          type="number"
          id={`${label.toLowerCase().replace(/\s/g, '-')}-wrong`}
          value={wrong}
          onChange={(e) => setWrong(Math.max(0, Math.min(maxQuestions, Number(e.target.value))))}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-marathon-primary-blue"
          min="0"
          max={maxQuestions}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen font-inter"> {/* Ana kapsayıcı */}
      <TopBar /> {/* TopBar bileşeni eklendi */}
      <Navbar /> {/* Navbar bileşeni eklendi */}

      <div className="flex flex-col items-center py-10 px-4 bg-gray-100 flex-grow"> {/* İçerik kapsayıcısı */}
        {/* Geri butonu */}
        <div className="w-full max-w-4xl flex justify-start mb-6">
          <Link
            to="/"
            className="flex items-center text-marathon-primary-blue hover:text-blue-700 transition-colors duration-200"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Ana Sayfaya Dön
          </Link>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-marathon-primary-blue mb-6">LGS Puan Hesaplama</h1>
          <p className="text-gray-600 mb-8">
            Doğru ve yanlış sayılarınızı girerek tahmini LGS puanınızı hesaplayın.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <SubjectInput label="Türkçe" correct={turkishCorrect} setCorrect={setTurkishCorrect} wrong={turkishWrong} setWrong={setTurkishWrong} maxQuestions={20} />
            <SubjectInput label="Matematik" correct={mathCorrect} setCorrect={setMathCorrect} wrong={mathWrong} setWrong={setMathWrong} maxQuestions={20} />
            <SubjectInput label="Fen Bilimleri" correct={scienceCorrect} setCorrect={setScienceCorrect} wrong={scienceWrong} setWrong={setScienceWrong} maxQuestions={20} />
            <SubjectInput label="T.C. İnkılap Tarihi ve Atatürkçülük" correct={historyCorrect} setCorrect={setHistoryCorrect} wrong={historyWrong} setWrong={setHistoryWrong} maxQuestions={10} />
            <SubjectInput label="Din Kültürü ve Ahlâk Bilgisi" correct={religionCorrect} setCorrect={setReligionCorrect} wrong={religionWrong} setWrong={setReligionWrong} maxQuestions={10} />
            <SubjectInput label="Yabancı Dil" correct={englishCorrect} setCorrect={setEnglishCorrect} wrong={englishWrong} setWrong={setEnglishWrong} maxQuestions={10} />

            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-marathon-primary-blue hover:bg-[#0A1240] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
              >
                Puanı Hesapla
              </button>
            </div>
          </form>

          {calculatedScore && (
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-md">
              <h3 className="text-xl font-bold mb-2">Tahmini LGS Puanınız:</h3>
              <p className="text-3xl font-extrabold text-marathon-primary-blue">{calculatedScore}</p>
            </div>
          )}
        </div>
      </div>
      <Footer /> {/* Footer bileşeni eklendi */}
    </div>
  );
};

export default LGSScoreCalculatorPage;
