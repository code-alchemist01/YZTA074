import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiResponse } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAYmhEwxoP7-PCwDSlmz_BSSf9zilt6eUc';
const genAI = new GoogleGenerativeAI(API_KEY);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 2000; // 2 saniye minimum aralık

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
        "${params.topic}" konusu için 8. sınıf Türkiye müfredatına uygun, GERÇEK EĞİTİM İÇERİKLİ, DETAYLI konu anlatımı oluştur:

        Konu: ${params.topic}
        Öğrenci Seviyesi: ${params.studentLevel}
        Öğrenme Stili: ${params.learningStyle.join(', ')}
        ${params.importantPoints ? `Önemli Noktalar: ${params.importantPoints.join(', ')}` : ''}
        ${params.previousErrors ? `Önceki Hatalar: ${params.previousErrors.join(', ')}` : ''}

        ÇOK ÖNEMLİ: Bu konunun SPESİFİK içeriğini öğret! Genel laflar değil, konuya özel bilgiler ver:

        TÜRKÇE KONULARI için:
        - Metin Türleri: Masal, destan, efsane, hikaye, roman, şiir, tiyatro, deneme, eleştiri, fıkra, anı özelliklerini anlat
        - Dilbilgisi: Kuralları, örnekleri, istisnalarını ver
        - Şiir: Ölçü, kafiye, nazım biçimlerini detaylandır

        MATEMATİK KONULARI için:
        - Formülleri türet ve mantığını açıkla
        - Adım adım çözüm teknikleri
        - Farklı soru tiplerini göster

        FEN KONULARI için:
        - Bilimsel kavramları örneklerle açıkla
        - Deney sonuçları ve gözlemler
        - Günlük hayat bağlantıları

        SOSYAL KONULARI için:
        - Tarihsel olayları kronolojik sıra ile
        - Coğrafi kavramları harita örnekleri ile
        - Kültürel özellikleri somut örneklerle

        SADECE aşağıdaki JSON formatında yanıt ver:
        {
          "konu_adi": "${params.topic}",
          "seviye": "${params.studentLevel}",
          "ogrenme_stili": ${JSON.stringify(params.learningStyle)},
          "icerik_modulleri": [
            {
              "modul_basligi": "Konunun Temel Kavramları",
              "icerik_tipi": "metin",
              "metin_icerigi": "Bu konunun temel kavramlarını, tanımlarını, sınıflandırmalarını DETAYLI olarak anlat. Spesifik örneklerle destekle. En az 300 kelime.",
              "ek_ipucu": "ADHD öğrenciler için ipucu"
            },
            {
              "modul_basligi": "Detaylı Açıklama ve Örnekler",
              "icerik_tipi": "metin",
              "metin_icerigi": "Konuyu ADIM ADIM, ÖRNEKLERLE, spesifik bilgilerle detaylıca öğret. Kuralları, özellikleri, türleri tek tek açıkla. En az 400 kelime.",
              "ek_ipucu": "Anlama stratejisi"
            },
            {
              "modul_basligi": "Pratik Uygulamalar ve Örnekler",
              "icerik_tipi": "metin",
              "metin_icerigi": "Konkretek örneklerle, uygulamalarla, çözümlerle pekiştir. Günlük hayattan bağlantılar kur. En az 300 kelime.",
              "ek_ipucu": "Pratik ipucu"
            },
            {
              "modul_basligi": "LGS Hazırlık ve İleri Konular",
              "icerik_tipi": "metin",
              "metin_icerigi": "LGS'de bu konudan hangi sorular gelir, nasıl çözülür, diğer konularla bağlantısı nedir. En az 250 kelime.",
              "ek_ipucu": "Sınav stratejisi"
            }
          ],
          "ozet_ve_sonraki_adim": "Konunun özeti ve gelecek konulara geçiş"
        }

        ADHD uyumlu: Kısa paragraflar, madde işaretleri, görsel öneriler (parantez içinde).
      `;

      console.log('Sending lesson request to Gemini API...');
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      console.log('Raw lesson API response:', text);

      // Check if response is empty or invalid
      if (!text || text.trim().length === 0) {
        console.error('Empty response received from Gemini API');
        return this.generateFallbackLesson(params);
      }

      try {
        const cleanedText = this.cleanJsonResponse(text);
        console.log('Cleaned lesson text:', cleanedText);
        
        const jsonData = JSON.parse(cleanedText);
        console.log('Parsed lesson JSON successfully:', jsonData);
        
        // Validate required fields for lesson
        if (!jsonData.konu_adi || !jsonData.icerik_modulleri || !Array.isArray(jsonData.icerik_modulleri) || jsonData.icerik_modulleri.length === 0) {
          console.error('Invalid lesson JSON structure - missing required fields');
          return this.generateFallbackLesson(params);
        }
        
        return { success: true, data: jsonData };
      } catch (parseError) {
        console.error('Lesson JSON Parse Error:', parseError);
        console.error('Original text length:', text.length);
        console.error('Original text preview:', text.substring(0, 500));
        console.error('Cleaned text:', this.cleanJsonResponse(text));
        
        // Try fallback lesson generation
        return this.generateFallbackLesson(params);
      }
    } catch (error) {
      console.error('Lesson API Error:', error);
      return this.generateFallbackLesson(params);
    }
  }

  async generateExam(params: {
    topic: string;
    questionCount: number;
    difficulty: string;
    questionTypes?: string[];
    studentProfile?: any;
  }): Promise<GeminiResponse> {
    console.log('🚀 Generating exam with params:', params);
    console.log('📡 API Key exists:', !!API_KEY);
    console.log('🤖 Model initialized:', !!this.model);
    
    // Rate limiting kontrolü
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: ${waitTime}ms bekleniyor...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    
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

      console.log('📤 Sending request to Gemini API...');
      console.log('📝 Prompt length:', prompt.length);
      
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      console.log('📥 Raw API response received');
      console.log('📊 Response length:', text?.length || 0);
      console.log('📋 First 200 chars:', text?.substring(0, 200) || 'Empty response');

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
    console.log('🔄 Generating fallback exam for:', params.topic);
    console.log('📊 Requested question count:', params.questionCount);
    
    const fallbackQuestions = {
      // Türkçe Konuları
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
      ],
      "Söz Sanatları": [
        {
          "soru_id": 1,
          "soru_metni": "Aşağıdakilerden hangisinde benzetme sanatı kullanılmıştır?",
          "secenekler": {
            "A": "Deniz gibi derin gözler",
            "B": "Çok güzel bir şarkı",
            "C": "Yağmur yağıyor",
            "D": "Kitap okuyorum"
          },
          "dogru_cevap": "A",
          "cozum_metni": "Gözlerin denize benzetilmesi, benzetme sanatının örneğidir.",
          "ipucu": "Hangi cümlede iki şey karşılaştırılıyor?"
        }
      ],
      "Paragrafta Anlam ve Yapı": [
        {
          "soru_id": 1,
          "soru_metni": "Bir paragrafın ana düşüncesi genellikle nerede bulunur?",
          "secenekler": {
            "A": "Sadece başta",
            "B": "Sadece sonda", 
            "C": "Başta veya sonda",
            "D": "Her zaman ortada"
          },
          "dogru_cevap": "C",
          "cozum_metni": "Ana düşünce genellikle paragrafın başında veya sonunda yer alır.",
          "ipucu": "Ana düşünce hangi konumlarda olabilir?"
        }
      ],
      "Metin Türleri": [
        {
          "soru_id": 1,
          "soru_metni": "Aşağıdakilerden hangisi öyküleyici metin türüdür?",
          "secenekler": {
            "A": "Deneme",
            "B": "Hikaye",
            "C": "Mektup",
            "D": "Makale"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Hikaye, olayları anlatan öyküleyici metin türüdür.",
          "ipucu": "Hangi metin türünde olaylar anlatılır?"
        }
      ],
      "Cümlenin Ögeleri": [
        {
          "soru_id": 1,
          "soru_metni": "Aşağıdaki cümlelerin hangisinde özne belirtisizdir?",
          "secenekler": {
            "A": "Kitabı masanın üzerine koydum.",
            "B": "Kapıyı çaldılar.",
            "C": "Öğretmen dersi anlattı.",
            "D": "Çocuklar bahçede oynuyor."
          },
          "dogru_cevap": "B",
          "cozum_metni": "'Çaldılar' fiilinin öznesi belli değildir, kim çaldığı belirtilmemiştir.",
          "ipucu": "Hangi cümlede eylemi yapan belli değil?"
        }
      ],
      "Fiilde Çatı": [
        {
          "soru_id": 1,
          "soru_metni": "Aşağıdakilerden hangisi edilgen çatılı fiildir?",
          "secenekler": {
            "A": "okudu",
            "B": "okundu", 
            "C": "okuyor",
            "D": "okuyacak"
          },
          "dogru_cevap": "B",
          "cozum_metni": "'Okundu' fiili edilgen çatıdadır, eylem özne tarafından yapılmamıştır.",
          "ipucu": "Hangi fiilde eylem özne tarafından yapılmıyor?"
        }
      ],
      "Cümle Çeşitleri": [
        {
          "soru_id": 1,
          "soru_metni": "Aşağıdakilerden hangisi soru cümlesidir?",
          "secenekler": {
            "A": "Bugün hava çok güzel.",
            "B": "Okula git!",
            "C": "Sen neredesin?",
            "D": "Keşke yağmur yağsa."
          },
          "dogru_cevap": "C",
          "cozum_metni": "'Sen neredesin?' cümlesi soru işareti ile biten soru cümlesidir.",
          "ipucu": "Hangi cümle soru işareti ile bitiyor?"
        }
      ],
      "Yazım Kuralları": [
        {
          "soru_id": 1,
          "soru_metni": "Aşağıdakilerden hangisi doğru yazılmıştır?",
          "secenekler": {
            "A": "istanbul",
            "B": "İstanbul",
            "C": "ISTANBUL",
            "D": "İSTANBUL"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Özel isimlerin ilk harfi büyük yazılır.",
          "ipucu": "Özel isimler nasıl yazılır?"
        }
      ],
      "Noktalama İşaretleri": [
        {
          "soru_id": 1,
          "soru_metni": "Aşağıdakilerden hangisinde noktalama işareti doğru kullanılmıştır?",
          "secenekler": {
            "A": "Sen geldin, mi?",
            "B": "Sen geldin mi,",
            "C": "Sen geldin mi?",
            "D": "Sen geldin. mi?"
          },
          "dogru_cevap": "C",
          "cozum_metni": "Soru eki 'mi' ayrı yazılır ve cümle soru işareti ile biter.",
          "ipucu": "Soru eki nasıl yazılır?"
        }
      ],

      // Matematik Konuları
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
        },
        {
          "soru_id": 3,
          "soru_metni": "EKOK(6, 8) = ?",
          "secenekler": {
            "A": "12",
            "B": "24",
            "C": "36",
            "D": "48"
          },
          "dogru_cevap": "B",
          "cozum_metni": "6 = 2 × 3, 8 = 2³. EKOK = 2³ × 3 = 24",
          "ipucu": "EKOK, sayıların katları arasındaki en küçük ortak kat."
        },
        {
          "soru_id": 4,
          "soru_metni": "36 sayısının asal çarpanları toplamı kaçtır?",
          "secenekler": {
            "A": "5",
            "B": "7",
            "C": "9",
            "D": "11"
          },
          "dogru_cevap": "A",
          "cozum_metni": "36 = 2² × 3², asal çarpanları 2 ve 3. Toplam: 2 + 3 = 5",
          "ipucu": "Asal çarpan aynı olsa bile sadece bir kez sayılır."
        },
        {
          "soru_id": 5,
          "soru_metni": "48 ve 72'nin EBOB'u kaçtır?",
          "secenekler": {
            "A": "12",
            "B": "18",
            "C": "24",
            "D": "36"
          },
          "dogru_cevap": "C",
          "cozum_metni": "48 = 2⁴ × 3, 72 = 2³ × 3². EBOB = 2³ × 3 = 24",
          "ipucu": "Ortak çarpanların en küçük kuvvetlerini alın."
        }
      ],
      "Üslü İfadeler": [
        {
          "soru_id": 1,
          "soru_metni": "2⁴ işleminin sonucu kaçtır?",
          "secenekler": {
            "A": "8",
            "B": "16",
            "C": "32",
            "D": "64"
          },
          "dogru_cevap": "B",
          "cozum_metni": "2⁴ = 2 × 2 × 2 × 2 = 16",
          "ipucu": "2'yi 4 kez çarpın."
        }
      ],
      "Kareköklü İfadeler": [
        {
          "soru_id": 1,
          "soru_metni": "√16 kaçtır?",
          "secenekler": {
            "A": "2",
            "B": "4",
            "C": "8",
            "D": "16"
          },
          "dogru_cevap": "B",
          "cozum_metni": "√16 = 4, çünkü 4² = 16",
          "ipucu": "Hangi sayının karesi 16'dır?"
        }
      ],
      "Veri Analizi": [
        {
          "soru_id": 1,
          "soru_metni": "5, 8, 12, 15, 20 sayılarının aritmetik ortalaması kaçtır?",
          "secenekler": {
            "A": "10",
            "B": "12",
            "C": "14",
            "D": "15"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Aritmetik ortalama = (5+8+12+15+20)/5 = 60/5 = 12",
          "ipucu": "Tüm sayıları toplayıp kaç tane olduğuna bölün."
        }
      ],
      "Olasılık": [
        {
          "soru_id": 1,
          "soru_metni": "Bir zarın atılmasında çift sayı gelme olasılığı nedir?",
          "secenekler": {
            "A": "1/6",
            "B": "1/3",
            "C": "1/2",
            "D": "2/3"
          },
          "dogru_cevap": "C",
          "cozum_metni": "Zarda çift sayılar 2, 4, 6'dır. 3 çift sayı / 6 toplam sayı = 1/2",
          "ipucu": "Zarda kaç tane çift sayı var?"
        }
      ],
      "Cebirsel İfadeler ve Özdeşlikler": [
        {
          "soru_id": 1,
          "soru_metni": "3x + 5 = 14 denkleminde x kaçtır?",
          "secenekler": {
            "A": "2",
            "B": "3",
            "C": "4",
            "D": "5"
          },
          "dogru_cevap": "B",
          "cozum_metni": "3x + 5 = 14 → 3x = 14 - 5 → 3x = 9 → x = 3",
          "ipucu": "Önce 5'i sağ tarafa geçirin."
        }
      ],
      "Doğrusal Denklemler": [
        {
          "soru_id": 1,
          "soru_metni": "2x - 3 = 7 denkleminin çözümü kaçtır?",
          "secenekler": {
            "A": "4",
            "B": "5",
            "C": "6",
            "D": "7"
          },
          "dogru_cevap": "B",
          "cozum_metni": "2x - 3 = 7 → 2x = 10 → x = 5",
          "ipucu": "Önce 3'ü sağ tarafa geçirin."
        }
      ],
      "Eşitsizlikler": [
        {
          "soru_id": 1,
          "soru_metni": "x + 3 > 7 eşitsizliğini sağlayan en küçük tam sayı kaçtır?",
          "secenekler": {
            "A": "4",
            "B": "5",
            "C": "6",
            "D": "7"
          },
          "dogru_cevap": "B",
          "cozum_metni": "x + 3 > 7 → x > 4, bu durumda en küçük tam sayı 5'tir.",
          "ipucu": "x > 4 olduğunda hangi en küçük tam sayı bu koşulu sağlar?"
        }
      ],
      "Üçgenler": [
        {
          "soru_id": 1,
          "soru_metni": "Bir üçgenin iç açıları toplamı kaç derecedir?",
          "secenekler": {
            "A": "90°",
            "B": "180°",
            "C": "270°",
            "D": "360°"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Herhangi bir üçgenin iç açıları toplamı her zaman 180°'dir.",
          "ipucu": "Bu temel geometri kuralıdır."
        }
      ],
      "Eşlik ve Benzerlik": [
        {
          "soru_id": 1,
          "soru_metni": "Eş üçgenlerde hangi özellik vardır?",
          "secenekler": {
            "A": "Sadece açıları eşittir",
            "B": "Sadece kenarları eşittir",
            "C": "Hem kenarları hem açıları eşittir",
            "D": "Hiçbiri eşit değildir"
          },
          "dogru_cevap": "C",
          "cozum_metni": "Eş üçgenlerde tüm karşılıklı kenarlar ve açılar eşittir.",
          "ipucu": "Eşlik kavramını düşünün."
        }
      ],
      "Dönüşüm Geometrisi": [
        {
          "soru_id": 1,
          "soru_metni": "Bir şeklin ötelemesi sırasında hangi özelliği değişmez?",
          "secenekler": {
            "A": "Konumu",
            "B": "Şekli ve boyutu",
            "C": "Yönü",
            "D": "Rengi"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Öteleme işleminde şeklin boyutu ve şekli değişmez, sadece konumu değişir.",
          "ipucu": "Öteleme bir şekli kaydırmaktır."
        }
      ],
      "Katı Cisimler": [
        {
          "soru_id": 1,
          "soru_metni": "Küpün kaç yüzeyi vardır?",
          "secenekler": {
            "A": "4",
            "B": "6",
            "C": "8",
            "D": "12"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Küpün 6 yüzeyi vardır: ön, arka, sağ, sol, üst, alt.",
          "ipucu": "Küpün her yönünde bir yüzey vardır."
        }
      ],

      // Fen Bilimleri Konuları
      "Mevsimler ve İklim": [
        {
          "soru_id": 1,
          "soru_metni": "Mevsimlerin oluşmasının temel nedeni nedir?",
          "secenekler": {
            "A": "Dünya'nın kendi ekseni etrafında dönmesi",
            "B": "Dünya'nın eksen eğikliği",
            "C": "Güneş'e olan uzaklık",
            "D": "Ay'ın çekim etkisi"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Dünya'nın ekseni 23.5° eğik olduğu için mevsimler oluşur.",
          "ipucu": "Dünya'nın ekseni düz değildir, eğiktir."
        }
      ],
      "DNA ve Genetik Kod": [
        {
          "soru_id": 1,
          "soru_metni": "DNA'nın açılımı nedir?",
          "secenekler": {
            "A": "Deoksiribo Nükleik Asit",
            "B": "Dizi Nükleik Asit",
            "C": "Doğal Nükleik Asit",
            "D": "Düzenli Nükleik Asit"
          },
          "dogru_cevap": "A",
          "cozum_metni": "DNA, Deoksiribo Nükleik Asit'in kısaltmasıdır.",
          "ipucu": "DNA'nın İngilizce açılımını düşünün."
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
      "Madde ve Endüstri": [
        {
          "soru_id": 1,
          "soru_metni": "Maddenin en küçük yapı taşı nedir?",
          "secenekler": {
            "A": "Molekül",
            "B": "Atom",
            "C": "Proton",
            "D": "Elektron"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Maddenin en küçük yapı taşı atomdur.",
          "ipucu": "En temel parçacığı düşünün."
        }
      ],
      "Basit Makineler": [
        {
          "soru_id": 1,
          "soru_metni": "Aşağıdakilerden hangisi basit makine örneğidir?",
          "secenekler": {
            "A": "Bilgisayar",
            "B": "Kaldıraç",
            "C": "Araba",
            "D": "Telefon"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Kaldıraç, en temel basit makinelerden biridir.",
          "ipucu": "En basit mekanik aletleri düşünün."
        }
      ],
      "Enerji Dönüşümleri": [
        {
          "soru_id": 1,
          "soru_metni": "Elektrik enerjisi hangi enerji türünden üretilir?",
          "secenekler": {
            "A": "Sadece kinetik enerji",
            "B": "Sadece kimyasal enerji",
            "C": "Çeşitli enerji türlerinden",
            "D": "Sadece ısı enerjisi"
          },
          "dogru_cevap": "C",
          "cozum_metni": "Elektrik enerjisi kinetik, kimyasal, nükleer, güneş enerjisi gibi birçok enerji türünden üretilebilir.",
          "ipucu": "Farklı elektrik santrallerini düşünün."
        }
      ],
      "Elektrik Yükleri ve Elektrik Enerjisi": [
        {
          "soru_id": 1,
          "soru_metni": "Elektrik akımının birimi nedir?",
          "secenekler": {
            "A": "Volt",
            "B": "Amper",
            "C": "Ohm",
            "D": "Watt"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Elektrik akımının birimi Amper'dir.",
          "ipucu": "Akım şiddetini ölçen birim."
        }
      ],
      "Canlılar ve Enerji İlişkileri": [
        {
          "soru_id": 1,
          "soru_metni": "Fotosentez olayında hangi gaz açığa çıkar?",
          "secenekler": {
            "A": "Karbondioksit",
            "B": "Oksijen",
            "C": "Azot",
            "D": "Hidrojen"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Fotosentez sırasında oksijen gazı açığa çıkar.",
          "ipucu": "Bitkiler hangi gazı üretir?"
        }
      ],

      // İnkılap Tarihi ve Atatürkçülük Konuları
      "Bir Kahraman Doğuyor": [
        {
          "soru_id": 1,
          "soru_metni": "Mustafa Kemal Atatürk hangi yılda doğmuştur?",
          "secenekler": {
            "A": "1880",
            "B": "1881",
            "C": "1882",
            "D": "1883"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Mustafa Kemal Atatürk 1881 yılında doğmuştur.",
          "ipucu": "19. yüzyılın sonları."
        }
      ],
      "Millî Uyanış: Bağımsızlık Yolunda Atılan Adımlar": [
        {
          "soru_id": 1,
          "soru_metni": "Millî Mücadele'nin başlangıç tarihi kabul edilen olay nedir?",
          "secenekler": {
            "A": "Mondros Ateşkes Antlaşması",
            "B": "19 Mayıs 1919'da Samsun'a çıkış",
            "C": "Erzurum Kongresi",
            "D": "Sivas Kongresi"
          },
          "dogru_cevap": "B",
          "cozum_metni": "19 Mayıs 1919'da Mustafa Kemal'in Samsun'a çıkışı Millî Mücadele'nin başlangıcı kabul edilir.",
          "ipucu": "Önemli bir 19 Mayıs tarihi."
        }
      ],
      "Millî Bir Destan: Ya İstiklal Ya Ölüm!": [
        {
          "soru_id": 1,
          "soru_metni": "Kurtuluş Savaşı'nın son zaferiyeti hangi savaştır?",
          "secenekler": {
            "A": "Sakarya Savaşı",
            "B": "İnönü Savaşları",
            "C": "Büyük Taarruz",
            "D": "Dumlupınar Savaşı"
          },
          "dogru_cevap": "C",
          "cozum_metni": "26 Ağustos 1922'de başlayan Büyük Taarruz, Kurtuluş Savaşı'nın son zaferidir.",
          "ipucu": "1922 yılındaki büyük askeri operasyon."
        }
      ],
      "Atatürkçülük ve Çağdaşlaşan Türkiye": [
        {
          "soru_id": 1,
          "soru_metni": "Atatürk'ün ilkelerinden hangisi 'halka rağmen halk için' anlayışını reddeder?",
          "secenekler": {
            "A": "Cumhuriyetçilik",
            "B": "Halkçılık",
            "C": "Devletçilik",
            "D": "Laiklik"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Halkçılık ilkesi 'halka rağmen halk için' değil, 'halk için halkla beraber' anlayışını benimser.",
          "ipucu": "Hangi ilke doğrudan halkla ilgilidir?"
        }
      ],

      // Din Kültürü ve Ahlak Bilgisi Konuları
      "Kader İnancı": [
        {
          "soru_id": 1,
          "soru_metni": "İslam dininde kader inancının temel ilkesi nedir?",
          "secenekler": {
            "A": "Her şeyin tesadüf olması",
            "B": "Allah'ın her şeyi bilmesi ve takdir etmesi",
            "C": "İnsanın hiç sorumluluğu olmaması",
            "D": "Sadece kötü olayların kader olması"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Kader, Allah'ın her şeyi önceden bilmesi ve takdir etmesi anlamına gelir.",
          "ipucu": "Allah'ın sıfatlarını düşünün."
        }
      ],
      "Zekât, Sadaka ve Hac": [
        {
          "soru_id": 1,
          "soru_metni": "Zekât İslam dininin kaçıncı şartıdır?",
          "secenekler": {
            "A": "Birinci",
            "B": "İkinci",
            "C": "Üçüncü",
            "D": "Dördüncü"
          },
          "dogru_cevap": "C",
          "cozum_metni": "Zekât İslam'ın beş şartından üçüncüsüdür.",
          "ipucu": "İslam'ın beş şartını sırayla düşünün."
        }
      ],
      "Din ve Hayat": [
        {
          "soru_id": 1,
          "soru_metni": "Din ve günlük hayat arasındaki ilişki nasıl olmalıdır?",
          "secenekler": {
            "A": "Tamamen ayrı olmalı",
            "B": "Sadece ibadet zamanında bir arada olmalı",
            "C": "Hayatın her alanında birlikte olmalı",
            "D": "Sadece özel günlerde birlikte olmalı"
          },
          "dogru_cevap": "C",
          "cozum_metni": "Din, hayatın her alanında rehberlik eden bir yaşam biçimidir.",
          "ipucu": "Dinin kapsamını düşünün."
        }
      ],
      "Hz. Muhammed'in Örnekliği": [
        {
          "soru_id": 1,
          "soru_metni": "Hz. Muhammed'in en önemli özelliklerinden biri nedir?",
          "secenekler": {
            "A": "Sadece dini konularda örnek olması",
            "B": "Sadece savaşlarda cesur olması",
            "C": "Hayatın her alanında örnek olması",
            "D": "Sadece ailevi konularda örnek olması"
          },
          "dogru_cevap": "C",
          "cozum_metni": "Hz. Muhammed hayatın her alanında Müslümanlara örnek olan bir peygamberdir.",
          "ipucu": "Peygamberin örnek oluş kapsamını düşünün."
        }
      ],

      // İngilizce Konuları
      "Friendship": [
        {
          "soru_id": 1,
          "soru_metni": "What is the past tense of 'meet'?",
          "secenekler": {
            "A": "meeted",
            "B": "met",
            "C": "meet",
            "D": "meeting"
          },
          "dogru_cevap": "B",
          "cozum_metni": "'Meet' fiilinin geçmiş hali 'met'tir.",
          "ipucu": "Bu düzensiz bir fiildir."
        }
      ],
      "Teen Life": [
        {
          "soru_id": 1,
          "soru_metni": "Which one is correct?",
          "secenekler": {
            "A": "I am 14 years old.",
            "B": "I have 14 years old.",
            "C": "I am 14 years.",
            "D": "I have 14 years."
          },
          "dogru_cevap": "A",
          "cozum_metni": "Yaş belirtirken 'I am ... years old' yapısı kullanılır.",
          "ipucu": "Yaş söylerken hangi yapı kullanılır?"
        }
      ],
      "In the Kitchen": [
        {
          "soru_id": 1,
          "soru_metni": "Which one is a kitchen utensil?",
          "secenekler": {
            "A": "Book",
            "B": "Spoon",
            "C": "Chair",
            "D": "Computer"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Spoon (kaşık) bir mutfak eşyasıdır.",
          "ipucu": "Mutfakta kullanılan eşyayı bulun."
        }
      ],
      "On the Phone": [
        {
          "soru_id": 1,
          "soru_metni": "How do you answer the phone in English?",
          "secenekler": {
            "A": "Hello",
            "B": "Goodbye",
            "C": "Thank you",
            "D": "Sorry"
          },
          "dogru_cevap": "A",
          "cozum_metni": "Telefonu açarken 'Hello' deriz.",
          "ipucu": "Selamlama ifadesi."
        }
      ],
      "The Internet": [
        {
          "soru_id": 1,
          "soru_metni": "What do you need to access the internet?",
          "secenekler": {
            "A": "Only a computer",
            "B": "Only a phone",
            "C": "A device and internet connection",
            "D": "Only books"
          },
          "dogru_cevap": "C",
          "cozum_metni": "İnternete erişmek için bir cihaz ve internet bağlantısı gerekir.",
          "ipucu": "İki şeye ihtiyaç var."
        }
      ],
      "Adventures": [
        {
          "soru_id": 1,
          "soru_metni": "What is an adventure?",
          "secenekler": {
            "A": "A boring activity",
            "B": "An exciting experience",
            "C": "A sleeping time",
            "D": "A homework"
          },
          "dogru_cevap": "B",
          "cozum_metni": "Adventure heyecan verici bir deneyim anlamına gelir.",
          "ipucu": "Macera ne demektir?"
        }
      ]
    };

    // Seçilen konuya ait soruları bul, yoksa varsayılan sorular kullan  
    const topicQuestions = fallbackQuestions[params.topic as keyof typeof fallbackQuestions] || this.getDefaultQuestions(params.topic);
    
    // İstenen soru sayısı kadar soru seç
    const selectedQuestions = this.selectQuestions(topicQuestions, params.questionCount);

    const fallbackData = {
      "sinav_basligi": `${params.topic} - ${params.difficulty} Seviye Sınav`,
      "konu_adi": params.topic,
      "zorluk_seviyesi": params.difficulty,
      "sorular": selectedQuestions
    };

    return { success: true, data: fallbackData };
  }

  // Varsayılan sorular oluştur (konu bulunamadığında)
  private getDefaultQuestions(topic: string): any[] {
    return [
      {
        "soru_id": 1,
        "soru_metni": `${topic} konusunda temel bilgi sorusu 1`,
        "secenekler": {
          "A": "Seçenek A",
          "B": "Seçenek B", 
          "C": "Seçenek C",
          "D": "Seçenek D"
        },
        "dogru_cevap": "A",
        "cozum_metni": `${topic} konusuna dair temel açıklama`,
        "ipucu": "Konuyu gözden geçirin"
      },
      {
        "soru_id": 2,
        "soru_metni": `${topic} konusunda temel bilgi sorusu 2`,
        "secenekler": {
          "A": "Seçenek A",
          "B": "Seçenek B",
          "C": "Seçenek C", 
          "D": "Seçenek D"
        },
        "dogru_cevap": "B",
        "cozum_metni": `${topic} konusuna dair temel açıklama`,
        "ipucu": "Konuyu gözden geçirin"
      },
      {
        "soru_id": 3,
        "soru_metni": `${topic} konusunda temel bilgi sorusu 3`,
        "secenekler": {
          "A": "Seçenek A",
          "B": "Seçenek B",
          "C": "Seçenek C", 
          "D": "Seçenek D"
        },
        "dogru_cevap": "C",
        "cozum_metni": `${topic} konusuna dair temel açıklama`,
        "ipucu": "Konuyu gözden geçirin"
      }
    ];
  }

  // Soru seçimi yap (istenen sayı kadar) - tekrar etmeyen çeşitli sorular
  private selectQuestions(questions: any[], requestedCount: number): any[] {
    const selectedQuestions = [];
    
    for (let i = 0; i < requestedCount; i++) {
      const questionIndex = i % questions.length;
      const baseQuestion = questions[questionIndex];
      
      // Temel soruyu kopyala ve çeşitle
      const question = { ...baseQuestion };
      question.soru_id = i + 1;
      
      // Eğer aynı soru tekrar ediyorsa, soruyu çeşitle
      if (i >= questions.length) {
        question.soru_metni = this.generateVariation(baseQuestion.soru_metni, Math.floor(i / questions.length) + 1);
        question.secenekler = this.generateOptionVariations(baseQuestion.secenekler, Math.floor(i / questions.length) + 1);
      }
      
      selectedQuestions.push(question);
    }
    
    return selectedQuestions;
  }

  // Soru metnini çeşitlendirmek için
  private generateVariation(originalQuestion: string, variationNumber: number): string {
    const variations = [
      originalQuestion,
      originalQuestion.replace(/Aşağıdaki/g, 'Verilen').replace(/hangisi/g, 'hangisinin'),
      originalQuestion.replace(/Hangi/g, 'Aşağıdakilerden hangi'),
      originalQuestion.replace(/nedir/g, 'ne olabilir'),
      originalQuestion.replace(/kaçtır/g, 'kaça eşittir'),
      originalQuestion.replace(/nasıldır/g, 'nasıl olur')
    ];
    
    return variations[variationNumber % variations.length] || originalQuestion;
  }

  // Seçenekleri çeşitlendirmek için
  private generateOptionVariations(originalOptions: any, variationNumber: number): any {
    // Basit seçenek karıştırma ve değiştirme
    const options = { ...originalOptions };
    
    if (variationNumber > 1) {
      // Seçenekleri biraz değiştir
      Object.keys(options).forEach(key => {
        if (typeof options[key] === 'string') {
          options[key] = options[key]
            .replace(/çok/g, 'oldukça')
            .replace(/büyük/g, 'kocaman')
            .replace(/küçük/g, 'minik')
            .replace(/hızlı/g, 'süratli');
        }
      });
    }
    
    return options;
  }

  private generateFallbackLesson(params: {
    topic: string;
    studentLevel: string;
    learningStyle: string[];
  }): GeminiResponse {
    console.log('Generating topic-specific fallback lesson for:', params.topic);
    
    // Konuya özel içerik üretme
    const topicSpecificContent = this.getTopicSpecificContent(params.topic);
    
    const fallbackData = {
      konu_adi: params.topic,
      seviye: params.studentLevel,
      ogrenme_stili: params.learningStyle,
      icerik_modulleri: topicSpecificContent,
      ozet_ve_sonraki_adim: this.getTopicSummary(params.topic)
    };

    return { success: true, data: fallbackData };
  }

  private getTopicSpecificContent(topic: string): any[] {
    const topicLower = topic.toLowerCase();
    
    // Türkçe konuları
    if (topicLower.includes('metin türleri') || topicLower.includes('metin') && topicLower.includes('tür')) {
      return this.getMetinTurleriContent();
    }
    if (topicLower.includes('şiir') || topicLower.includes('nazım')) {
      return this.getSiirContent();
    }
    if (topicLower.includes('dilbilgisi') || topicLower.includes('gramer')) {
      return this.getDilbilgisiContent();
    }
    
    // Matematik konuları
    if (topicLower.includes('cebir') || topicLower.includes('denklem')) {
      return this.getCebirContent();
    }
    if (topicLower.includes('geometri') || topicLower.includes('üçgen') || topicLower.includes('alan')) {
      return this.getGeometriContent();
    }
    
    // Fen konuları
    if (topicLower.includes('kuvvet') || topicLower.includes('hareket')) {
      return this.getFizikContent();
    }
    if (topicLower.includes('hücre') || topicLower.includes('canlı')) {
      return this.getBiyolojiContent();
    }
    
    // Sosyal konuları
    if (topicLower.includes('osmanlı') || topicLower.includes('tarih')) {
      return this.getTarihContent();
    }
    if (topicLower.includes('coğrafya') || topicLower.includes('iklim')) {
      return this.getCografyaContent();
    }
    
    // Genel konu
    return this.getGenericContent(topic);
  }

  private getMetinTurleriContent(): any[] {
    return [
      {
        modul_basligi: "Metin Türleri Nedir ve Sınıflandırması",
        icerik_tipi: "metin",
        metin_icerigi: `📚 Metin Türleri - Temel Kavramlar

