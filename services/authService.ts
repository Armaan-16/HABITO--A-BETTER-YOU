
import { User } from '../types';
import { migrateUserData } from '../utils/storage';

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

export const registerUser = (name: string, phone: string, pass: string, email?: string): { success: boolean; message?: string; user?: User } => {
  const users = getUsers();
  
  if (users[phone]) {
    return { success: false, message: 'User with this phone number already exists.' };
  }

  const newUser: User = {
    id: phone, // Phone is the unique ID
    name,
    phone,
    email: email || '',
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
};

export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
};

// Updated to handle ID (Phone) changes
export const updateUserProfile = (updatedUser: User, oldId: string): { success: boolean; message?: string } => {
  const users = getUsers();
  
  // Check if ID (Phone) is changing
  if (updatedUser.phone !== oldId) {
      if (users[updatedUser.phone]) {
          return { success: false, message: "This phone number is already registered to another account." };
      }
      
      // 1. Migrate Data
      migrateUserData(oldId, updatedUser.phone);
      
      // 2. Remove old user entry
      delete users[oldId];
      
      // 3. Add new user entry (updatedUser has new id/phone)
      // Ensure the ID matches the phone
      const newUserObj = { ...updatedUser, id: updatedUser.phone };
      users[updatedUser.phone] = newUserObj;
      
      saveUsers(users);
      localStorage.setItem(SESSION_KEY, JSON.stringify(newUserObj));
      return { success: true };
  } else {
      // Just updating details (name, email, password)
      if (users[oldId]) {
          users[oldId] = updatedUser;
          saveUsers(users);
          localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
          return { success: true };
      }
  }
  return { success: false, message: "User not found." };
};