import { LGSExam, LGSQuestion, LGSSubject, ExamSession, ExamAnswer, ExamResult, SubjectResult, TimeManagementAnalysis, AttentionAnalysis, EyeTrackingData } from '../types';
import { GeminiService } from './gemini';

export class LGSExamService {
  private static readonly STORAGE_KEY = 'marathon_lgs_exams';
  private static readonly SESSION_STORAGE_KEY = 'marathon_exam_sessions';

  // LGS 2024 ve 2025 formatları
  private static readonly LGS_2024_SUBJECTS: LGSSubject[] = [
    { name: 'Türkçe', questionCount: 20, totalPoints: 20 },
    { name: 'Matematik', questionCount: 20, totalPoints: 20 },
    { name: 'Fen Bilimleri', questionCount: 20, totalPoints: 20 },
    { name: 'T.C. İnkılap Tarihi ve Atatürkçülük', questionCount: 10, totalPoints: 10 },
    { name: 'Din Kültürü ve Ahlak Bilgisi', questionCount: 10, totalPoints: 10 },
    { name: 'İngilizce', questionCount: 10, totalPoints: 10 }
  ];

  private static readonly LGS_2025_SUBJECTS: LGSSubject[] = [
    { name: 'Türkçe', questionCount: 20, totalPoints: 20 },
    { name: 'Matematik', questionCount: 20, totalPoints: 20 },
    { name: 'Fen Bilimleri', questionCount: 20, totalPoints: 20 },
    { name: 'Sosyal Bilgiler', questionCount: 15, totalPoints: 15 },
    { name: 'İngilizce', questionCount: 15, totalPoints: 15 }
  ];

  // İlk kayıt sonrası değerlendirme sınavı oluştur
  static async createInitialAssessmentExam(userGrade: string, userLearningStyle: string[]): Promise<LGSExam> {
    const examType = userGrade === '8' ? 'LGS2025' : 'LGS2024';
    const subjects = examType === 'LGS2025' ? this.LGS_2025_SUBJECTS : this.LGS_2024_SUBJECTS;
    
    const examId = `initial_${examType}_${Date.now()}`;
    
    // AI ile soru üretimi
    const questions = await this.generateQuestionsWithAI(subjects, userLearningStyle, examType);
    
    const exam: LGSExam = {
      id: examId,
      title: `${examType} İlk Değerlendirme Sınavı`,
      type: examType,
      questions,
      timeLimit: 90, // 90 dakika
      subjects,
      createdAt: new Date().toISOString(),
      isInitialAssessment: true
    };

    // Sınavı local storage'a kaydet
    this.saveExam(exam);
    
    return exam;
  }

  // AI ile soru üretimi
  private static async generateQuestionsWithAI(
    subjects: LGSSubject[], 
    learningStyle: string[], 
    examType: 'LGS2024' | 'LGS2025'
  ): Promise<LGSQuestion[]> {
    const questions: LGSQuestion[] = [];
    
    for (const subject of subjects) {
      try {
        const subjectQuestions = await this.generateSubjectQuestions(
          subject, 
          learningStyle, 
          examType
        );
        questions.push(...subjectQuestions);
      } catch (error) {
        console.error(`Error generating questions for ${subject.name}:`, error);
        // Fallback: manuel sorular ekle
        const fallbackQuestions = this.getFallbackQuestions(subject, examType);
        questions.push(...fallbackQuestions);
      }
    }
    
    return questions;
  }

  private static async generateSubjectQuestions(
    subject: LGSSubject, 
    learningStyle: string[], 
    examType: string
  ): Promise<LGSQuestion[]> {
    const prompt = `${examType} formatında ${subject.name} dersi için ${subject.questionCount} adet çoktan seçmeli soru oluştur.
    
    Öğrenci öğrenme stili: ${learningStyle.join(', ')}
    
    Her soru için:
    - Soru metni
    - 4 seçenek (A, B, C, D)
    - Doğru cevap
    - Zorluk seviyesi (kolay, orta, zor)
    - Çözüm süresi (saniye)
    
    Sorular 8. sınıf seviyesinde olmalı ve öğrenci profiline uygun olmalı.
    
    JSON formatında yanıt ver:
    {
      "questions": [
        {
          "questionText": "...",
          "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
          "correctAnswer": "A",
          "difficulty": "easy",
          "timeToSolve": 120
        }
      ]
    }`;

         try {
       const { geminiService } = await import('./gemini');
       const response = await geminiService.generateExam({
         topic: subject.name,
         questionCount: subject.questionCount,
         difficulty: 'medium',
         studentProfile: { learningStyle }
       });

       if (response.success && response.data.sorular) {
         return response.data.sorular.map((q: any, index: number) => ({
           id: `${subject.name.toLowerCase()}_${index + 1}_${Date.now()}`,
           subject: subject.name,
           questionText: q.soru_metni,
           options: q.secenekler,
           correctAnswer: q.dogru_cevap,
           difficulty: 'medium' as 'easy' | 'medium' | 'hard',
           points: 1,
           timeToSolve: 120
         }));
       }
    } catch (error) {
      console.error('AI question generation failed:', error);
    }

    // Fallback'e geri dön
    return this.getFallbackQuestions(subject, examType);
  }

