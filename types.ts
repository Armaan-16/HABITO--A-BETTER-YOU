
export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: 'health' | 'productivity' | 'mindfulness' | 'creative';
  frequency: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  history: Record<string, boolean>; // Key: 'YYYY-MM-DD', Value: completed
  streak: number;
}

export interface ScheduleItem {
  id: string;
  hour: number; // 0-23
  activity: string;
  completed: boolean;
  category: 'work' | 'health' | 'rest' | 'focus' | 'other';
}

// Key: 'YYYY-MM-DD', Value: Array of items for that day
export type ScheduleData = Record<string, ScheduleItem[]>;

export interface LifeEvent {
  id: string;
  title: string;
  date: string; // ISO Date string
  color: string;
}

export interface Note {
  id: string;
  content: string;
  isUrgent: boolean;
  createdAt: string;
}

export interface Quote {
  text: string;
  author: string;
}

export interface ChartData {
  name: string;
  value: number;
}

export type VisionCategory = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | '5_YEARS';

export interface VisionItem {
  id: string;
  text: string;
  category: VisionCategory;
  day?: string; // Optional: For Weekly breakdown (e.g., 'Mon', 'Tue')
}

export interface User {
  id: string; // This will be the phone number
  name: string;
  phone: string;
  email?: string;
  password: string; // In a real app, this should be hashed. Here stored as plain text for demo.
  createdAt: string;
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  ANALYTICS = 'ANALYTICS',
  SETTINGS = 'SETTINGS',
}