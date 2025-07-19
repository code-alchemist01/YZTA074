// src/components/Layout/Footer.tsx

import React from 'react';
import { FaInstagram, FaYoutube, FaFacebook, FaTiktok, FaTwitter } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <div id="contact" className="bg-gray-900 text-white py-10 md:py-16 px-6">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo and Social Media */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <img
            src="/images/marathon_logo-removebg-preview.png"
            alt="Marathon Logo"
            className="h-20 md:h-24 object-contain mb-4"
          />
          <p className="text-gray-400 text-sm mb-4">Eğitimde zirveye ulaşmanız için yanınızdayız.</p>
          <div className="flex gap-4 text-xl">
            <FaInstagram className="cursor-pointer hover:text-yellow-300 transition-colors" />
            <FaYoutube className="cursor-pointer hover:text-yellow-300 transition-colors" />
            <FaFacebook className="cursor-pointer hover:text-yellow-300 transition-colors" />
            <FaTiktok className="cursor-pointer hover:text-yellow-300 transition-colors" />
            <FaTwitter className="cursor-pointer hover:text-yellow-300 transition-colors" />
          </div>
        </div>

        {/* Packages Links */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4 text-center md:text-left">Paketlerimiz</h4>
          <ul className="text-gray-400 text-sm space-y-2 text-center md:text-left">
            <li><a href="#" className="hover:text-white transition-colors">LGS 2026</a></li>
          </ul>
        </div>

        {/* Other Links */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4 text-center md:text-left">Diğer</h4>
          <ul className="text-gray-400 text-sm space-y-2 text-center md:text-left">
            <li><a href="#" className="hover:text-white transition-colors">Örnek Videolar</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Puan Hesaplama Araçları</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Koç Günlükleri</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Dersler</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Bire Bir Ders, Rehberlik ve Soru Çözümü</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Yapay Zeka Desteği</a></li>
          </ul>
        </div>

        {/* Resources and Legal Information */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4 text-center md:text-left">Kaynaklar</h4>
          <ul className="text-gray-400 text-sm space-y-2 text-center md:text-left">
            <li><a href="#" className="hover:text-white transition-colors">Mesafeli Satış Sözleşmesi</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Kişisel Verilerin Korunması</a></li>
            <li><a href="#" className="hover:text-white transition-colors">MARATHON İşlem Rehberi</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Bilgi Güvenliği Politikası</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Çerez Politikası</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Bire Bir Kullanım Koşulları</a></li>
          </ul>
          {/* Payment Method Icons */}
          <div className="flex justify-center md:justify-start gap-4 mt-6">
            <img src="https://placehold.co/60x40/FFFFFF/000000?text=QR" alt="QR Code" className="rounded" />
            <img src="https://placehold.co/60x40/FFFFFF/000000?text=İyzico" alt="İyzico" className="rounded" />
            <img src="https://placehold.co/60x40/FFFFFF/000000?text=VISA" alt="VISA" className="rounded" />
            <img src="https://placehold.co/60x40/FFFFFF/000000?text=Troy" alt="Troy" className="rounded" />
          </div>
        </div>
      </div>
      <div className="mt-10 text-center text-gray-500 text-xs">
        © 2025 MARATHON. Tüm hakları saklıdır.
      </div>
    </div>
  );
};

export default Footer;
