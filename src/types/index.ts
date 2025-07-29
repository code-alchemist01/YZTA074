// Backend API Model Types (matching SQLAlchemy models)

export interface Ogrenci {
  ogrenci_id: number;
  ogrenci_kullaniciAdi: string;
  ogrenci_email: string;
  ogrenci_sifreHashed: string;
  ogrenci_ad: string;
  ogrenci_soyad: string;
  ogrenci_dogumTarihi?: string;
  ogrenci_okulSeviyesi?: string;
  ogrenci_adhdSeviyesi?: string;
  ogrenci_kayitTarihi?: string;
  ogrenci_odakSuresi?: number;
  ogrenci_soruCozmeHizi?: number;
  ogrenci_basariOrani?: number;
  ogrenci_dikkatSeviyesi?: number;
  ogrenci_mevcutSeviye?: number;
  ogrenci_ogrenmeStili?: string;
  ogrenci_sonGuncellemeTarihi?: string;
}

export interface OgrenciCreate {
  ogrenci_kullaniciAdi: string;
  ogrenci_email: string;
  ogrenci_sifreHashed: string;
  ogrenci_ad: string;
  ogrenci_soyad: string;
  ogrenci_dogumTarihi?: string;
  ogrenci_okulSeviyesi?: string;
  ogrenci_adhdSeviyesi?: string;
  ogrenci_kayitTarihi?: string;
  ogrenci_odakSuresi?: number;
  ogrenci_soruCozmeHizi?: number;
  ogrenci_basariOrani?: number;
  ogrenci_dikkatSeviyesi?: number;
  ogrenci_mevcutSeviye?: number;
  ogrenci_ogrenmeStili?: string;
  ogrenci_sonGuncellemeTarihi?: string;
}

export interface Dersler {
  ders_id: number;
  ders_adi: string;
  ders_baslangicSaati?: string;
  ders_bitisSaati?: string;
  ders_tamamlandiMi?: number;
  ders_kazanilanHalkaSayisi?: number;
  ders_odakPuani?: number;
  ders_enerjiSeviyesi?: number;
  ders_tarihi?: string;
}

export interface DerslerCreate {
  ders_adi: string;
  ders_baslangicSaati?: string;
  ders_bitisSaati?: string;
  ders_tamamlandiMi?: number;
  ders_kazanilanHalkaSayisi?: number;
  ders_odakPuani?: number;
  ders_enerjiSeviyesi?: number;
  ders_tarihi?: string;
}

export interface Konular {
  konu_id: number;
  konu_adi: string;
  konu_seviyesi?: number;
  konu_tipi?: string;
  konu_metni?: string;
  konu_dogruCevap?: string;
  konu_ipucu?: string;
  konu_cozumMetni?: string;
  konu_cozumVideoUrl?: string;
  ders_id?: number;
}

export interface KonularCreate {
  konu_adi: string;
  konu_seviyesi?: number;
  konu_tipi?: string;
  konu_metni?: string;
  konu_dogruCevap?: string;
  konu_ipucu?: string;
  konu_cozumMetni?: string;
  konu_cozumVideoUrl?: string;
  ders_id?: number;
}

export interface SinavSimilasyonlari {
  sinav_id: number;
  sinav_adi?: string;
  sinav_baslangicSaati?: string;
  sinav_bitisSaati?: string;
  sinav_puan?: number;
  sinav_dogruCevapSayisi?: number;
  sinav_yanlisCevapSayisi?: number;
  sinav_tarihi?: string;
  sinav_kullanilanSenaryo?: string;
  sinav_detayliAnalizMetni?: string;
}

export interface SinavSimilasyonlariCreate {
  sinav_adi?: string;
  sinav_baslangicSaati?: string;
  sinav_bitisSaati?: string;
  sinav_puan?: number;
  sinav_dogruCevapSayisi?: number;
  sinav_yanlisCevapSayisi?: number;
  sinav_tarihi?: string;
  sinav_kullanilanSenaryo?: string;
  sinav_detayliAnalizMetni?: string;
}

export interface Istatistikler {
  istatistik_id: number;
  istatistik_tarihi?: string;
  istatistik_gunlukcalismaSuresi?: number;
  istatistik_tamamlananModulSayisi?: number;
  istatistik_ortalamaodakPuani?: number;
  istatistik_cozulenSoruSayisi?: number;
  istatistik_dogruCevapOrani?: number;
  istatistik_kazanilanHalkaSayisi?: number;
  istatistik_molaSayisi?: number;
  istatistik_toplamMolaSuresi?: number;
  istatistik_uykuKalitesi?: number;
  istatistik_notlar?: string;
  ogrenci_id?: number;
}

