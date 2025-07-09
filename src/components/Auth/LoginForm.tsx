import React, { useState, useEffect } from 'react';
import { User, LogIn, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { AuthService } from '../../utils/auth';
import { ApiService } from '../../services/api';

interface LoginFormProps {
  onLogin: (user: any) => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  // Check backend connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // First test with simple fetch
        await ApiService.testConnection();
        // Then test with health check
        const connected = await AuthService.checkBackendConnection();
        setBackendConnected(connected);
      } catch (error) {
        console.error('Connection check failed:', error);
        setBackendConnected(false);
      }
    };
    
    checkConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await AuthService.login(formData.email, formData.password);
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">MARATHON</h2>
          <p className="mt-2 text-sm text-gray-600">
            Kişiselleştirilmiş öğrenme platformuna giriş yapın
          </p>
          
          {/* Backend connection status */}
          <div className="mt-4 flex items-center justify-center space-x-2">
            {backendConnected === null ? (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                <span className="text-xs">Bağlantı kontrol ediliyor...</span>
              </div>
            ) : backendConnected ? (
              <div className="flex items-center space-x-1 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-xs">Sunucuya bağlı</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-amber-600">
                <WifiOff className="h-4 w-4" />
                <span className="text-xs">Sunucu bağlantısı yok (Yerel mod)</span>
              </div>
            )}
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                E-posta
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="E-posta adresi"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Şifre"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm text-center justify-center">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {backendConnected === false && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Backend sunucusu erişilemez</p>
                  <p className="mt-1">Yerel verilerle çalışmaya devam edebilirsiniz, ancak veriler senkronize olmayacak.</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
              </span>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Hesabınız yok mu? Kayıt olun
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};