// Notebook System
export interface Notebook {
  id: string;
  name: string;
  createdAt: string;
  isTarget: boolean;
  isFavorite?: boolean;
  lastAccessed?: string;
  color?: string;
  content: string;
  lastModified: string;
  wordCount: number;
  characterCount: number;
}

// Todo System
export interface HourlyTask {
  id: string;
  timeRange: string;
  task: string;
  isComplete: boolean;
  completedAt?: string;
}

export interface DailyPlan {
  day: number;
  weekday: string;
  goal: string;
  tasks: HourlyTask[];
}

export interface MonthlyPlan {
  name: string;
  taskCount: number;
  focus: string;
  days: DailyPlan[];
}

export interface YearPlan {
  year: number;
  months: MonthlyPlan[];
}

// Analytics System
export interface DailyActivity {
  date: string;
  todos: number;
  captures: number;
  notes: number;
}

export interface ActivityLog {
  [date: string]: {
    todosCompleted: number;
    notesCreated: number;
    captures: number;
    wordsWritten: number;
  };
}

export interface AnalyticsData {
  notebookCount: number;
  streak: number;
  storageMb: number;
  storageTotalMb: number;
  webCaptures?: number;
  activity: DailyActivity[];
  today: {
    todos: number;
    captures: number;
    notes: number;
    words: number;
  };
  content: {
    totalWords: number;
    breakdown: { name: string; value: number }[];
  };
  goals: {
    currentStreak: number;
    bestStreak: number;
    monthlyProgress: number;
  };
  storageBreakdown: { name: string; value: number }[];
  weeklyInsights?: {
    mostProductiveDay: string;
    averageTasksPerDay: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface CopyDockData {
  notebooks: Notebook[];
  analytics: AnalyticsData;
  todoSystem: YearPlan[];
  activityLog: ActivityLog;
}