Metin türleri, yazın eserlerini belirli özelliklerine göre gruplandırdığımız kategorilerdir. 8. sınıfta öğreneceğin ana metin türleri şunlardır:

🎭 **1. EPİK (DESTANSI) TÜRLER:**
Anlatmaya dayalı, olay odaklı türlerdir.

• **Masal:** Hayali olayları anlatan, genellikle "Bir varmış bir yokmuş" ile başlayan metinlerdir.
  - Özellikler: Kahramanlar, büyülü unsurlar, iyinin kötüyü yenmesi
  - Örnek: Keloğlan masalları

• **Destan:** Bir milletin kahramanlık öykülerini anlatan, tarihî-efsanevi metinlerdir.
  - Özellikler: Millî değerler, kahramanlık, tarihî olaylar
  - Örnek: Dede Korkut Hikayeleri

• **Efsane:** Gerçek olduğuna inanılan, olağanüstü olayları anlatan metinlerdir.
  - Özellikler: İnanç unsuru, mucizevi olaylar
  - Örnek: Yunus Emre efsaneleri

• **Hikaye:** Günlük hayattan alınmış, kısa ve öz anlatımlardır.
  - Özellikler: Az karakter, tek olay, kısa zaman
  - Örnek: Sait Faik'in hikayeleri

