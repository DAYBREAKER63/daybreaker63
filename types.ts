
export enum AppMode {
  NORMAL = 'NORMAL',
  OBSERVATION = 'OBSERVATION',
  CORRECTION = 'CORRECTION'
}

export type ContentType = 'Clean' | 'Reels' | 'Sexual' | 'Mixed';
export type PhoneTime = 'Before 10:15' | '10:15-11' | '11-12' | 'After 12';
export type ScreenUse = 'None' | '<30 min' | '30-60 min' | '60+ min';
export type SleepTime = 'Before 11' | '11-12' | 'After 12';

export type Domain = 'Sleep' | 'Physical' | 'Attention' | 'Control' | 'Order';
export type DietGoal = 'Gain' | 'Lose';

export interface Habit {
  id: string;
  domain: Domain;
  name: string;
}

export interface HabitLog {
  date: string;
  completedHabitIds: string[];
}

export interface DietConfig {
  weight: number;
  height: number;
  age: number;
  goal: DietGoal;
}

export interface CheckIn {
  id: string;
  date: string;
  score: number;
  nightLog: {
    phoneTime: PhoneTime;
    screenUse: ScreenUse;
    contentType: ContentType;
    sleepTime: SleepTime;
    resistedUrge: boolean;
    disciplinedAction: string;
  };
  pillars: {
    discipline: number;
    sexualControl: number;
    physicalOutput: number;
    attentionControl: number;
    socialConduct: number;
  };
  aiFeedback?: {
    observation: string;
    interpretation: string;
    command: string;
  };
}

export interface UserState {
  checkIns: CheckIn[];
  lastCheckInDate: string | null;
  relapseStreak: number;
  habits: Habit[];
  habitLogs: HabitLog[];
  dietConfig?: DietConfig;
  aiModelName?: string;
}
