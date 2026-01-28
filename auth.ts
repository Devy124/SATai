import { Stats, DailyStreak } from '../types';

const USERS_KEY = 'sat_app_users_v1';
const SESSION_KEY = 'sat_app_session_v1';

export const AuthService = {
  getUsers: () => {
    try {
      const users = localStorage.getItem(USERS_KEY);
      return users ? JSON.parse(users) : {};
    } catch (e) {
      return {};
    }
  },

  getCurrentUser: (): string | null => {
    return localStorage.getItem(SESSION_KEY);
  },

  getUserData: (username: string) => {
    const users = AuthService.getUsers();
    return users[username] || null;
  },

  login: (username: string, password: string) => {
    const users = AuthService.getUsers();
    if (users[username] && users[username].password === password) {
      localStorage.setItem(SESSION_KEY, username);
      return { success: true, data: users[username] };
    }
    return { success: false, message: 'Invalid username or password' };
  },

  // When signing up, we can pass current guest stats to save them to the new user
  signup: (username: string, password: string, currentStats: Stats, currentDaily: DailyStreak) => {
    const users = AuthService.getUsers();
    if (users[username]) {
      return { success: false, message: 'Username already exists' };
    }
    
    const newUser = {
      password,
      stats: currentStats,
      daily: currentDaily,
      created: new Date().toISOString()
    };

    users[username] = newUser;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, username);
    return { success: true, data: newUser };
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  updateProgress: (username: string, stats: Stats, daily: DailyStreak) => {
    const users = AuthService.getUsers();
    if (users[username]) {
      users[username].stats = stats;
      users[username].daily = daily;
      users[username].lastActive = new Date().toISOString();
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }
};