• **Roman:** Uzun, karmaşık olay örgüsüne sahip, çok karakterli metinlerdir.
  - Özellikler: Geniş zaman, çok karakter, alt konular
  - Örnek: Çalıkuşu

🎵 **2. LİRİK (ÖZNEL) TÜRLER:**
Duygu ve düşünce ifadesi odaklı türlerdir.

• **Şiir:** Vezin, kafiye ve duygu yoğunluğu olan nazım metinleridir.`,
        ek_ipucu: "Metin türlerini ayırt etmek için önce 'ne anlatıyor' sorusunu sor. Olay mı, duygu mu, sahne mi?"
      },
      {
        modul_basligi: "Metin Türlerinin Detaylı Özellikleri",
        icerik_tipi: "metin",
        metin_icerigi: `🎪 **3. DRAMATİK (SAHNE) TÜRLER:**
Sahneleme amacı güden türlerdir.

• **Tiyatro:** Sahnede oynanmak için yazılan metinlerdir.
  - Özellikler: Dialog, sahne yönergeleri, perde/sahne
  - Alt türler: Komedi, trajedi, dram
  - Örnek: Haldun Taner'in oyunları

📝 **4. DİDAKTİK (ÖĞRETİCİ) TÜRLER:**
Bilgi verme, öğretme amacı güden türlerdir.

