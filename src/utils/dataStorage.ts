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

  static endStudySession(sessionId: string, score?: number, focusScore?: number): void {
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
      
      // Update user activity
      this.updateUserActivity(session.userId);
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

  static getUserActivity(userId: string): UserActivity {
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
    
    // Calculate subject progress
    const subjectProgress: Record<string, any> = {};
    completedSessions.forEach(session => {
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
    
    // Calculate weekly activity (last 7 days)
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
      
      const dayMinutes = completedSessions
        .filter(session => session.startTime >= dayStart && session.startTime <= dayEnd)
        .reduce((total, session) => total + session.duration, 0);
      
      weeklyActivity[dayName] = dayMinutes;
    }
    
    // Calculate monthly activity (last 30 days)
    const monthlyActivity: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayMinutes = completedSessions
        .filter(session => session.startTime >= dayStart && session.startTime <= dayEnd)
        .reduce((total, session) => total + session.duration, 0);
      
      monthlyActivity[dateKey] = dayMinutes;
    }
    
    return {
      userId,
      studySessions: completedSessions,
      totalStudyTime,
      completedLessons,
      completedExams,
      averageScore,
      subjectProgress,
      weeklyActivity,
      monthlyActivity
    };
  }

  static getTimeRangeData(userId: string, range: 'week' | 'month' | 'year') {
    const sessions = this.getStudySessions(userId);
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    const filteredSessions = sessions.filter(session => 
      session.completed && session.startTime >= startDate
    );
    
    const studyTime = filteredSessions.reduce((total, session) => total + session.duration, 0);
    const lessonsCompleted = filteredSessions.filter(s => s.type === 'lesson').length;
    const examsCompleted = filteredSessions.filter(s => s.type === 'exam').length;
    
    const examSessions = filteredSessions.filter(s => s.type === 'exam' && s.score !== undefined);
    const averageScore = examSessions.length > 0 
      ? Math.round(examSessions.reduce((total, session) => total + (session.score || 0), 0) / examSessions.length)
      : 0;
    
    const focusSessions = filteredSessions.filter(s => s.focusScore !== undefined);
    const focusScore = focusSessions.length > 0
      ? Math.round(focusSessions.reduce((total, session) => total + (session.focusScore || 0), 0) / focusSessions.length)
      : 0;
    
    return {
      studyTime,
      lessonsCompleted,
      examsCompleted,
      averageScore,
      focusScore
    };
  }

  private static updateUserActivity(userId: string): void {
    const activity = this.getUserActivity(userId);
    const activities = this.getAllUserActivities();
    const existingIndex = activities.findIndex(a => a.userId === userId);
    
    if (existingIndex !== -1) {
      activities[existingIndex] = activity;
    } else {
      activities.push(activity);
    }
    
    localStorage.setItem(this.USER_ACTIVITY_KEY, JSON.stringify(activities));
  }

  private static getAllUserActivities(): UserActivity[] {
    const activities = localStorage.getItem(this.USER_ACTIVITY_KEY);
    return activities ? JSON.parse(activities) : [];
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}