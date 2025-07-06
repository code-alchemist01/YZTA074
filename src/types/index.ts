export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  grade: string;
  adhdType: 'none' | 'inattentive' | 'hyperactive' | 'combined';
  learningStyle: string[];
  joinDate: string;
  profilePicture?: string;
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