• **Deneme:** Bir konuda yazarın görüşlerini özgürce dile getirdiği türdür.
  - Özellikler: Kişisel bakış açısı, serbest üslup
  - Örnek: Nurullah Ataç'ın denemeleri

• **Eleştiri:** Sanat eserleri hakkında değerlendirme yapılan türdür.
  - Özellikler: Analiz, değerlendirme, objektif yaklaşım
  - Örnek: Kitap eleştirileri

• **Fıkra:** Güldürü amacı güden, kısa ve öğretici metinlerdir.
  - Özellikler: Humor, kısa anlatım, zeka
  - Örnek: Nasreddin Hoca fıkraları

• **Anı:** Yazarın kişisel yaşantısından kesitler sunan türdür.
  - Özellikler: Birinci ağızdan anlatım, gerçek olaylar
  - Örnek: Halide Edip'in anıları

🔍 **AYIRIM YÖNTEMLERİ:**

**Epik Türler İçin:**
- Zamana bak: Masal (belirsiz), Hikaye (kısa), Roman (uzun)
- Gerçekliğe bak: Destan/Efsane (olağanüstü), Hikaye/Roman (gerçekçi)

**Lirik Türler İçin:**
- Nazım mı nesir mi? Şiir (nazım), Diğerleri (nesir)
- Duygu yoğunluğu var mı?