export interface IstatistiklerCreate {
  istatistik_tarihi?: string;
  istatistik_gunlukcalismaSuresi?: number;
  istatistik_tamamlananModulSayisi?: number;
  istatistik_ortalamaodakPuani?: number;
  istatistik_cozulenSoruSayisi?: number;
  istatistik_dogruCevapOrani?: number;
  istatistik_kazanilanHalkaSayisi?: number;
  istatistik_molaSayisi?: number;
  istatistik_toplamMolaSuresi?: number;
  istatistik_uykuKalitesi?: number;
  istatistik_notlar?: string;
  ogrenci_id?: number;
}

export interface OdullerVeBasarimlar {
  basarim_id: number;
  basarim_adi?: string;
  basarim_kazanmaTarihi?: string;
}

export interface OdullerVeBasarimlarCreate {
  basarim_adi?: string;
  basarim_kazanmaTarihi?: string;
}

export interface ChatbotEtkilesim {
  chatbot_id: number;
  chatbot_soruMetni?: string;
  chatbot_cevapMetni?: string;
  chatbot_zamanDamgasi?: string;
  chatbot_duyguCikarimi?: string;
  ogrenci_id?: number;
}

export interface ChatbotEtkilesimCreate {
  chatbot_soruMetni?: string;
  chatbot_cevapMetni?: string;
  chatbot_zamanDamgasi?: string;
  chatbot_duyguCikarimi?: string;
  ogrenci_id?: number;
}

// Legacy User interface (for compatibility with existing components)
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  grade: string;
  adhdType: 'none' | 'dikkat eksikliği' | 'hiperaktivite' | 'ikisi de';
  learningStyle: string[];
  joinDate: string;
  profilePicture?: string;
  hasCompletedInitialAssessment?: boolean; // İlk değerlendirme sınavını tamamladı mı
}

export interface UserProfile {
  user: User;
  progress: {
    completedLessons: number;
    totalLessons: number;
    completedExams: number;
    totalExams: number;
    averageScore: number;
    focusScore: number;
    studyTime: number;
  };
  preferences: {
    sessionDuration: number;
    breakFrequency: number;
    visualAids: boolean;
    audioSupport: boolean;
  };
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  modules: LessonModule[];
  createdAt: string;
}

export interface LessonModule {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'video' | 'interactive';
  duration: number;
  adhdTips: string[];
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: ExamQuestion[];
  timeLimit: number;
  createdAt: string;
}

export interface ExamQuestion {
  id: string;
  question: string;
  options: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  hint: string;
  subject: string;
}

export interface GeminiRequest {
  type: 'lesson' | 'exam' | 'analysis' | 'mentor' | 'intervention';
  params: Record<string, any>;
}

export interface GeminiResponse {
  success: boolean;
  data: any;
  error?: string;
}

// Helper function to convert Ogrenci to legacy User format
export function ogrenciToUser(ogrenci: Ogrenci): User {
  // Parse learning style string into array
  const learningStyleArray = ogrenci.ogrenci_ogrenmeStili 
    ? ogrenci.ogrenci_ogrenmeStili.split(',').map(style => style.trim()).filter(style => style.length > 0)
    : ['Görsel']; // Default to visual learning

  return {
    id: ogrenci.ogrenci_id.toString(),
    username: ogrenci.ogrenci_kullaniciAdi,
    email: ogrenci.ogrenci_email,
    firstName: ogrenci.ogrenci_ad,
    lastName: ogrenci.ogrenci_soyad,
    birthDate: ogrenci.ogrenci_dogumTarihi,
    grade: ogrenci.ogrenci_okulSeviyesi || '8',
    adhdType: ogrenci.ogrenci_adhdSeviyesi?.toLowerCase() as any || 'none',
    learningStyle: learningStyleArray,
    joinDate: ogrenci.ogrenci_kayitTarihi || new Date().toISOString(),
    profilePicture: undefined,
  };
}

