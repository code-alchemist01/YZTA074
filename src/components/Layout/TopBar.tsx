// src/components/Layout/TopBar.tsx

import React from 'react';
import { FaPhone, FaEnvelope, FaWhatsapp, FaInstagram, FaYoutube, FaFacebook, FaTiktok, FaTwitter } from 'react-icons/fa';

const TopBar: React.FC = () => {
  return (
    <div className="bg-[#0F1969] text-white text-sm px-4 py-1 flex flex-col sm:flex-row justify-between items-center">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
        <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 items-center mb-2 sm:mb-0">
          <div className="flex items-center gap-1"><FaPhone className="text-yellow-300" /> <span>+90 555 555 55 55</span></div>
          <div className="flex items-center gap-1"><FaWhatsapp className="text-green-300" /> <span>+90 555 555 55 55</span></div>
          <div className="flex items-center gap-1"><FaEnvelope className="text-red-300" /> <span>info@marathon.com</span></div>
        </div>
        <div className="flex gap-3 text-xl">
          <FaInstagram className="cursor-pointer hover:text-yellow-300 transition-colors" />
          <FaYoutube className="cursor-pointer hover:text-yellow-300 transition-colors" />
          <FaFacebook className="cursor-pointer hover:text-yellow-300 transition-colors" />
          <FaTiktok className="cursor-pointer hover:text-yellow-300 transition-colors" />
          <FaTwitter className="cursor-pointer hover:text-yellow-300 transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default TopBar;