**Dramatik Türler İçin:**
- Sahne yönergesi var mı?
- Dialog ağırlıklı mı?`,
        ek_ipucu: "Her metin türünün kendine özgü 'ipucu kelimeleri' vardır. Masalda 'bir varmış', tiyatroda 'sahne', şiirde 'vezin' gibi."
      },
      {
        modul_basligi: "Metin Türlerinde Örnekler ve Tanıma Teknikleri",
        icerik_tipi: "metin",
        metin_icerigi: `🎯 **METÍN TÜRÜ TANIMA REHBERİ:**

**📖 Epik Türler Nasıl Tanınır?**

*Masal Tanıma:*
✅ "Bir varmış bir yokmuş" tarzı giriş
✅ Hayali karakterler (dev, peri, ejder)
✅ Sihirli objeler (değnek, halı, yüzük)
✅ İyinin galip gelmesi
Örnek: "Bir varmış bir yokmuş, gel zaman git zaman..."

*Destan Tanıma:*
✅ Millî kahraman (Oğuz Kağan, Bamsi Beyrek)
✅ Tarihî olaylar + efsanevi unsurlar
✅ Kahramanlık, vatan sevgisi
Örnek: "Oğuz Kağan'ın düşmanları..."

*Hikaye Tanıma:*
✅ Gerçekçi olaylar
✅ Az karakter (2-3 kişi)
✅ Tek ana olay
✅ Kısa zaman dilimi
Örnek: Bir köy öğretmeninin günlük yaşamı

