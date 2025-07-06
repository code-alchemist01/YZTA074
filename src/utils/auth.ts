import { User } from '../types';

export class AuthService {
  private static readonly USERS_KEY = 'marathon_users';
  private static readonly CURRENT_USER_KEY = 'marathon_current_user';

  static register(userData: Omit<User, 'id' | 'joinDate'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...userData,
      id: this.generateId(),
      joinDate: new Date().toISOString(),
    };

    // Check if email already exists
    if (users.some(u => u.email === newUser.email)) {
      throw new Error('Bu e-posta adresi zaten kayıtlı');
    }

    users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    return newUser;
  }

  static login(email: string, password: string): User {
    const users = this.getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // In a real app, you'd verify password hash
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }

  static logout(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  static getCurrentUser(): User | null {
    const userData = localStorage.getItem(this.CURRENT_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  static updateUser(updatedUser: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }
  }

  private static getUsers(): User[] {
    const users = localStorage.getItem(this.USERS_KEY);
    return users ? JSON.parse(users) : [];
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}