  // Manuel fallback sorular
  private static getFallbackQuestions(subject: LGSSubject, examType: string): LGSQuestion[] {
    const questions: LGSQuestion[] = [];
    
    // Konu bazında örnek sorular
    const sampleQuestions = this.getSampleQuestionsBySubject(subject.name);
    
    for (let i = 0; i < subject.questionCount; i++) {
      const sampleIndex = i % sampleQuestions.length;
      const sample = sampleQuestions[sampleIndex];
      
      questions.push({
        id: `${subject.name.toLowerCase().replace(/\s+/g, '_')}_fallback_${i + 1}_${Date.now()}`,
        subject: subject.name,
        questionText: sample.questionText.replace('{{i}}', (i + 1).toString()),
        options: sample.options,
        correctAnswer: sample.correctAnswer,
        difficulty: sample.difficulty,
        points: 1,
        timeToSolve: sample.timeToSolve || 120
      });
    }
    
    return questions;
  }

  private static getSampleQuestionsBySubject(subjectName: string): any[] {
    const questionBank: Record<string, any[]> = {
      'Türkçe': [
        {
          questionText: 'Aşağıdaki cümlelerin hangisinde özne belirtisizdir?',
          options: {
            A: 'Kitabı masanın üzerine koydum.',
            B: 'Kapıyı çaldılar.',
            C: 'Öğretmen dersi anlattı.',
            D: 'Çocuklar bahçede oynuyor.'
          },
          correctAnswer: 'B',
          difficulty: 'medium',
          timeToSolve: 90
        },
        {
          questionText: 'Hangi kelimede büyük ünlü uyumu yoktur?',
          options: {
            A: 'kitap',
            B: 'kalem',
            C: 'elma',
            D: 'bisiklet'
          },
          correctAnswer: 'D',
          difficulty: 'easy',
          timeToSolve: 60
        }
      ],
      'Matematik': [
        {
          questionText: '3x + 5 = 14 denkleminde x kaçtır?',
          options: {
            A: '2',
            B: '3',
            C: '4',
            D: '5'
          },
          correctAnswer: 'B',
          difficulty: 'medium',
          timeToSolve: 120
        },
        {
          questionText: 'Bir üçgenin iç açıları toplamı kaç derecedir?',
          options: {
            A: '90°',
            B: '180°',
            C: '270°',
            D: '360°'
          },
          correctAnswer: 'B',
          difficulty: 'easy',
          timeToSolve: 60
        }
      ],
      'Fen Bilimleri': [
        {
          questionText: 'Işığın cam içindeki hızı havadaki hızından nasıldır?',
          options: {
            A: 'Daha hızlıdır',
            B: 'Daha yavaştır',
            C: 'Eşittir',
            D: 'Bazen hızlı bazen yavaştır'
          },
          correctAnswer: 'B',
          difficulty: 'medium',
          timeToSolve: 90
        },
        {
          questionText: 'Bir maddenin hal değişimi sırasında sıcaklığı nasıl değişir?',
          options: {
            A: 'Sürekli artar',
            B: 'Sürekli azalır',
            C: 'Sabit kalır',
            D: 'Önce artar sonra azalır'
          },
          correctAnswer: 'C',
          difficulty: 'medium',
          timeToSolve: 120
        },
        {
          questionText: 'Fotosentez olayında hangi gaz açığa çıkar?',
          options: {
            A: 'Karbondioksit',
            B: 'Oksijen',
            C: 'Azot',
            D: 'Hidrojen'
          },
          correctAnswer: 'B',
          difficulty: 'easy',
          timeToSolve: 60
        },
        {
          questionText: 'Elektrik akımının birimi nedir?',
          options: {
            A: 'Volt',
            B: 'Amper',
            C: 'Ohm',
            D: 'Watt'
          },
          correctAnswer: 'B',
          difficulty: 'easy',
          timeToSolve: 60
        }
      ],
      'Sosyal Bilgiler': [
        {
          questionText: 'Türkiye Cumhuriyeti hangi tarihte kurulmuştur?',
          options: {
            A: '23 Nisan 1920',
            B: '19 Mayıs 1919',
            C: '29 Ekim 1923',
            D: '30 Ağustos 1922'
          },
          correctAnswer: 'C',
          difficulty: 'easy',
          timeToSolve: 60
        },
        {
          questionText: 'Aşağıdakilerden hangisi Türkiye\'nin coğrafi bölgelerinden biri değildir?',
          options: {
            A: 'Marmara Bölgesi',
            B: 'Ege Bölgesi',
            C: 'Batı Anadolu Bölgesi',
            D: 'Karadeniz Bölgesi'
          },
          correctAnswer: 'C',
          difficulty: 'medium',
          timeToSolve: 90
        }
      ],
      'İngilizce': [
        {
          questionText: 'What is the past tense of "go"?',
          options: {
            A: 'goed',
            B: 'went',
            C: 'gone',
            D: 'going'
          },
          correctAnswer: 'B',
          difficulty: 'easy',
          timeToSolve: 60
        },
        {
          questionText: 'Which one is correct?',
          options: {
            A: 'I am going to school.',
            B: 'I am go to school.',
            C: 'I going to school.',
            D: 'I goes to school.'
          },
          correctAnswer: 'A',
          difficulty: 'medium',
          timeToSolve: 90
        }
      ],
      'T.C. İnkılap Tarihi ve Atatürkçülük': [
        {
          questionText: 'Atatürk\'ün ilkelerinden hangisi "halka rağmen halk için" anlayışını reddeder?',
          options: {
            A: 'Cumhuriyetçilik',
            B: 'Halkçılık',
            C: 'Devletçilik',
            D: 'Laiklik'
          },
          correctAnswer: 'B',
          difficulty: 'medium',
          timeToSolve: 120
        }
      ],
      'Din Kültürü ve Ahlak Bilgisi': [
        {
          questionText: 'İslam dininin temel kaynaklarından biri aşağıdakilerden hangisidir?',
          options: {
            A: 'Kur\'an-ı Kerim',
            B: 'Tevrat',
            C: 'İncil',
            D: 'Zebur'
          },
          correctAnswer: 'A',
          difficulty: 'easy',
          timeToSolve: 60
        }
      ]
    };

    return questionBank[subjectName] || [
      {
        questionText: `${subjectName} konusunda {{i}}. soru metni`,
        options: {
          A: 'Seçenek A',
          B: 'Seçenek B',
          C: 'Seçenek C',
          D: 'Seçenek D'
        },
        correctAnswer: 'A',
        difficulty: 'medium',
        timeToSolve: 120
      }
    ];
  }