**🎵 Lirik Türler Nasıl Tanınır?**

*Şiir Tanıma:*
✅ Mısralar halinde yazım
✅ Vezin ve kafiye
✅ Duygu yoğunluğu
✅ Mecazlı anlatım
Örnek: "Gönlümün efendisi sensin / Aklımın hocası sensin"

**🎭 Dramatik Türler Nasıl Tanınır?**

*Tiyatro Tanıma:*
✅ Sahne yönergeleri (parantez içinde)
✅ Karakter isimleri + iki nokta
✅ Dialog ağırlıklı
Örnek: "AHMET: (şaşkınlıkla) Ne demek istiyorsun?"

**📝 Didaktik Türler Nasıl Tanınır?**

*Fıkra Tanıma:*
✅ Kısa ve öz anlatım
✅ Espri unsuru
✅ Beklenmedik son
Örnek: Nasreddin Hoca'nın komşusu...

*Deneme Tanıma:*
✅ Yazarın kişisel görüşü
✅ Serbest üslup
✅ Düşündürücü içerik

*Anı Tanıma:*
✅ "Ben" anlatımı
✅ Geçmiş zaman
✅ Kişisel yaşantı`,
        ek_ipucu: "Metin türü sorusunda önce 'Bu metin ne yapıyor?' diye sor: Anlatıyor mu (epik), hissettiriyor mu (lirik), gösteriyor mu (dramatik), öğretiyor mu (didaktik)?"
      },
      {
        modul_basligi: "LGS'de Metin Türleri Soruları",
        icerik_tipi: "metin",
        metin_icerigi: `🎯 **LGS'DE METİN TÜRLERİ STRATEJİSİ**

