import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiRequest, GeminiResponse } from '../types';

const API_KEY = 'AIzaSyB3QFUEQ-hp_SgcYXMbzQ8Z-NGKtVWxQ2A';
const genAI = new GoogleGenerativeAI(API_KEY);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  private cleanJsonResponse(text: string): string {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find the first { and last } to extract JSON
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
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
    try {
      const prompt = `
        Aşağıdaki parametrelere göre 8. sınıf LGS sınavına uygun çoktan seçmeli sorular oluştur:

        Konu: ${params.topic}
        Soru Sayısı: ${params.questionCount}
        Zorluk Seviyesi: ${params.difficulty}
        ${params.questionTypes ? `Soru Tipleri: ${params.questionTypes.join(', ')}` : ''}

        SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir metin ekleme:
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
              "dogru_cevap": "Doğru seçenek harfi",
              "cozum_metni": "Detaylı çözüm adımları",
              "ipucu": "Öğrenci için ipucu"
            }
          ]
        }

        Sorular LGS formatında, 8. sınıf seviyesinde ve Türkiye müfredatına uygun olmalı.
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