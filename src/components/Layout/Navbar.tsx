// src/components/Layout/Navbar.tsx

import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <div className="bg-white shadow-md py-2 px-6 flex flex-col md:flex-row justify-between items-center z-20 relative sticky top-0">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        {/* LOGO - Ana sayfaya yönlendirme eklendi */}
        <Link to="/" className="flex-shrink-0">
          <img
            src="/images/marathon_logo-removebg-preview.png"
            alt="Marathon Logo"
            className="h-20 md:h-24 object-contain mb-4 md:mb-0 cursor-pointer"
          />
        </Link>
        <nav className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-base text-gray-700 font-semibold items-center">
          <a href="#packages" className="hover:text-marathon-primary-blue transition-colors">Paketlerimiz</a>
          <a href="#sample-videos" className="hover:text-marathon-primary-blue transition-colors">Örnek Videolar</a>
          <a href="#comments" className="hover:text-marathon-primary-blue transition-colors">Yorumlar ve Başarılarımız</a>
          <a href="#help" className="hover:text-marathon-primary-blue transition-colors">Yardım</a>
          <a href="#about" className="hover:text-marathon-primary-blue transition-colors">Biz Kimiz</a>
          <a href="#contact-form" className="hover:text-marathon-primary-blue transition-colors">İletişim</a>
          <Link
            to="/login"
            className="inline-flex items-center justify-center bg-marathon-primary-blue text-white font-bold py-3 px-6 text-lg rounded-full shadow-xl transition-all duration-300 ml-4 hover:bg-[#0A1240] hover:scale-105"
          >
            Giriş/Kayıt
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default Navbar;
