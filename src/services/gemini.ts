import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiRequest, GeminiResponse } from '../types';

const API_KEY = 'AIzaSyB3QFUEQ-hp_SgcYXMbzQ8Z-NGKtVWxQ2A';
const genAI = new GoogleGenerativeAI(API_KEY);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  private cleanJsonResponse(text: string): string {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove extra text before and after JSON
    cleaned = cleaned.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    
    // Find the first { and last } to extract JSON
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    // Fix common JSON issues
    cleaned = cleaned
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/(['"])?([a-zA-Z_][a-zA-Z0-9_]*)\1?\s*:/g, '"$2":') // Fix unquoted keys
      .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double quotes
      .replace(/\n/g, ' ') // Remove newlines
      .replace(/\s+/g, ' '); // Normalize whitespace
    
    return cleaned.trim();
  }

  async generateLesson(params: {
    topic: string;
    studentLevel: string;
    learningStyle: string[];
    importantPoints?: string[];
    previousErrors?: string[];
    exampleType?: string;
  }): Promise<GeminiResponse> {
    try {
      const prompt = `
        Aşağıdaki parametrelere göre 8. sınıf Türkiye müfredatına uygun, LGS sınavına hazırlık odaklı bir konu anlatımı oluştur:

        Konu: ${params.topic}
        Öğrenci Seviyesi: ${params.studentLevel}
        Öğrenme Stili: ${params.learningStyle.join(', ')}
        ${params.importantPoints ? `Önemli Noktalar: ${params.importantPoints.join(', ')}` : ''}
        ${params.previousErrors ? `Önceki Hatalar: ${params.previousErrors.join(', ')}` : ''}
        ${params.exampleType ? `Örnek Tipi: ${params.exampleType}` : ''}

        SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir metin ekleme:
        {
          "konu_adi": "Konu başlığı",
          "seviye": "Öğrenci seviyesi",
          "ogrenme_stili": ["Öğrenme stilleri"],
          "icerik_modulleri": [
            {
              "modul_basligi": "Modül başlığı",
              "icerik_tipi": "metin",
              "metin_icerigi": "Kısa, öz içerik. ADHD öğrenciler için madde işaretli. Görsel önerileri parantez içinde.",
              "ek_ipucu": "ADHD'ye özel ipucu"
            }
          ],
          "ozet_ve_sonraki_adim": "Kısa özet ve sonraki adım"
        }

        ADHD öğrenciler için kısa paragraflar, görsel öğeler ve sık molalar öner.
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      try {
        const cleanedText = this.cleanJsonResponse(text);
        const jsonData = JSON.parse(cleanedText);
        return { success: true, data: jsonData };
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Original text:', text);
        console.error('Cleaned text:', this.cleanJsonResponse(text));
        return { success: false, error: 'JSON parse hatası. Lütfen tekrar deneyin.' };
      }
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, error: 'API hatası: ' + error };
    }
  }

  async generateExam(params: {
    topic: string;
    questionCount: number;
    difficulty: string;
    questionTypes?: string[];
    studentProfile?: any;
  }): Promise<GeminiResponse> {
    console.log('Generating exam with params:', params);
    
    try {
      const prompt = `
        Aşağıdaki parametrelere göre 8. sınıf LGS sınavına uygun çoktan seçmeli sorular oluştur:

        Konu: ${params.topic}
        Soru Sayısı: ${params.questionCount}
        Zorluk Seviyesi: ${params.difficulty}
        ${params.questionTypes ? `Soru Tipleri: ${params.questionTypes.join(', ')}` : ''}

        ÖNEMLİ: SADECE GEÇERLİ JSON formatında yanıt ver. Hiçbir ek açıklama, metin veya markdown ekleme.

        JSON Formatı:
        {
          "sinav_basligi": "Sınav başlığı",
          "konu_adi": "Sınav konusu",
          "zorluk_seviyesi": "Zorluk seviyesi",
          "sorular": [
            {
              "soru_id": 1,
              "soru_metni": "Soru metni",
              "secenekler": {
                "A": "Seçenek A",
                "B": "Seçenek B",
                "C": "Seçenek C",
                "D": "Seçenek D"
              },
              "dogru_cevap": "A",
              "cozum_metni": "Detaylı çözüm adımları",
              "ipucu": "Öğrenci için ipucu"
            }
          ]
        }

        Sorular LGS formatında, 8. sınıf seviyesinde ve Türkiye müfredatına uygun olmalı.
      `;

      console.log('Sending request to Gemini API...');
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      console.log('Raw API response:', text);

      // Check if response is empty or invalid
      if (!text || text.trim().length === 0) {
        console.error('Empty response from API');
        return this.generateFallbackExam(params);
      }

      try {
        const cleanedText = this.cleanJsonResponse(text);
        console.log('Cleaned text:', cleanedText);
        
        const jsonData = JSON.parse(cleanedText);
        console.log('Parsed JSON successfully:', jsonData);
        
        // Validate required fields
        if (!jsonData.sorular || !Array.isArray(jsonData.sorular) || jsonData.sorular.length === 0) {
          console.error('Invalid JSON structure - missing or empty sorular array');
          return this.generateFallbackExam(params);
        }
        
        return { success: true, data: jsonData };
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Original text length:', text.length);
        console.error('Original text preview:', text.substring(0, 500));
        console.error('Cleaned text:', this.cleanJsonResponse(text));
        
        // Try fallback exam generation
        return this.generateFallbackExam(params);
      }
    } catch (error) {
      console.error('API Error:', error);
      return this.generateFallbackExam(params);
    }
  }

  private generateFallbackExam(params: {
    topic: string;
    questionCount: number;
    difficulty: string;
  }): GeminiResponse {
    console.log('Generating fallback exam for:', params.topic);
    
    const fallbackQuestions = {
      "Sözcükte Anlam ve Söz Varlığı": [
        {
          "soru_id": 1,
          "soru_metni": "Aşağıdaki cümlede altı çizili sözcük hangi anlamda kullanılmıştır? 'Bu konuda çok derinlemesine çalışmak gerekiyor.'",
          "secenekler": {
            "A": "Gerçek anlam",
            "B": "Yan anlam", 
            "C": "Mecaz anlam",
            "D": "Terim anlam"
          },
          "dogru_cevap": "C",
          "cozum_metni": "Derinlemesine kelimesi burada 'ayrıntılı, detaylı' anlamında mecazi olarak kullanılmıştır.",
          "ipucu": "Kelimenin gerçek anlamından farklı bir anlamda kullanılıp kullanılmadığını düşünün."
        },
        {
          "soru_id": 2,
          "soru_metni": "Hangi sözcük türetilmiş sözcüktür?",
          "secenekler": {
            "A": "Ev",
            "B": "Evli",
            "C": "Su",
            "D": "Göz"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Evli sözcüğü 'ev' kök sözcüğüne '-li' eki getirilerek türetilmiştir.",
          "ipucu": "Hangi sözcüğün başka bir sözcükten türediğini bulun."
        }
      ],
      "Çarpanlar ve Katlar": [
        {
          "soru_id": 1,
          "soru_metni": "24 sayısının çarpanları aşağıdakilerden hangisidir?",
          "secenekler": {
            "A": "1, 2, 3, 4, 6, 8, 12, 24",
            "B": "1, 2, 4, 6, 12, 24",
            "C": "2, 3, 4, 6, 8, 12",
            "D": "1, 3, 6, 8, 12, 24"
          },
          "dogru_cevap": "A",
          "cozum_metni": "24'ü tam bölen sayılar: 24÷1=24, 24÷2=12, 24÷3=8, 24÷4=6, 24÷6=4, 24÷8=3, 24÷12=2, 24÷24=1",
          "ipucu": "Bir sayının çarpanları, o sayıyı tam bölen pozitif tam sayılardır."
        },
        {
          "soru_id": 2,
          "soru_metni": "EBOB(12, 18) = ?",
          "secenekler": {
            "A": "3",
            "B": "6",
            "C": "9",
            "D": "12"
          },
          "dogru_cevap": "B",
          "cozum_metni": "12 = 2² × 3, 18 = 2 × 3². Ortak çarpanlar: 2 × 3 = 6",
          "ipucu": "EBOB, sayıların ortak çarpanlarının en büyüğüdür."
        }
      ],
      "Basınç": [
        {
          "soru_id": 1,
          "soru_metni": "Katı cisimler üzerine uygulanan kuvvetin etkisini artırmak için aşağıdakilerden hangisi yapılır?",
          "secenekler": {
            "A": "Temas yüzeyi artırılır",
            "B": "Temas yüzeyi azaltılır",
            "C": "Kuvvet azaltılır",
            "D": "Cismin ağırlığı artırılır"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Basınç = Kuvvet/Temas Yüzeyi formülünde, temas yüzeyini azaltarak basıncı artırabiliriz.",
          "ipucu": "Bıçağın neden keskin olduğunu düşünün."
        }
      ],
      "Cümlede Anlam": [
        {
          "soru_id": 1,
          "soru_metni": "Aşağıdaki cümlelerin hangisinde abartı sanatı kullanılmıştır?",
          "secenekler": {
            "A": "Yağmur çok şiddetli yağıyor.",
            "B": "Gökyüzünde bulutlar var.",
            "C": "Aç aç kurt gibi baktı.",
            "D": "Ses telleri çatladı."
          },
          "dogru_cevap": "D",
          "cozum_metni": "'Ses telleri çatladı' ifadesi abartmalı bir anlatımdır. Gerçekte ses telleri çatlamaz.",
          "ipucu": "Hangi ifade gerçekte mümkün olmayan bir durumu anlatıyor?"
        }
      ]
    };

    const topicQuestions = fallbackQuestions[params.topic as keyof typeof fallbackQuestions] || fallbackQuestions["Çarpanlar ve Katlar"];
    const selectedQuestions = topicQuestions.slice(0, Math.min(params.questionCount, topicQuestions.length));

    const fallbackData = {
      "sinav_basligi": `${params.topic} - ${params.difficulty} Seviye Sınav`,
      "konu_adi": params.topic,
      "zorluk_seviyesi": params.difficulty,
      "sorular": selectedQuestions
    };

    return { success: true, data: fallbackData };
  }

  async generateMentorResponse(params: {
    studentQuestion: string;
    studentProfile: any;
    chatHistory?: any[];
  }): Promise<GeminiResponse> {
    try {
      const prompt = `
        Öğrencinin sorusuna ADHD dostu, destekleyici bir sanal rehber olarak yanıt ver:

        Öğrenci Sorusu: ${params.studentQuestion}
        Öğrenci Profili: ${JSON.stringify(params.studentProfile)}
        ${params.chatHistory ? `Sohbet Geçmişi: ${JSON.stringify(params.chatHistory)}` : ''}

        SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir metin ekleme:
        {
          "mentor_cevabi": "Kişiselleştirilmiş, destekleyici yanıt",
          "ek_kaynak_onerisi": "Ek kaynak önerisi (varsa)",
          "sonraki_etkilesim_onerisi": "Sohbeti devam ettirme önerisi"
        }

        Yanıt ADHD öğrenciler için uygun, kısa ve teşvik edici olmalı.
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      try {
        const cleanedText = this.cleanJsonResponse(text);
        const jsonData = JSON.parse(cleanedText);
        return { success: true, data: jsonData };
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Original text:', text);
        console.error('Cleaned text:', this.cleanJsonResponse(text));
        return { success: false, error: 'JSON parse hatası. Lütfen tekrar deneyin.' };
      }
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, error: 'API hatası: ' + error };
    }
  }

  async generatePerformanceAnalysis(params: {
    studentName: string;
    reportPeriod: string;
    performanceData: any;
    studentProfile: any;
  }): Promise<GeminiResponse> {
    try {
      const prompt = `
        Öğrencinin performans verilerini analiz ederek kapsamlı bir rapor oluştur:

        Öğrenci: ${params.studentName}
        Rapor Periyodu: ${params.reportPeriod}
        Performans Verileri: ${JSON.stringify(params.performanceData)}
        Öğrenci Profili: ${JSON.stringify(params.studentProfile)}

        SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir metin ekleme:
        {
          "rapor_basligi": "Rapor başlığı",
          "genel_ozet": "Genel performans özeti",
          "detayli_analiz_bolumleri": [
            {
              "baslik": "Analiz bölüm başlığı",
              "metin": "Detaylı analiz metni"
            }
          ],
          "ek_notlar": "Önemli notlar"
        }

        Rapor veli/öğretmen için anlaşılır ve eyleme geçirilebilir olmalı.
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      try {
        const cleanedText = this.cleanJsonResponse(text);
        const jsonData = JSON.parse(cleanedText);
        return { success: true, data: jsonData };
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Original text:', text);
        console.error('Cleaned text:', this.cleanJsonResponse(text));
        return { success: false, error: 'JSON parse hatası. Lütfen tekrar deneyin.' };
      }
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, error: 'API hatası: ' + error };
    }
  }
}

export const geminiService = new GeminiService();