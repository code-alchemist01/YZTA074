// src/App.tsx

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthService } from './utils/auth';
import { User } from './types';

// Sayfa ve Bileşen Importları
import Homepage from './components/Pages/HomePage';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import LGSScoreCalculatorPage from './components/Pages/LGSScoreCalculatorPage'; // Yeni LGSScoreCalculatorPage'i import edin

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Uygulama yüklendiğinde mevcut kullanıcıyı kontrol et
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  // Kullanıcı giriş yaptığında çağrılacak fonksiyon
  const handleLogin = (userData: User) => {
    setUser(userData);
    // Giriş başarılı olduğunda dashboard'a yönlendirme yapılabilir (isteğe bağlı)
    // navigate('/dashboard'); // Eğer useNavigate kullanırsanız
  };

  // Kullanıcı kayıt olduğunda çağrılacak fonksiyon
  const handleRegister = (userData: User) => {
    setUser(userData);
    // Kayıt başarılı olduğunda dashboard'a yönlendirme yapılabilir (isteğe bağlı)
    // navigate('/dashboard'); // Eğer useNavigate kullanırsanız
  };

  // Kullanıcı çıkış yaptığında çağrılacak fonksiyon
  const handleLogout = () => {
    AuthService.logout(); // AuthService'deki logout metodunu çağır
    setUser(null);
    // Çıkış yapıldığında ana sayfaya yönlendirme yapılabilir
    // navigate('/'); // Eğer useNavigate kullanırsanız
  };

  // Yükleme durumu göstergesi
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 1. Herkesin erişebileceği (public) rotalar */}
      {/* Ana sayfa: Uygulama ilk açıldığında burası yüklenecek */}
      <Route path="/" element={<Homepage />} />

      {/* Giriş ve Kayıt sayfaları */}
      <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
      <Route path="/register" element={<RegisterForm onRegister={handleRegister} />} />
      
      {/* LGS Puan Hesaplama sayfası */}
      <Route path="/lgs-calculator" element={<LGSScoreCalculatorPage />} />

      {/* 2. Oturum Açmış Kullanıcılar İçin Korumalı Rotalar */}
      {user ? (
        <>
          {/* Dashboard ve altındaki tüm rotalar */}
          <Route path="/dashboard/*" element={<Dashboard user={user} onLogout={handleLogout} />} />

          {/* Kullanıcı oturum açmışsa, giriş/kayıt sayfalarına veya ana sayfaya gitmeye çalıştığında dashboard'a yönlendir */}
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Navigate to="/dashboard" replace />} />
          {/* Ana sayfadan login olunca dashboard'a yönlendirme */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </>
      ) : (
        /* 3. Oturum Açmamış Kullanıcılar İçin Kısıtlı Rotalar */
        <>
          {/* Oturum açmamış kullanıcı dashboard'a gitmeye çalışırsa giriş sayfasına yönlendir */}
          <Route path="/dashboard/*" element={<Navigate to="/login" replace />} />
          {/* Tanımlanmayan diğer tüm yolları ana sayfaya yönlendir (isteğe bağlı, login'e de yönlendirebilirsiniz) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}

      {/* Son çare: Yukarıdaki rotalardan hiçbiri eşleşmezse ve kullanıcı oturum açmamışsa ana sayfaya yönlendir */}
      {/* user kontrolü yukarıda yapıldığı için bu satır genellikle tetiklenmez, ancak güvenlik için bırakılabilir */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