// Helper function to convert User to Ogrenci format
export function userToOgrenci(user: User, hashedPassword: string): OgrenciCreate {
  const currentDateTime = new Date().toISOString(); // ISO datetime format
  const defaultBirthDate = user.birthDate || '2000-01-01'; // Use user's birth date or default
  
  return {
    ogrenci_kullaniciAdi: user.username || user.email.split('@')[0], // Use username or email prefix
    ogrenci_email: user.email,
    ogrenci_sifreHashed: hashedPassword,
    ogrenci_ad: user.firstName,
    ogrenci_soyad: user.lastName,
    ogrenci_dogumTarihi: defaultBirthDate,
    ogrenci_okulSeviyesi: user.grade,
    ogrenci_adhdSeviyesi: user.adhdType,
    ogrenci_kayitTarihi: user.joinDate,
    ogrenci_ogrenmeStili: user.learningStyle.length > 0 ? user.learningStyle.join(',') : 'Görsel', // Ensure at least one learning style
    ogrenci_odakSuresi: 0.0, // Default values set to 0
    ogrenci_soruCozmeHizi: 0.0,
    ogrenci_basariOrani: 0.0,
    ogrenci_dikkatSeviyesi: 0.0,
    ogrenci_mevcutSeviye: 1,
    ogrenci_sonGuncellemeTarihi: currentDateTime, // Required field
  };
}

// LGS Deneme Sınavı İçin Yeni Tipler
export interface LGSExam {
  id: string;
  title: string;
  type: 'LGS2024' | 'LGS2025';
  questions: LGSQuestion[];
  timeLimit: number; // dakika
  subjects: LGSSubject[];
  createdAt: string;
  isInitialAssessment?: boolean; // İlk kayıt sonrası değerlendirme sınavı mı
}

export interface LGSQuestion {
  id: string;
  subject: string;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  timeToSolve?: number; // önerilen çözüm süresi (saniye)
}

export interface LGSSubject {
  name: string;
  questionCount: number;
  totalPoints: number;
}

// Göz Takibi ile İlgili Tipler
export interface EyeTrackingData {
  sessionId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  totalFocusTime: number; // milisaniye
  totalDistractionTime: number; // milisaniye
  distractionEvents: DistractionEvent[];
  attentionScore: number; // 0-100 arası dikkat puanı
  averageGazeStability: number; // göz hareketlerinin kararlılığı
}

export interface DistractionEvent {
  timestamp: string;
  duration: number; // milisaniye
  type: 'gaze_away' | 'blink_excessive' | 'face_not_detected';
  severity: 'low' | 'medium' | 'high';
}

export interface ExamSession {
  id: string;
  examId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  answers: ExamAnswer[];
  eyeTrackingData?: EyeTrackingData;
  score?: number;
  completionPercentage: number;
  timeSpent: number; // milisaniye
  isCompleted: boolean;
}

export interface ExamAnswer {
  questionId: string;
  selectedAnswer?: 'A' | 'B' | 'C' | 'D';
  isCorrect?: boolean;
  timeSpent: number; // bu soruya harcanan süre (milisaniye)
  timestamp: string;
}

// Dikkat Analizi Sonuçları
export interface AttentionAnalysis {
  overallScore: number; // 0-100 arası genel dikkat puanı
  focusPercentage: number; // odaklanma yüzdesi
  distractionCount: number; // dikkat dağınıklığı sayısı
  averageDistractionDuration: number; // ortalama dikkat dağınıklığı süresi
  attentionPattern: 'consistent' | 'variable' | 'declining' | 'improving';
  recommendations: string[]; // öneriler
  comparedToAverage: 'above' | 'average' | 'below'; // yaşına göre karşılaştırma
}

// Sınav Sonuç Raporu
export interface ExamResult {
  examSession: ExamSession;
  academicScore: number; // akademik başarı puanı
  attentionAnalysis: AttentionAnalysis;
  subjectBreakdown: SubjectResult[];
  timeManagement: TimeManagementAnalysis;
  overallFeedback: string;
  nextSteps: string[];
}

export interface SubjectResult {
  subject: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  averageTimePerQuestion: number;
  attentionDuringSubject: number;
}

export interface TimeManagementAnalysis {
  totalTimeUsed: number;
  timeEfficiency: number; // 0-100 arası
  quickestQuestion: number; // en hızlı çözülen soru süresi
  slowestQuestion: number; // en yavaş çözülen soru süresi
  timeDistribution: { [subject: string]: number }; // konulara göre zaman dağılımı
}