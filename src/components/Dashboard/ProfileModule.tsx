import React, { useState } from 'react';
import { User as UserIcon, Edit3, Save, X, Settings, Shield, Brain, Star, Award, Camera, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { User } from '../../types';
import { AuthService } from '../../utils/auth';

interface ProfileModuleProps {
  user: User;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    adhdType: user.adhdType,
    learningStyle: user.learningStyle,
  });

  const handleSave = () => {
    const updatedUser = {
      ...user,
      ...editForm,
    };
    
    AuthService.updateUser(updatedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      adhdType: user.adhdType,
      learningStyle: user.learningStyle,
    });
    setIsEditing(false);
  };

  const handleLearningStyleChange = (style: string) => {
    setEditForm(prev => ({
      ...prev,
      learningStyle: prev.learningStyle.includes(style)
        ? prev.learningStyle.filter(s => s !== style)
        : [...prev.learningStyle, style]
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Modern Header */}
      <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-8 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mr-4">
              <UserIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Profil Ayarları</h2>
              <p className="text-violet-100 mt-1">Hesap bilgilerinizi ve tercihlerinizi yönetin</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/20 flex items-center"
              >
                <Edit3 className="h-5 w-5 mr-2" />
                Düzenle
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 flex items-center"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Kaydet
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/20 flex items-center"
                >
                  <X className="h-5 w-5 mr-2" />
                  İptal
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full"></div>
      </div>

      {/* Profile Avatar Section */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl p-8 mb-8 border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg border border-gray-200">
              <Camera className="h-5 w-5 text-gray-600" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h3>
            <p className="text-gray-600 mt-1 flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              {user.email}
            </p>
            <div className="flex items-center mt-2 space-x-4">
              <div className="bg-violet-100 px-3 py-1 rounded-full">
                <span className="text-violet-700 text-sm font-medium">ADHD Öğrenci</span>
              </div>
              <div className="bg-blue-100 px-3 py-1 rounded-full">
                <span className="text-blue-700 text-sm font-medium">{user.adhdType}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8 shadow-sm">
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 rounded-lg p-2 mr-3">
            <Settings className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Kişisel Bilgiler</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ad */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <UserIcon className="h-4 w-4 mr-2 text-blue-500" />
              Ad
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white text-gray-900"
                placeholder="Adınızı girin"
              />
            ) : (
              <p className="text-lg font-medium text-gray-900 bg-white px-4 py-3 rounded-xl border border-gray-200">
                {user.firstName}
              </p>
            )}
          </div>

          {/* Soyad */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <UserIcon className="h-4 w-4 mr-2 text-blue-500" />
              Soyad
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white text-gray-900"
                placeholder="Soyadınızı girin"
              />
            ) : (
              <p className="text-lg font-medium text-gray-900 bg-white px-4 py-3 rounded-xl border border-gray-200">
                {user.lastName}
              </p>
            )}
          </div>

          {/* E-posta */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Mail className="h-4 w-4 mr-2 text-green-500" />
              E-posta
            </label>
            {isEditing ? (
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white text-gray-900"
                placeholder="E-posta adresinizi girin"
              />
            ) : (
              <p className="text-lg font-medium text-gray-900 bg-white px-4 py-3 rounded-xl border border-gray-200">
                {user.email}
              </p>
            )}
          </div>

          {/* Sınıf */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Award className="h-4 w-4 mr-2 text-amber-500" />
              Sınıf
            </label>
            <p className="text-lg font-medium text-gray-900 bg-white px-4 py-3 rounded-xl border border-gray-200">
              {user.grade}. Sınıf
            </p>
          </div>
        </div>
      </div>

      {/* ADHD Information Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8 shadow-sm">
        <div className="flex items-center mb-6">
          <div className="bg-purple-100 rounded-lg p-2 mr-3">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">ADHD Profili</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ADHD Tipi */}
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Brain className="h-4 w-4 mr-2 text-purple-500" />
              ADHD Tipi
            </label>
            {isEditing ? (
              <select
                value={editForm.adhdType}
                onChange={(e) => setEditForm({ ...editForm, adhdType: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="none">ADHD Yok</option>
                <option value="inattentive">Dikkat Eksikliği</option>
                <option value="hyperactive">Hiperaktivite</option>
                <option value="combined">Kombine</option>
              </select>
            ) : (
              <p className="text-lg font-medium text-gray-900 bg-white px-4 py-3 rounded-xl border border-gray-200">
                {user.adhdType === 'none' && '🔵 ADHD Yok'}
                {user.adhdType === 'inattentive' && '🟡 Dikkat Eksikliği'}
                {user.adhdType === 'hyperactive' && '🟠 Hiperaktivite'}
                {user.adhdType === 'combined' && '🔴 Kombine'}
              </p>
            )}
          </div>

          {/* Kayıt Tarihi */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Award className="h-4 w-4 mr-2 text-green-500" />
              Kayıt Tarihi
            </label>
            <p className="text-lg font-medium text-gray-900 bg-white px-4 py-3 rounded-xl border border-gray-200 flex items-center">
              📅 {new Date(user.joinDate).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
      </div>

      {/* Learning Styles Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="flex items-center mb-6">
          <div className="bg-green-100 rounded-lg p-2 mr-3">
            <Star className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Öğrenme Stilleri</h3>
        </div>
        
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Görsel', emoji: '👁️', description: 'Görsel materyallerle öğrenme', color: 'from-blue-500 to-blue-600' },
              { name: 'İşitsel', emoji: '🎧', description: 'Dinleyerek öğrenme', color: 'from-green-500 to-green-600' },
              { name: 'Kinestetik', emoji: '🤚', description: 'Dokunarak ve yaparak öğrenme', color: 'from-purple-500 to-purple-600' },
              { name: 'Okuma/Yazma', emoji: '📝', description: 'Metin tabanlı öğrenme', color: 'from-orange-500 to-orange-600' }
            ].map(style => {
              const isSelected = editForm.learningStyle.includes(style.name);
              return (
                <div 
                  key={style.name}
                  onClick={() => handleLearningStyleChange(style.name)}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                    isSelected 
                      ? `border-transparent bg-gradient-to-r ${style.color} text-white shadow-lg` 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">{style.emoji}</span>
                    <div>
                      <h4 className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {style.name}
                      </h4>
                      <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                        {style.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    {isSelected && (
                      <div className="bg-white/20 rounded-full p-1">
                        <Star className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {user.learningStyle.map(style => {
              const styleInfo = {
                'Görsel': { emoji: '👁️', color: 'from-blue-500 to-blue-600' },
                'İşitsel': { emoji: '🎧', color: 'from-green-500 to-green-600' },
                'Kinestetik': { emoji: '🤚', color: 'from-purple-500 to-purple-600' },
                'Okuma/Yazma': { emoji: '📝', color: 'from-orange-500 to-orange-600' }
              }[style] || { emoji: '⭐', color: 'from-gray-500 to-gray-600' };
              
              return (
                <div
                  key={style}
                  className={`bg-gradient-to-r ${styleInfo.color} text-white px-6 py-3 rounded-xl shadow-lg flex items-center font-medium`}
                >
                  <span className="mr-2">{styleInfo.emoji}</span>
                  {style}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};