**Sık Çıkan Soru Tipleri:**

**1. Doğrudan Tanıma Soruları:**
"Aşağıdaki metin hangi türdedir?"
→ Strateji: İpucu kelimeleri ara, özelliklerine odaklan

**2. Ayırt Etme Soruları:**
"Bu metin masal mıdır hikaye midir?"
→ Strateji: Karşılaştırmalı tablo yap

**3. Özellik Eşleştirme:**
"Bu metnin hangi özelliği bulunmaz?"
→ Strateji: Her türün mutlaka olan özelliklerini bil

**🔥 HIZLI TANIMA TAKTİKLERİ:**

**İlk 5 Saniyede Kontrol Et:**
1. Mısır halinde mi? → Şiir olabilir
2. Parantez içi yönerge var mı? → Tiyatro olabilir  
3. "Bir varmış" ile başlıyor mu? → Masal olabilir
4. "Ben" anlatımı mı? → Anı olabilir

**15 Saniyede Detay Analizi:**
- Zamana bak (belirsiz/kısa/uzun)
- Karakterlere bak (az/çok, gerçek/hayali)
- Amaca bak (eğlendirme/öğretme/duygu)
- Üsluba bak (resmi/samimi/şiirsel)

**⚡ SIKÇA KARIŞAN TÜRLER:**