  // Sınav session'ı başlat
  static startExamSession(examId: string, userId: string): ExamSession {
    const session: ExamSession = {
      id: `session_${examId}_${userId}_${Date.now()}`,
      examId,
      userId,
      startTime: new Date().toISOString(),
      answers: [],
      completionPercentage: 0,
      timeSpent: 0,
      isCompleted: false
    };

    this.saveExamSession(session);
    return session;
  }

  // Cevap kaydet
  static saveAnswer(
    sessionId: string, 
    questionId: string, 
    selectedAnswer: 'A' | 'B' | 'C' | 'D',
    timeSpent: number
  ): void {
    const session = this.getExamSession(sessionId);
    if (!session) return;

    // Mevcut cevabı güncelle veya yeni cevap ekle
    const existingAnswerIndex = session.answers.findIndex(a => a.questionId === questionId);
    
    const answer: ExamAnswer = {
      questionId,
      selectedAnswer,
      timeSpent,
      timestamp: new Date().toISOString()
    };

    if (existingAnswerIndex >= 0) {
      session.answers[existingAnswerIndex] = answer;
    } else {
      session.answers.push(answer);
    }

    // Completion percentage güncelle
    const exam = this.getExam(session.examId);
    if (exam) {
      session.completionPercentage = (session.answers.length / exam.questions.length) * 100;
    }

    this.saveExamSession(session);
  }

