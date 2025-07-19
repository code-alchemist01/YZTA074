import React, { useState } from 'react';
import { MessageCircle, Send, Bot, User as UserIcon } from 'lucide-react';
import { User } from '../../types';
import { geminiService } from '../../services/gemini';

interface MentorModuleProps {
  user: User;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'mentor';
  timestamp: Date;
}

export const MentorModule: React.FC<MentorModuleProps> = ({ user }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Merhaba ${user.firstName}! Ben senin sanal rehberin. Çalışma planı, motivasyon veya ders ile ilgili sorularını yanıtlayabilirim. Nasıl yardımcı olabilirim?`,
      sender: 'mentor',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await geminiService.generateMentorResponse({
        studentQuestion: inputText,
        studentProfile: user,
        chatHistory: messages.slice(-5) // Last 5 messages for context
      });

      if (response.success) {
        const mentorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.data.mentor_cevabi,
          sender: 'mentor',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, mentorMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Üzgünüm, şu anda bir sorun yaşıyorum. Lütfen daha sonra tekrar deneyin.',
          sender: 'mentor',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.',
        sender: 'mentor',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center mb-6">
        <MessageCircle className="h-6 w-6 text-blue-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Sanal Rehber</h2>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-y-auto mb-4" style={{ maxHeight: '400px' }}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}
              >
                <div className="flex items-start">
                  {message.sender === 'mentor' && (
                    <Bot className="h-4 w-4 mt-0.5 mr-2 text-blue-600" />
                  )}
                  {message.sender === 'user' && (
                    <UserIcon className="h-4 w-4 mt-0.5 mr-2 text-blue-100" />
                  )}
                  <div>
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString('tr-TR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 border border-gray-200 max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg">
                <div className="flex items-center">
                  <Bot className="h-4 w-4 mr-2 text-blue-600" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="flex items-center space-x-2">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Mesajınızı yazın..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={2}
          disabled={loading}
        />
        <button
          onClick={handleSendMessage}
          disabled={loading || !inputText.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setInputText('Çalışma planımı nasıl düzenleyebilirim?')}
          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
        >
          Çalışma planı
        </button>
        <button
          onClick={() => setInputText('Motivasyonum düşük, ne yapabilirim?')}
          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
        >
          Motivasyon
        </button>
        <button
          onClick={() => setInputText('ADHD ile nasıl daha etkili çalışabilirim?')}
          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
        >
          ADHD ipuçları
        </button>
        <button
          onClick={() => setInputText('Sınavlara nasıl hazırlanmalıyım?')}
          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
        >
          Sınav hazırlığı
        </button>
      </div>
    </div>
  );
};