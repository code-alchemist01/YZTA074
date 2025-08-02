import React, { useState } from 'react';
import { MessageCircle, Send, Bot, User as UserIcon, Brain, Sparkles, Zap, Heart, Star, ChevronRight } from 'lucide-react';
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
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      {/* Modern Header */}
      <div className="relative bg-gradient-to-r from-pink-600 via-rose-600 to-orange-600 rounded-2xl p-8 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mr-4">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Sanal Rehber</h2>
              <p className="text-pink-100 mt-1">🤖 AI destekli kişisel öğrenme asistanınız</p>
            </div>
          </div>
          
          {/* AI Features */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center">
              <Sparkles className="h-5 w-5 text-white mr-2" />
              <span className="text-white text-sm font-medium">AI Powered</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center">
              <Zap className="h-5 w-5 text-white mr-2" />
              <span className="text-white text-sm font-medium">7/24 Destek</span>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full"></div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 overflow-y-auto mb-6 border border-gray-200 shadow-inner" style={{ maxHeight: '500px' }}>
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                } rounded-2xl px-5 py-4 transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-start">
                  {message.sender === 'mentor' && (
                    <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-full p-2 mr-3 shadow-sm">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {message.sender === 'user' && (
                    <div className="bg-white/20 rounded-full p-2 mr-3">
                      <UserIcon className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <p className={`text-xs mt-2 ${
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
            <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white text-gray-800 border border-gray-200 shadow-sm max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-5 py-4">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-full p-2 mr-3 shadow-sm">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Yanıtlıyor</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Mesajınızı yazın... 💭"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none bg-gray-50 text-gray-900 placeholder-gray-500"
              rows={2}
              disabled={loading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={loading || !inputText.trim()}
            className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white p-3 rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-pink-500" />
          Hızlı Sorular
        </h4>
        <div className="flex flex-wrap gap-3">
          {[
            { text: 'Çalışma planımı nasıl düzenleyebilirim?', emoji: '📅', color: 'from-blue-500 to-blue-600' },
            { text: 'Motivasyonum düşük, ne yapabilirim?', emoji: '💪', color: 'from-green-500 to-green-600' },
            { text: 'ADHD ile nasıl daha etkili çalışabilirim?', emoji: '🧠', color: 'from-purple-500 to-purple-600' },
            { text: 'Sınavlara nasıl hazırlanmalıyım?', emoji: '📚', color: 'from-orange-500 to-orange-600' }
          ].map((action, index) => (
            <button
              key={index}
              onClick={() => setInputText(action.text)}
              className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${action.color} text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300`}
            >
              <span className="mr-2">{action.emoji}</span>
              {action.text.split(',')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};