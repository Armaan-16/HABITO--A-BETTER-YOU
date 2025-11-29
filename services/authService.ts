
import { User } from '../types';

const USERS_KEY = 'habito_users_db';
const SESSION_KEY = 'habito_current_session';

// Helper to get all users
const getUsers = (): Record<string, User> => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : {};
};

// Helper to save users
const saveUsers = (users: Record<string, User>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const registerUser = (name: string, phone: string, pass: string): { success: boolean; message?: string; user?: User } => {
  const users = getUsers();
  
  if (users[phone]) {
    return { success: false, message: 'User with this phone number already exists.' };
  }

  const newUser: User = {
    id: phone, // Phone is the unique ID
    name,
    phone,
    password: pass,
    createdAt: new Date().toISOString()
  };

  users[phone] = newUser;
  saveUsers(users);
  
  // Auto login after register
  localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
  
  return { success: true, user: newUser };
};

export const loginUser = (phone: string, pass: string): { success: boolean; message?: string; user?: User } => {
  const users = getUsers();
  const user = users[phone];

  if (!user) {
    return { success: false, message: 'Account not found. Please sign up.' };
  }

  if (user.password !== pass) {
    return { success: false, message: 'Incorrect password.' };
  }

  // Set Session
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return { success: true, user };
};

export const logoutUser = () => {
  localStorage.removeItem(SESSION_KEY);
  // Optional: clear window location to force full refresh if needed, but App state handles it
};

export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
};
