// src/components/Chatbot/Chatbot.tsx

import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaSpinner } from 'react-icons/fa'; // İkonlar için

interface Message {
  role: 'user' | 'model';
  text: string;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false); // Chatbot penceresinin açık/kapalı durumu
  const [messages, setMessages] = useState<Message[]>([]); // Sohbet mesajları
  const [input, setInput] = useState(''); // Kullanıcı giriş alanı
  const [isLoading, setIsLoading] = useState(false); // Yükleme durumu
  const messagesEndRef = useRef<HTMLDivElement>(null); // Mesajların en altına kaydırmak için

  // Mesajlar güncellendiğinde en alta kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Chatbot açıldığında ilk mesajı gönder
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'model', text: 'Merhaba! Size nasıl yardımcı olabilirim?' }]);
    }
  }, [isOpen, messages.length]);

  // Simüle edilmiş Gemini yanıtı veren fonksiyon
  const getSimulatedGeminiResponse = (userMessage: string): string => {
    const lowerCaseMessage = userMessage.toLowerCase();

    // Yanıt seçenekleri dizileri
    const greetings = [
      'Merhaba! Size nasıl yardımcı olabilirim?',
      'Selam! MARATHON hakkında merak ettiğiniz bir şey var mı?',
      'Hoş geldiniz! Size özel bir sorunuz mu var?',
    ];

    const packageInfo = [
      'MARATHON olarak LGS ve diğer sınıf seviyeleri için çeşitli eğitim paketlerimiz bulunmaktadır. Hangi paket hakkında bilgi almak istersiniz?',
      'Eğitim paketlerimiz hakkında detaylı bilgi verebilirim. LGS paketlerimizi incelediniz mi?',
      'Evet, farklı sınıf seviyelerine uygun çeşitli paketlerimiz var. Fiyatlar ve içerikler için web sitemizdeki "Paketlerimiz" bölümüne göz atabilirsiniz.',
    ];

    const lgsInfo = [
      'LGS paketlerimiz 1842 ders videosu, 9.100 video çözümlü soru ve akıllı test paneli içermektedir. Başarıya ulaşmanız için ihtiyacınız olan her şey burada!',
      'LGS için özel olarak hazırlanmış kapsamlı paketlerimiz var. Video dersler, soru bankaları ve rehberlik hizmeti sunuyoruz.',
      'LGS sınavına hazırlanırken yanınızdayız! Paketlerimizle konuları pekiştirebilir, deneme sınavlarıyla kendinizi deneyebilirsiniz.',
    ];

    const contactInfo = [
      'Bize info@marathon.com adresinden e-posta gönderebilir veya +90 555 555 55 55 numaralı telefondan ulaşabilirsiniz. Size yardımcı olmaktan mutluluk duyarız.',
      'İletişim için e-posta veya telefon numaramızı kullanabilirsiniz. Web sitemizdeki iletişim formunu da doldurabilirsiniz.',
      'Herhangi bir sorunuz olursa bize ulaşmaktan çekinmeyin. İletişim bilgilerimiz web sitemizde mevcut.',
    ];

    const thanksResponses = [
      'Rica ederim, başka bir konuda yardımcı olabilir miyim?',
      'Ne demek, seve seve yardımcı olurum. Başka bir sorunuz var mı?',
      'Memnuniyetle! Başka bir konuda bilgi almak ister misiniz?',
    ];

    const coachingInfo = [
      'Evet, bireysel öğretmen desteği ve koçluk hizmetlerimiz mevcuttur. Mobil uygulamamız üzerinden de koçunuza ulaşabilir, çalışma programınızı takip edebilirsiniz.',
      'Koçluk hizmetlerimizle öğrencilere kişiselleştirilmiş rehberlik sunuyoruz. Detaylar için web sitemizdeki ilgili bölümü inceleyebilirsiniz.',
    ];

    const defaultResponses = [
      'Anladım. Bu konuda size nasıl daha net yardımcı olabilirim? Lütfen sorunuzu biraz daha detaylandırın.',
      'Üzgünüm, tam olarak ne demek istediğinizi anlayamadım. Belki başka bir şekilde sorabilirsiniz?',
      'Şu an için bu konuda size yardımcı olamıyorum. Belki anahtar kelimeler kullanarak tekrar deneyebilirsiniz?',
      'MARATHON ile ilgili genel konularda size yardımcı olabilirim. Ne hakkında konuşmak istersiniz?',
    ];

    // Anahtar kelimelere göre yanıt seçimi
    if (lowerCaseMessage.includes('merhaba') || lowerCaseMessage.includes('selam') || lowerCaseMessage.includes('hi')) {
      return greetings[Math.floor(Math.random() * greetings.length)];
    } else if (lowerCaseMessage.includes('paketler') || lowerCaseMessage.includes('fiyat') || lowerCaseMessage.includes('ücret') || lowerCaseMessage.includes('dersler')) {
      return packageInfo[Math.floor(Math.random() * packageInfo.length)];
    } else if (lowerCaseMessage.includes('lgs')) {
      return lgsInfo[Math.floor(Math.random() * lgsInfo.length)];
    } else if (lowerCaseMessage.includes('iletişim') || lowerCaseMessage.includes('ulaşmak') || lowerCaseMessage.includes('telefon') || lowerCaseMessage.includes('e-posta')) {
      return contactInfo[Math.floor(Math.random() * contactInfo.length)];
    } else if (lowerCaseMessage.includes('teşekkürler') || lowerCaseMessage.includes('sağ ol') || lowerCaseMessage.includes('eyvallah')) {
      return thanksResponses[Math.floor(Math.random() * thanksResponses.length)];
    } else if (lowerCaseMessage.includes('koçluk') || lowerCaseMessage.includes('rehberlik') || lowerCaseMessage.includes('öğretmen')) {
      return coachingInfo[Math.floor(Math.random() * coachingInfo.length)];
    } else {
      return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simüle edilmiş yanıtı bekle (daha doğal bir gecikme için)
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200)); // 0.8 ile 2 saniye arası rastgele bekleme

    const simulatedResponse = getSimulatedGeminiResponse(userMessage.text);
    setMessages((prevMessages) => [...prevMessages, { role: 'model', text: simulatedResponse }]);

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50"> {/* Sağ alt köşeye sabitlenmiş */}
      {/* Chatbot Açma/Kapama Butonu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={isOpen ? "Chatbot'u kapat" : "Chatbot'u aç"}
      >
        {isOpen ? <FaTimes size={24} /> : <FaRobot size={24} />}
      </button>

      {/* Chatbot Penceresi */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white p-3 flex justify-between items-center rounded-t-lg">
            <h3 className="font-semibold">MARATHON</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 focus:outline-none"
              aria-label="Chatbot penceresini kapat"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Mesaj Alanı */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-2 rounded-lg shadow-sm text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} /> {/* Mesajların en altına kaydırmak için referans */}
          </div>

          {/* Giriş Alanı */}
          <div className="p-3 border-t border-gray-200 bg-white flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Mesajınızı yazın..."
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              className={`ml-2 p-2 rounded-full ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={isLoading}
              aria-label="Mesaj gönder"
            >
              {isLoading ? <FaSpinner className="animate-spin" size={20} /> : <FaPaperPlane size={20} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
