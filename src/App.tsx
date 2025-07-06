import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthService } from './utils/auth';
import { User } from './types';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { Dashboard } from './components/Dashboard/Dashboard';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleRegister = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <LoginForm
                onLogin={handleLogin}
                onSwitchToRegister={() => setAuthMode('register')}
              />
            }
          />
          <Route
            path="/register"
            element={
              <RegisterForm
                onRegister={handleRegister}
                onSwitchToLogin={() => setAuthMode('login')}
              />
            }
          />
          <Route
            path="/*"
            element={
              authMode === 'login' ? (
                <LoginForm
                  onLogin={handleLogin}
                  onSwitchToRegister={() => setAuthMode('register')}
                />
              ) : (
                <RegisterForm
                  onRegister={handleRegister}
                  onSwitchToLogin={() => setAuthMode('login')}
                />
              )
            }
          />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/dashboard/*"
          element={<Dashboard user={user} onLogout={handleLogout} />}
        />
        <Route
          path="/*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;