  // Sınavı bitir ve sonuçları hesapla
  static async finishExam(
    sessionId: string, 
    eyeTrackingData?: EyeTrackingData
  ): Promise<ExamResult> {
    const session = this.getExamSession(sessionId);
    const exam = this.getExam(session!.examId);
    
    if (!session || !exam) {
      throw new Error('Session veya exam bulunamadı');
    }

    // Session'ı bitir
    session.endTime = new Date().toISOString();
    session.isCompleted = true;
    session.timeSpent = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
    
    // Göz takibi verisi varsa ekle
    if (eyeTrackingData) {
      session.eyeTrackingData = eyeTrackingData;
    }

    // Cevapları kontrol et ve puanla
    let correctAnswers = 0;
    let totalPoints = 0;

    session.answers.forEach(answer => {
      const question = exam.questions.find(q => q.id === answer.questionId);
      if (question) {
        const isCorrect = answer.selectedAnswer === question.correctAnswer;
        answer.isCorrect = isCorrect;
        
        if (isCorrect) {
          correctAnswers++;
          totalPoints += question.points;
        }
      }
    });

    session.score = totalPoints;

    // Konu bazında analiz
    const subjectBreakdown = this.calculateSubjectBreakdown(session, exam);
    
    // Zaman yönetimi analizi
    const timeManagement = this.calculateTimeManagement(session, exam);
    
    // Dikkat analizi
    let attentionAnalysis: AttentionAnalysis | undefined;
    if (eyeTrackingData) {
      // EyeTrackingService'den import edilecek
      const { EyeTrackingService } = await import('./eyeTracking');
      const eyeTrackingService = EyeTrackingService.getInstance();
      attentionAnalysis = eyeTrackingService.generateAttentionAnalysis(eyeTrackingData);
    }

    // Genel geri bildirim oluştur
    const overallFeedback = await this.generateOverallFeedback(
      session, 
      exam, 
      subjectBreakdown, 
      attentionAnalysis
    );

    // Sonraki adımlar öner
    const nextSteps = this.generateNextSteps(subjectBreakdown, attentionAnalysis);

    const result: ExamResult = {
      examSession: session,
      academicScore: Math.round((totalPoints / exam.questions.length) * 100),
      attentionAnalysis: attentionAnalysis || {
        overallScore: 85, // Varsayılan değer
        focusPercentage: 85,
        distractionCount: 0,
        averageDistractionDuration: 0,
        attentionPattern: 'consistent',
        recommendations: [],
        comparedToAverage: 'average'
      },
      subjectBreakdown,
      timeManagement,
      overallFeedback,
      nextSteps
    };

    // Session'ı kaydet
    this.saveExamSession(session);

    return result;
  }

  private static calculateSubjectBreakdown(session: ExamSession, exam: LGSExam): SubjectResult[] {
    const subjectResults: SubjectResult[] = [];

    exam.subjects.forEach(subject => {
      const subjectQuestions = exam.questions.filter(q => q.subject === subject.name);
      const subjectAnswers = session.answers.filter(a => 
        subjectQuestions.some(q => q.id === a.questionId)
      );

      const correctAnswers = subjectAnswers.filter(a => a.isCorrect).length;
      const totalQuestions = subjectQuestions.length;
      const averageTimePerQuestion = subjectAnswers.length > 0
        ? subjectAnswers.reduce((sum, a) => sum + a.timeSpent, 0) / subjectAnswers.length
        : 0;

      subjectResults.push({
        subject: subject.name,
        score: Math.round((correctAnswers / totalQuestions) * 100),
        correctAnswers,
        totalQuestions,
        averageTimePerQuestion: Math.round(averageTimePerQuestion / 1000), // saniye
        attentionDuringSubject: 85 // Varsayılan, göz takibi ile hesaplanabilir
      });
    });

    return subjectResults;
  }

