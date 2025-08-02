import { ApiService } from '../services/api';
import { 
  Dersler, DerslerCreate, 
  Istatistikler, IstatistiklerCreate,
  SinavSimilasyonlari, SinavSimilasyonlariCreate 
} from '../types';

export interface StudySession {
  id: string;
  userId: string;
  type: 'lesson' | 'exam';
  subject: string;
  topic: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  score?: number; // for exams
  completed: boolean;
  focusScore?: number; // 1-100
}

export interface UserActivity {
  userId: string;
  studySessions: StudySession[];
  totalStudyTime: number; // minutes
  completedLessons: number;
  completedExams: number;
  averageScore: number;
  subjectProgress: Record<string, {
    totalTime: number;
    completedLessons: number;
    completedExams: number;
    averageScore: number;
  }>;
  weeklyActivity: Record<string, number>; // day -> minutes
  monthlyActivity: Record<string, number>; // date -> minutes
}

export class DataStorage {
  private static readonly STUDY_SESSIONS_KEY = 'marathon_study_sessions';
  private static readonly USER_ACTIVITY_KEY = 'marathon_user_activity';

  static startStudySession(userId: string, type: 'lesson' | 'exam', subject: string, topic: string): string {
    try {
      const sessionId = this.generateId();
      const session: StudySession = {
        id: sessionId,
        userId,
        type,
        subject,
        topic,
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        completed: false,
      };

      // Store locally for immediate access
      const sessions = this.getStudySessions();
      sessions.push(session);
      localStorage.setItem(this.STUDY_SESSIONS_KEY, JSON.stringify(sessions));
      
      // Try to create backend entry asynchronously (non-blocking)
      if (type === 'lesson') {
        const dersData: DerslerCreate = {
          ders_adi: `${subject} - ${topic}`,
          ders_baslangicSaati: session.startTime.toISOString(),
          ders_tamamlandiMi: 0,
          ders_tarihi: session.startTime.toISOString().split('T')[0],
        };
        
        // Non-blocking backend call
        ApiService.createDers(dersData).catch(error => {
          console.warn('Failed to create lesson in backend:', error);
          console.warn('Ders data that failed:', dersData);
          if (error.response) {
            console.warn('Backend error response:', error.response.data);
            console.warn('Backend error status:', error.response.status);
          }
          // Continue working with local data only
        });
      }
      
      return sessionId;
    } catch (error) {
      console.error('Error starting study session:', error);
      // Fallback to local-only storage
      return this.startLocalStudySession(userId, type, subject, topic);
    }
  }

