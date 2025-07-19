import React, { useState, useEffect } from 'react';
import { User, BookOpen, FileText, BarChart3, MessageCircle, Settings, LogOut } from 'lucide-react';
import { AuthService } from '../../utils/auth';
import { User as UserType } from '../../types';
import { LessonModule } from './LessonModule';
import { ExamModule } from './ExamModule';
import { ProfileModule } from './ProfileModule';
import { AnalyticsModule } from './AnalyticsModule';
import { MentorModule } from './MentorModule';

interface DashboardProps {
  user: UserType;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('lessons');

  const handleLogout = () => {
    AuthService.logout();
    onLogout();
  };

  const tabs = [
    { id: 'lessons', label: 'Konu Anlatımı', icon: BookOpen },
    { id: 'exams', label: 'Sınavlar', icon: FileText },
    { id: 'analytics', label: 'Analiz', icon: BarChart3 },
    { id: 'mentor', label: 'Sanal Rehber', icon: MessageCircle },
    { id: 'profile', label: 'Profil', icon: Settings },
  ];

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'lessons':
        return <LessonModule user={user} />;
      case 'exams':
        return <ExamModule user={user} />;
      case 'analytics':
        return <AnalyticsModule user={user} />;
      case 'mentor':
        return <MentorModule user={user} />;
      case 'profile':
        return <ProfileModule user={user} />;
      default:
        return <LessonModule user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">MARATHON</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Merhaba, {user.firstName} {user.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm">
              {renderActiveModule()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};