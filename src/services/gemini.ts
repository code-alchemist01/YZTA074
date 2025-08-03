import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiResponse } from '../types';

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