**Masal vs Efsane:**
- Masal: "Bir varmış", tamamen hayali
- Efsane: Gerçek inanç, mucizevi olaylar

**Hikaye vs Roman:**
- Hikaye: Kısa, az karakter, tek olay
- Roman: Uzun, çok karakter, karmaşık olay

**Şiir vs Türkü:**
- Şiir: Yazılı, kişisel duygu
- Türkü: Sözlü, toplumsal duygu

**Fıkra vs Hikaye:**
- Fıkra: Güldürü amaçlı, öğretici
- Hikaye: Sanat amaçlı, estetik

**🏆 BAŞARI İPUÇLARI:**

✅ Her türün 2-3 temel özelliğini ezberle
✅ Örnek metinleri tanımaya çalış  
✅ Karışan türlerin farkını net bil
✅ Soruda verilen metnin özelliklerini hızla tespit et
✅ Emin olmadığın seçenekleri eleme yöntemiyle ayıkla

**📊 LGS İstatistikleri:**
• Metin türleri sorularının %70'i doğrudan tanıma
• %20'si özellik eşleştirme  
• %10'u ayırt etme soruları
• En çok karışan: Masal-Efsane, Hikaye-Roman`,
        ek_ipucu: "LGS'de metin türü sorusunda aceleci davranma. Metnin tamamını oku, sonra ipucu kelimeleri ve özellikleri listele. Emin ol, sonra işaretle!"
      }
    ];
  }

  private getGenericContent(topic: string): any[] {
    return [
      {
        modul_basligi: `${topic} - Temel Kavramlar`,
        icerik_tipi: "metin",
        metin_icerigi: `Bu ${topic} konusunu öğrenmek için önce temel kavramları anlamamız gerekir. Konunun tanımı, ana bileşenleri ve günlük hayattaki yeri hakkında bilgi edineceğiz.`,
        ek_ipucu: "Konuya başlamadan önce bildiğin kavramları not et."
      },
      {
        modul_basligi: `${topic} - Detaylı Açıklama`,  
        icerik_tipi: "metin",
        metin_icerigi: `${topic} konusunu adım adım öğrenelim. Bu bölümde konunun derinliklerine ineceğiz.`,
        ek_ipucu: "Anlamadığın yerlerde not al ve tekrar et."
      },
      {
        modul_basligi: `${topic} - Örnekler`,
        icerik_tipi: "metin", 
        metin_icerigi: `${topic} konusunda pratik örnekler ve uygulamalar göreceğiz.`,
        ek_ipucu: "Örnekleri kendi kelimelerinle açıklamaya çalış."
      },
      {
        modul_basligi: `${topic} - LGS Hazırlık`,
        icerik_tipi: "metin",
        metin_icerigi: `${topic} konusunun LGS sınavındaki yeri ve soru tipleri hakkında bilgi.`,
        ek_ipucu: "Benzer soruları çözerek pratik yap."
      }
    ];
  }

  private getTopicSummary(topic: string): string {
    if (topic.toLowerCase().includes('metin türleri')) {
      return `🎉 Metin Türleri Konusu Tamamlandı!

🎯 Öğrendiklerin:
• Epik türler: Masal, destan, efsane, hikaye, roman özellikleri
• Lirik türler: Şiir ve özellikleri  
• Dramatik türler: Tiyatro ve özellikleri
• Didaktik türler: Deneme, eleştiri, fıkra, anı özellikleri
• Metin türü tanıma teknikleri ve ipuçları

✅ Sonraki adımlar:
1. Her türden 2-3 örnek metin oku
2. Tanıma alıştırmaları yap
3. LGS sorularını çöz
4. Karıştırdığın türleri tekrar et`;
    }
    
    return `${topic} konusu tamamlandı! Bu konudan sorular çöz ve tekrar et.`;
  }

  // Diğer konu içerikleri için placeholder metodlar
  private getSiirContent(): any[] { return this.getGenericContent("Şiir"); }
  private getDilbilgisiContent(): any[] { return this.getGenericContent("Dilbilgisi"); }
  private getCebirContent(): any[] { return this.getGenericContent("Cebir"); }
  private getGeometriContent(): any[] { return this.getGenericContent("Geometri"); }
  private getFizikContent(): any[] { return this.getGenericContent("Fizik"); }
  private getBiyolojiContent(): any[] { return this.getGenericContent("Biyoloji"); }
  private getTarihContent(): any[] { return this.getGenericContent("Tarih"); }
  private getCografyaContent(): any[] { return this.getGenericContent("Coğrafya"); }

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
        return { success: false, data: null, error: 'JSON parse hatası. Lütfen tekrar deneyin.' };
      }
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, data: null, error: 'API hatası: ' + error };
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
        return { success: false, data: null, error: 'JSON parse hatası. Lütfen tekrar deneyin.' };
      }
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, data: null, error: 'API hatası: ' + error };
    }
  }
}

export const geminiService = new GeminiService();