  static endStudySession(sessionId: string, score?: number, focusScore?: number): void {
    try {
      const sessions = this.getStudySessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex !== -1) {
        const session = sessions[sessionIndex];
        session.endTime = new Date();
        session.duration = Math.round((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60));
        session.completed = true;
        if (score !== undefined) session.score = score;
        if (focusScore !== undefined) session.focusScore = focusScore;
        
        sessions[sessionIndex] = session;
        localStorage.setItem(this.STUDY_SESSIONS_KEY, JSON.stringify(sessions));
        
        // Update backend (non-blocking)
        this.syncSessionToBackend(session).catch(error => {
          console.warn('Failed to sync session to backend:', error);
        });
        
        // Update user activity (non-blocking)
        this.updateUserActivity(session.userId).catch(error => {
          console.warn('Failed to update user activity:', error);
        });
      }
    } catch (error) {
      console.error('Error ending study session:', error);
      // Fallback to local-only update
      this.endLocalStudySession(sessionId, score, focusScore);
    }
  }

  private static async syncSessionToBackend(session: StudySession): Promise<void> {
    try {
      if (session.type === 'exam' && session.score !== undefined) {
        // Create exam simulation record
        const sinavData: SinavSimilasyonlariCreate = {
          sinav_adi: `${session.subject} - ${session.topic}`,
          sinav_baslangicSaati: session.startTime.toISOString(),
          sinav_bitisSaati: session.endTime.toISOString(),
          sinav_puan: session.score,
          sinav_tarihi: session.startTime.toISOString().split('T')[0],
        };
        
        await ApiService.createSinav(sinavData);
      }

      // Create statistics record
      const today = new Date().toISOString().split('T')[0];
      const statsData: IstatistiklerCreate = {
        istatistik_tarihi: today,
        istatistik_gunlukcalismaSuresi: session.duration,
        istatistik_tamamlananModulSayisi: session.completed ? 1 : 0,
        istatistik_ortalamaodakPuani: session.focusScore || 0,
        istatistik_cozulenSoruSayisi: session.type === 'exam' ? 1 : 0,
        istatistik_dogruCevapOrani: session.score || 0,
        ogrenci_id: parseInt(session.userId),
      };
      
      await ApiService.createIstatistik(statsData);
    } catch (error) {
      console.warn('Failed to sync session to backend:', error);
    }
  }

  static getStudySessions(userId?: string): StudySession[] {
    const sessions = localStorage.getItem(this.STUDY_SESSIONS_KEY);
    const allSessions: StudySession[] = sessions ? JSON.parse(sessions) : [];
    
    // Convert string dates back to Date objects
    const convertedSessions = allSessions.map(session => ({
      ...session,
      startTime: new Date(session.startTime),
      endTime: new Date(session.endTime)
    }));
    
    return userId ? convertedSessions.filter(s => s.userId === userId) : convertedSessions;
  }

  static async getUserActivity(userId: string): Promise<UserActivity> {
    try {
      // Try to get fresh data from backend
      const backendStats = await this.getBackendUserActivity(userId);
      if (backendStats) {
        return backendStats;
      }
    } catch (error) {
      console.warn('Failed to get backend user activity, using local data:', error);
    }

    // Fallback to local calculation
    return this.getLocalUserActivity(userId);
  }

  private static async getBackendUserActivity(userId: string): Promise<UserActivity | null> {
    try {
      const stats = await ApiService.getIstatistikler(0, 100);
      const userStats = stats.filter((stat: Istatistikler) => 
        stat.ogrenci_id === parseInt(userId)
      );

      if (userStats.length === 0) {
        return null;
      }

      // Calculate aggregated data from backend statistics
      const totalStudyTime = userStats.reduce((total: number, stat: Istatistikler) => 
        total + (stat.istatistik_gunlukcalismaSuresi || 0), 0
      );

      const completedLessons = userStats.reduce((total: number, stat: Istatistikler) => 
        total + (stat.istatistik_tamamlananModulSayisi || 0), 0
      );

      const completedExams = userStats.reduce((total: number, stat: Istatistikler) => 
        total + (stat.istatistik_cozulenSoruSayisi || 0), 0
      );

      const avgScores = userStats
        .map((stat: Istatistikler) => stat.istatistik_dogruCevapOrani || 0)
        .filter((score: number) => score > 0);
      
      const averageScore = avgScores.length > 0 
        ? Math.round(avgScores.reduce((a: number, b: number) => a + b, 0) / avgScores.length)
        : 0;

      // Get local sessions for detailed analysis
      const sessions = this.getStudySessions(userId);
      const weeklyActivity = this.calculateWeeklyActivity(sessions);
      const monthlyActivity = this.calculateMonthlyActivity(sessions);
      const subjectProgress = this.calculateSubjectProgress(sessions);

      return {
        userId,
        studySessions: sessions.filter(s => s.completed),
        totalStudyTime,
        completedLessons,
        completedExams,
        averageScore,
        subjectProgress,
        weeklyActivity,
        monthlyActivity
      };
    } catch (error) {
      console.error('Error getting backend user activity:', error);
      return null;
    }
  }

  private static getLocalUserActivity(userId: string): UserActivity {
    const sessions = this.getStudySessions(userId);
    const completedSessions = sessions.filter(s => s.completed);
    
    // Calculate total study time
    const totalStudyTime = completedSessions.reduce((total, session) => total + session.duration, 0);
    
    // Count completed lessons and exams
    const completedLessons = completedSessions.filter(s => s.type === 'lesson').length;
    const completedExams = completedSessions.filter(s => s.type === 'exam').length;
    
    // Calculate average score
    const examSessions = completedSessions.filter(s => s.type === 'exam' && s.score !== undefined);
    const averageScore = examSessions.length > 0 
      ? Math.round(examSessions.reduce((total, session) => total + (session.score || 0), 0) / examSessions.length)
      : 0;
    
    return {
      userId,
      studySessions: completedSessions,
      totalStudyTime,
      completedLessons,
      completedExams,
      averageScore,
      subjectProgress: this.calculateSubjectProgress(completedSessions),
      weeklyActivity: this.calculateWeeklyActivity(completedSessions),
      monthlyActivity: this.calculateMonthlyActivity(completedSessions)
    };
  }

  private static calculateSubjectProgress(sessions: StudySession[]): Record<string, any> {
    const subjectProgress: Record<string, any> = {};
    sessions.forEach(session => {
      if (!subjectProgress[session.subject]) {
        subjectProgress[session.subject] = {
          totalTime: 0,
          completedLessons: 0,
          completedExams: 0,
          scores: []
        };
      }
      
      subjectProgress[session.subject].totalTime += session.duration;
      if (session.type === 'lesson') {
        subjectProgress[session.subject].completedLessons++;
      } else if (session.type === 'exam') {
        subjectProgress[session.subject].completedExams++;
        if (session.score !== undefined) {
          subjectProgress[session.subject].scores.push(session.score);
        }
      }
    });
    
    // Calculate average scores for each subject
    Object.keys(subjectProgress).forEach(subject => {
      const scores = subjectProgress[subject].scores;
      subjectProgress[subject].averageScore = scores.length > 0
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        : 0;
      delete subjectProgress[subject].scores;
    });
    
    return subjectProgress;
  }

  private static calculateWeeklyActivity(sessions: StudySession[]): Record<string, number> {
    const weeklyActivity: Record<string, number> = {};
    const today = new Date();
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = dayNames[date.getDay()];
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayMinutes = sessions
        .filter(session => session.startTime >= dayStart && session.startTime <= dayEnd)
        .reduce((total, session) => total + session.duration, 0);
      
      weeklyActivity[dayName] = dayMinutes;
    }
    
    return weeklyActivity;
  }

  private static calculateMonthlyActivity(sessions: StudySession[]): Record<string, number> {
    const monthlyActivity: Record<string, number> = {};
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayMinutes = sessions
        .filter(session => session.startTime >= dayStart && session.startTime <= dayEnd)
        .reduce((total, session) => total + session.duration, 0);
      
      monthlyActivity[dateKey] = dayMinutes;
    }
    
    return monthlyActivity;
  }

  // Legacy local-only methods for fallback
  private static startLocalStudySession(userId: string, type: 'lesson' | 'exam', subject: string, topic: string): string {
    const sessionId = this.generateId();
    const session: StudySession = {
      id: sessionId,
      userId,
      type,
      subject,
      topic,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      completed: false,
    };

    const sessions = this.getStudySessions();
    sessions.push(session);
    localStorage.setItem(this.STUDY_SESSIONS_KEY, JSON.stringify(sessions));
    
    return sessionId;
  }

  private static endLocalStudySession(sessionId: string, score?: number, focusScore?: number): void {
    const sessions = this.getStudySessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      const session = sessions[sessionIndex];
      session.endTime = new Date();
      session.duration = Math.round((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60));
      session.completed = true;
      if (score !== undefined) session.score = score;
      if (focusScore !== undefined) session.focusScore = focusScore;
      
      sessions[sessionIndex] = session;
      localStorage.setItem(this.STUDY_SESSIONS_KEY, JSON.stringify(sessions));
    }
  }

  static getTimeRangeData(userId: string, range: 'week' | 'month' | 'year') {
    const sessions = this.getStudySessions(userId);
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0);
    }
    
    return sessions.filter(session => session.startTime >= startDate);
  }

  private static async updateUserActivity(userId: string): Promise<void> {
    // This method is now primarily handled by syncSessionToBackend
    // but we keep it for compatibility
    try {
      const activity = await this.getUserActivity(userId);
      localStorage.setItem(`${this.USER_ACTIVITY_KEY}_${userId}`, JSON.stringify(activity));
    } catch (error) {
      console.warn('Failed to update user activity:', error);
    }
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}