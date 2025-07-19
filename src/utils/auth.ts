import { User, Ogrenci, OgrenciCreate, ogrenciToUser, userToOgrenci } from '../types';
import { ApiService } from '../services/api';

export class AuthService {
  private static readonly CURRENT_USER_KEY = 'marathon_current_user';
  private static readonly TOKEN_KEY = 'marathon_token';

  static async register(userData: Omit<User, 'id' | 'joinDate'>): Promise<User> {
    try {
      // Hash password (in a real app, you'd use proper hashing)
      const hashedPassword = btoa(userData.email + 'password'); // Simple encoding for demo
      
      // Convert User to OgrenciCreate format
      const userWithDefaults: User = {
        ...userData,
        id: '', // Will be set by backend
        joinDate: new Date().toISOString(),
      };
      
      const ogrenciData: OgrenciCreate = userToOgrenci(userWithDefaults, hashedPassword);
      
      // Debug: Log the data being sent
      console.log('Sending ogrenci data to backend:', ogrenciData);
      
      // Create user in backend
      const createdOgrenci: Ogrenci = await ApiService.createOgrenci(ogrenciData);
      
      // Convert back to User format
      const user = ogrenciToUser(createdOgrenci);
      
      // Store user and token locally
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
      // In a real app, you'd get an actual JWT token from backend
      localStorage.setItem(this.TOKEN_KEY, btoa(user.id + ':' + user.email));
      
      return user;
    } catch (error: any) {
      console.error('Registration error details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Handle duplicate entry errors
      if (error.response?.status === 500 && error.response?.data?.detail?.includes('Duplicate entry')) {
        throw new Error('Bu e-posta adresi zaten kayıtlı');
      }
      
      // Handle validation errors
      if (error.response?.status === 422) {
        const detail = error.response?.data?.detail;
        if (Array.isArray(detail)) {
          const errorMessages = detail.map((err: any) => {
            if (err.msg) return err.msg;
            if (err.message) return err.message;
            return JSON.stringify(err);
          }).join(', ');
          throw new Error('Geçersiz veri: ' + errorMessages);
        } else if (typeof detail === 'string') {
          throw new Error('Geçersiz veri: ' + detail);
        } else if (detail) {
          throw new Error('Geçersiz veri: ' + JSON.stringify(detail));
        }
      }
      
      // Network or connection errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        throw new Error('Sunucuya bağlanılamıyor. Lütfen daha sonra tekrar deneyin.');
      }
      
      // Generic error handling
      let errorMessage = 'Kayıt sırasında beklenmedik bir hata oluştu';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else {
          errorMessage = JSON.stringify(detail);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  static async login(email: string, password: string): Promise<User> {
    try {
      // Use the new login endpoint
      const loginResponse = await ApiService.login(email, password);
      
      // Convert Ogrenci to User format
      const user = ogrenciToUser(loginResponse.user);
      
      // Store user and token locally
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.TOKEN_KEY, loginResponse.token);
      
      return user;
    } catch (error: any) {
      console.error('Login error details:', error);
      console.error('Error response:', error.response);
      
      // Handle specific HTTP status codes
      if (error.response?.status === 401) {
        throw new Error('E-posta veya şifre hatalı');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Kullanıcı bulunamadı');
      }
      
      if (error.response?.status === 422) {
        const detail = error.response?.data?.detail;
        if (Array.isArray(detail)) {
          const errorMessages = detail.map((err: any) => err.msg || err.message || JSON.stringify(err)).join(', ');
          throw new Error('Geçersiz veri: ' + errorMessages);
        } else if (typeof detail === 'string') {
          throw new Error('Geçersiz veri: ' + detail);
        } else if (detail) {
          throw new Error('Geçersiz veri: ' + JSON.stringify(detail));
        }
      }
      
      // Network or connection errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        throw new Error('Sunucuya bağlanılamıyor. Lütfen daha sonra tekrar deneyin.');
      }
      
      // Generic error handling
      let errorMessage = 'Giriş sırasında beklenmedik bir hata oluştu';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else {
          errorMessage = JSON.stringify(detail);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  static logout(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static getCurrentUser(): User | null {
    const userData = localStorage.getItem(this.CURRENT_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static async updateUser(updatedUser: User): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      // Hash password (using the same simple method for consistency)
      const hashedPassword = btoa(updatedUser.email + 'password');
      
      // Convert User to OgrenciCreate format for update
      const ogrenciData: OgrenciCreate = userToOgrenci(updatedUser, hashedPassword);
      
      // Update user in backend
      const updatedOgrenci = await ApiService.updateOgrenci(parseInt(updatedUser.id), ogrenciData);
      
      // Convert back to User format and update local storage
      const user = ogrenciToUser(updatedOgrenci);
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    } catch (error: any) {
      throw new Error('Kullanıcı güncelleme sırasında hata oluştu: ' + (error.response?.data?.detail || error.message || error));
    }
  }

  static async checkBackendConnection(): Promise<boolean> {
    try {
      await ApiService.healthCheck();
      return true;
    } catch (error) {
      console.error('Backend connection failed:', error);
      return false;
    }
  }

  // Helper method to check if user is authenticated
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null && this.getToken() !== null;
  }
}