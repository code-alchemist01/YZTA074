import React, { useState } from 'react';
import { User as UserIcon, Edit3, Save, X } from 'lucide-react';
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <UserIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Profil</h2>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Düzenle
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Kaydet
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4 mr-2" />
              İptal
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ad
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{user.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soyad
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{user.lastName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-posta
            </label>
            {isEditing ? (
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{user.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sınıf
            </label>
            <p className="text-gray-900">{user.grade}. Sınıf</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ADHD Tipi
            </label>
            {isEditing ? (
              <select
                value={editForm.adhdType}
                onChange={(e) => setEditForm({ ...editForm, adhdType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="none">ADHD Yok</option>
                <option value="inattentive">Dikkat Eksikliği</option>
                <option value="hyperactive">Hiperaktivite</option>
                <option value="combined">Kombine</option>
              </select>
            ) : (
              <p className="text-gray-900">
                {user.adhdType === 'none' && 'ADHD Yok'}
                {user.adhdType === 'inattentive' && 'Dikkat Eksikliği'}
                {user.adhdType === 'hyperactive' && 'Hiperaktivite'}
                {user.adhdType === 'combined' && 'Kombine'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kayıt Tarihi
            </label>
            <p className="text-gray-900">
              {new Date(user.joinDate).toLocaleDateString('tr-TR')}
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Öğrenme Stilleri
            </label>
            {isEditing ? (
              <div className="space-y-2">
                {['Görsel', 'İşitsel', 'Kinestetik', 'Okuma/Yazma'].map(style => (
                  <label key={style} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editForm.learningStyle.includes(style)}
                      onChange={() => handleLearningStyleChange(style)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{style}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.learningStyle.map(style => (
                  <span
                    key={style}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {style}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};