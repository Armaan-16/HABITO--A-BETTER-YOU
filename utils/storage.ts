
import { Habit, ScheduleData, LifeEvent, VisionItem, Note } from '../types';
import { getCurrentUser } from '../services/authService';

// Base keys
const BASE_KEYS = {
  HABITS: 'habito_habits',
  SCHEDULE: 'habito_schedule',
  EVENTS: 'habito_events',
  VISIONS: 'habito_visions',
  NOTES: 'habito_notes',
};

// Helper to get user-specific key
const getUserKey = (baseKey: string): string => {
  const user = getCurrentUser();
  if (!user) return `guest_${baseKey}`; // Fallback, though app should prevent this
  return `user_${user.id}_${baseKey}`;
};

export const loadHabits = (): Habit[] => {
  const data = localStorage.getItem(getUserKey(BASE_KEYS.HABITS));
  return data ? JSON.parse(data) : [];
};

export const saveHabits = (habits: Habit[]) => {
  localStorage.setItem(getUserKey(BASE_KEYS.HABITS), JSON.stringify(habits));
};

export const loadSchedule = (): ScheduleData => {
  const data = localStorage.getItem(getUserKey(BASE_KEYS.SCHEDULE));
  return data ? JSON.parse(data) : {};
};

export const saveSchedule = (schedule: ScheduleData) => {
  localStorage.setItem(getUserKey(BASE_KEYS.SCHEDULE), JSON.stringify(schedule));
};

export const loadEvents = (): LifeEvent[] => {
  const data = localStorage.getItem(getUserKey(BASE_KEYS.EVENTS));
  return data ? JSON.parse(data) : [];
};

export const saveEvents = (events: LifeEvent[]) => {
  localStorage.setItem(getUserKey(BASE_KEYS.EVENTS), JSON.stringify(events));
};

export const loadVisions = (): VisionItem[] => {
  const data = localStorage.getItem(getUserKey(BASE_KEYS.VISIONS));
  return data ? JSON.parse(data) : [];
};

export const saveVisions = (visions: VisionItem[]) => {
  localStorage.setItem(getUserKey(BASE_KEYS.VISIONS), JSON.stringify(visions));
};

export const loadNotes = (): Note[] => {
  const data = localStorage.getItem(getUserKey(BASE_KEYS.NOTES));
  return data ? JSON.parse(data) : [];
};

export const saveNotes = (notes: Note[]) => {
  localStorage.setItem(getUserKey(BASE_KEYS.NOTES), JSON.stringify(notes));
};

// Helper to get consistent 'YYYY-MM-DD' key in Local Time
export const getLocalDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};