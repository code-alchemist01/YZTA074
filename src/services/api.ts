import axios from 'axios';
import { Ogrenci, OgrenciCreate, Dersler, DerslerCreate, Konular, KonularCreate, SinavSimilasyonlari, SinavSimilasyonlariCreate, Istatistikler, IstatistiklerCreate, OdullerVeBasarimlar, OdullerVeBasarimlarCreate, ChatbotEtkilesim, ChatbotEtkilesimCreate } from '../types';

// API Base URL - backend FastAPI server
const API_BASE_URL = 'http://localhost:8000';

// Login response interface
interface LoginResponse {
  message: string;
  user: Ogrenci;
  token: string;
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authorization token if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token to requests if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service class
export class ApiService {
  // Authentication endpoints
  static async login(email: string, password: string): Promise<LoginResponse> {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    
    const response = await apiClient.post<LoginResponse>('/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }

  // Ogrenci (Student) endpoints
  static async createOgrenci(ogrenciData: OgrenciCreate): Promise<Ogrenci> {
    const response = await apiClient.post<Ogrenci>('/ogrenciler/', ogrenciData);
    return response.data;
  }

  static async getOgrenciler(skip = 0, limit = 10): Promise<Ogrenci[]> {
    const response = await apiClient.get<Ogrenci[]>(`/ogrenciler/?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  static async getOgrenci(ogrenciId: number): Promise<Ogrenci> {
    const response = await apiClient.get<Ogrenci>(`/ogrenciler/${ogrenciId}`);
    return response.data;
  }

  static async updateOgrenci(ogrenciId: number, ogrenciData: OgrenciCreate): Promise<Ogrenci> {
    const response = await apiClient.put<Ogrenci>(`/ogrenciler/${ogrenciId}`, ogrenciData);
    return response.data;
  }

  // Dersler (Lessons) endpoints
  static async createDers(dersData: DerslerCreate): Promise<Dersler> {
    const response = await apiClient.post<Dersler>('/dersler/', dersData);
    return response.data;
  }

  static async getDersler(skip = 0, limit = 10): Promise<Dersler[]> {
    const response = await apiClient.get<Dersler[]>(`/dersler/?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  static async getDers(dersId: number): Promise<Dersler> {
    const response = await apiClient.get<Dersler>(`/dersler/${dersId}`);
    return response.data;
  }

  // Konular (Topics) endpoints
  static async createKonu(konuData: KonularCreate): Promise<Konular> {
    const response = await apiClient.post<Konular>('/konular/', konuData);
    return response.data;
  }

  static async getKonular(skip = 0, limit = 10): Promise<Konular[]> {
    const response = await apiClient.get<Konular[]>(`/konular/?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  static async getKonu(konuId: number): Promise<Konular> {
    const response = await apiClient.get<Konular>(`/konular/${konuId}`);
    return response.data;
  }

  // SinavSimilasyonlari (Exam Simulations) endpoints
  static async createSinav(sinavData: SinavSimilasyonlariCreate): Promise<SinavSimilasyonlari> {
    const response = await apiClient.post<SinavSimilasyonlari>('/sinavlar/', sinavData);
    return response.data;
  }

  static async getSinavlar(skip = 0, limit = 10): Promise<SinavSimilasyonlari[]> {
    const response = await apiClient.get<SinavSimilasyonlari[]>(`/sinavlar/?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  static async getSinav(sinavId: number): Promise<SinavSimilasyonlari> {
    const response = await apiClient.get<SinavSimilasyonlari>(`/sinavlar/${sinavId}`);
    return response.data;
  }

  // Istatistikler (Statistics) endpoints
  static async createIstatistik(istatistikData: IstatistiklerCreate): Promise<Istatistikler> {
    const response = await apiClient.post<Istatistikler>('/istatistikler/', istatistikData);
    return response.data;
  }

  static async getIstatistikler(skip = 0, limit = 10): Promise<Istatistikler[]> {
    const response = await apiClient.get<Istatistikler[]>(`/istatistikler/?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  static async getIstatistik(istatistikId: number): Promise<Istatistikler> {
    const response = await apiClient.get<Istatistikler>(`/istatistikler/${istatistikId}`);
    return response.data;
  }

  // OdullerVeBasarimlar (Achievements) endpoints
  static async createBasarim(basarimData: OdullerVeBasarimlarCreate): Promise<OdullerVeBasarimlar> {
    const response = await apiClient.post<OdullerVeBasarimlar>('/basarimlar/', basarimData);
    return response.data;
  }

  static async getBasarimlar(skip = 0, limit = 10): Promise<OdullerVeBasarimlar[]> {
    const response = await apiClient.get<OdullerVeBasarimlar[]>(`/basarimlar/?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  static async getBasarim(basarimId: number): Promise<OdullerVeBasarimlar> {
    const response = await apiClient.get<OdullerVeBasarimlar>(`/basarimlar/${basarimId}`);
    return response.data;
  }

  // ChatbotEtkilesim (Chatbot Interaction) endpoints
  static async createChatbot(chatbotData: ChatbotEtkilesimCreate): Promise<ChatbotEtkilesim> {
    const response = await apiClient.post<ChatbotEtkilesim>('/chatbot/', chatbotData);
    return response.data;
  }

  static async getChatbotlar(skip = 0, limit = 10): Promise<ChatbotEtkilesim[]> {
    const response = await apiClient.get<ChatbotEtkilesim[]>(`/chatbot/?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  static async getChatbot(chatbotId: number): Promise<ChatbotEtkilesim> {
    const response = await apiClient.get<ChatbotEtkilesim>(`/chatbot/${chatbotId}`);
    return response.data;
  }

  // Utility method to check backend health
  static async healthCheck(): Promise<{ message: string }> {
    try {
      console.log('Attempting to connect to:', API_BASE_URL);
      const response = await apiClient.get<{ message: string }>('/');
      console.log('Backend response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Backend connection error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.status,
        responseData: error.response?.data
      });
      throw new Error('Backend sunucusuna bağlanılamıyor');
    }
  }

  // Debug method to test connection with more detailed info
  static async testConnection(): Promise<void> {
    try {
      console.log('Testing connection to backend...');
      const response = await fetch(API_BASE_URL);
      const data = await response.json();
      console.log('Fetch test successful:', data);
    } catch (error) {
      console.error('Fetch test failed:', error);
    }
  }
}

export default ApiService; 