  private static calculateTimeManagement(session: ExamSession, exam: LGSExam): TimeManagementAnalysis {
    const totalTimeUsed = session.timeSpent;
    const maxAllowedTime = exam.timeLimit * 60 * 1000; // milisaniye
    const timeEfficiency = Math.min(100, (maxAllowedTime / totalTimeUsed) * 100);

    const questionTimes = session.answers.map(a => a.timeSpent);
    const quickestQuestion = Math.min(...questionTimes) / 1000; // saniye
    const slowestQuestion = Math.max(...questionTimes) / 1000; // saniye

    // Konu bazında zaman dağılımı
    const timeDistribution: { [subject: string]: number } = {};
    exam.subjects.forEach(subject => {
      const subjectQuestions = exam.questions.filter(q => q.subject === subject.name);
      const subjectAnswers = session.answers.filter(a => 
        subjectQuestions.some(q => q.id === a.questionId)
      );
      
      const subjectTime = subjectAnswers.reduce((sum, a) => sum + a.timeSpent, 0);
      timeDistribution[subject.name] = Math.round(subjectTime / 1000 / 60); // dakika
    });

    return {
      totalTimeUsed: Math.round(totalTimeUsed / 1000 / 60), // dakika
      timeEfficiency: Math.round(timeEfficiency),
      quickestQuestion: Math.round(quickestQuestion),
      slowestQuestion: Math.round(slowestQuestion),
      timeDistribution
    };
  }

  private static async generateOverallFeedback(
    session: ExamSession,
    exam: LGSExam,
    subjectBreakdown: SubjectResult[],
    attentionAnalysis?: AttentionAnalysis
  ): Promise<string> {
    const score = session.score || 0;
    const totalQuestions = exam.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    let feedback = `${exam.title} sonuçlarınız:\n\n`;
    feedback += `🎯 Genel Başarı: %${percentage}\n`;
    feedback += `✅ Doğru Cevap: ${score}/${totalQuestions}\n\n`;

    // Konu bazında performans
    feedback += "📚 Konu Bazında Performans:\n";
    subjectBreakdown.forEach(subject => {
      const emoji = subject.score >= 80 ? '🟢' : subject.score >= 60 ? '🟡' : '🔴';
      feedback += `${emoji} ${subject.subject}: %${subject.score}\n`;
    });

    // Dikkat analizi varsa ekle
    if (attentionAnalysis) {
      feedback += `\n🧠 Dikkat Analizi:\n`;
      feedback += `• Genel Dikkat Puanı: ${attentionAnalysis.overallScore}/100\n`;
      feedback += `• Odaklanma Oranı: %${attentionAnalysis.focusPercentage}\n`;
      feedback += `• Dikkat Dağınıklığı: ${attentionAnalysis.distractionCount} kez\n`;
    }

    return feedback;
  }

  private static generateNextSteps(
    subjectBreakdown: SubjectResult[],
    attentionAnalysis?: AttentionAnalysis
  ): string[] {
    const nextSteps: string[] = [];

    // Akademik öneriler
    const weakSubjects = subjectBreakdown.filter(s => s.score < 70);
    if (weakSubjects.length > 0) {
      nextSteps.push(`${weakSubjects.map(s => s.subject).join(', ')} konularında ek çalışma yapın`);
    }

    const strongSubjects = subjectBreakdown.filter(s => s.score >= 85);
    if (strongSubjects.length > 0) {
      nextSteps.push(`${strongSubjects.map(s => s.subject).join(', ')} konularındaki başarınızı koruyun`);
    }

    // Dikkat önerileri
    if (attentionAnalysis) {
      nextSteps.push(...attentionAnalysis.recommendations);
    }

    return nextSteps;
  }

  // Storage yardımcı metodları
  private static saveExam(exam: LGSExam): void {
    const exams = this.getAllExams();
    exams.push(exam);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(exams));
  }

  private static getAllExams(): LGSExam[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static getExam(examId: string): LGSExam | null {
    const exams = this.getAllExams();
    return exams.find(e => e.id === examId) || null;
  }

  private static saveExamSession(session: ExamSession): void {
    const sessions = this.getAllExamSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    
    localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(sessions));
  }

  private static getAllExamSessions(): ExamSession[] {
    const data = localStorage.getItem(this.SESSION_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private static getExamSession(sessionId: string): ExamSession | null {
    const sessions = this.getAllExamSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  // Kullanıcının sınav geçmişini getir
  static getUserExamHistory(userId: string): ExamSession[] {
    const sessions = this.getAllExamSessions();
    return sessions.filter(s => s.userId === userId && s.isCompleted);
  }
} 