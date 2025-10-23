import { CopyDockData, Notebook, YearPlan, AnalyticsData } from '../types';

const NEW_STORAGE_KEY = 'synkUpData';
const LEGACY_STORAGE_KEY = 'copyDockData';

export const getInitialData = (): CopyDockData => {
  return {
    notebooks: [],
    analytics: {
      notebookCount: 0,
      streak: 0,
      storageMb: 0,
      storageTotalMb: 10,
      webCaptures: 0,
      activity: [],
      today: {
        todos: 0,
        captures: 0,
        notes: 0,
        words: 0,
      },
      content: {
        totalWords: 0,
        breakdown: [],
      },
      goals: {
        currentStreak: 0,
        bestStreak: 0,
        monthlyProgress: 0,
      },
      storageBreakdown: [],
      weeklyInsights: {
        mostProductiveDay: 'N/A',
        averageTasksPerDay: 0,
        trend: 'stable',
      },
    },
    todoSystem: [],
    activityLog: {},
  };
};

export const loadData = (): CopyDockData => {
  try {
    // Prefer new key, fall back to legacy
    const newData = localStorage.getItem(NEW_STORAGE_KEY);
    if (newData) return JSON.parse(newData);
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      // Migrate to new key
      localStorage.setItem(NEW_STORAGE_KEY, legacy);
      return parsed;
    }
    return getInitialData();
  } catch (error) {
    console.error('Error loading data:', error);
    return getInitialData();
  }
};

export const saveData = (data: CopyDockData): void => {
  try {
    localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

export const calculateStorageSize = (data: CopyDockData): number => {
  const jsonString = JSON.stringify(data);
  return new Blob([jsonString]).size / (1024 * 1024);
};

// Calculate todo streak from todo system
const calculateTodoStreak = (todoSystem) => {
  console.log('📊 calculateTodoStreak called with:', todoSystem);
  if (!todoSystem || todoSystem.length === 0) {
    console.log('📊 No todo system data, returning 0');
    return 0;
  }

  // Find the most recent day with completed tasks
  let allDaysWithTasks = [];

  // Collect all days with completed tasks
  todoSystem.forEach(yearData => {
    yearData.months.forEach((monthData, monthIndex) => {
      if (monthData.days && monthData.days.length > 0) {
        monthData.days.forEach(dayData => {
          const hasCompletedTask = dayData?.hours?.some(h => h.completed);
          if (hasCompletedTask) {
            const date = new Date(yearData.year, monthIndex, dayData.day);
            date.setHours(0, 0, 0, 0);
            allDaysWithTasks.push({ date, yearData, monthIndex, dayData });
          }
        });
      }
    });
  });

  console.log('📊 Days with completed tasks:', allDaysWithTasks.map(d => d.date.toDateString()));

  if (allDaysWithTasks.length === 0) {
    console.log('📊 No days with completed tasks');
    return 0;
  }

  // Sort dates in descending order (most recent first)
  allDaysWithTasks.sort((a, b) => b.date - a.date);
  const mostRecentDate = allDaysWithTasks[0].date;

  console.log('📊 Most recent date with tasks:', mostRecentDate.toDateString());

  // Now calculate streak backwards from the most recent date
  let currentStreak = 0;
  let checkDate = new Date(mostRecentDate);

  for (let i = 0; i < 365; i++) {
    const year = checkDate.getFullYear();
    const month = checkDate.getMonth();
    const day = checkDate.getDate();

    const yearData = todoSystem.find(y => y.year === year);
    if (!yearData) {
      if (i > 0) break;
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    const monthData = yearData.months[month];
    if (!monthData || !monthData.days) {
      if (i > 0) break;
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    const dayData = monthData.days.find(d => d.day === day);
    const hasCompletedTask = dayData?.hours?.some(h => h.completed);

    if (hasCompletedTask) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  console.log(`📊 Final streak: ${currentStreak}`);
  return currentStreak;
};

export const calculateAnalytics = (data: CopyDockData): AnalyticsData => {
  const totalWords = data.notebooks.reduce((sum, nb) => sum + nb.wordCount, 0);
  
  const notebookBreakdown = data.notebooks.map(nb => ({
    name: nb.name,
    value: nb.wordCount,
  }));
  
  const storageMb = calculateStorageSize(data);
  const todoStreak = calculateTodoStreak(data.todoSystem);
  
  // Calculate best streak - maintain the highest ever streak
  const previousBestStreak = data.analytics.goals?.bestStreak || 0;
  const bestStreak = Math.max(todoStreak, previousBestStreak);
  
  // Generate 7-day activity data - pass todoSystem and notebooks for real data
  const activityData = generate7DayActivity(data.activityLog || {}, data.todoSystem || [], data.notebooks || []);
  
  // Get today's stats - pass todoSystem for real-time calculation
  const todayStats = getTodayStats(data.activityLog || {}, data.todoSystem);
  
  // Calculate monthly progress
  const monthlyProgress = calculateMonthlyProgress(data.todoSystem);
  
  // Generate weekly insights - pass todoSystem for real-time calculation
  const weeklyInsights = generateWeeklyInsights(data.activityLog || {}, data.todoSystem);
  
  return {
    notebookCount: data.notebooks.length,
    streak: todoStreak,
    storageMb,
    storageTotalMb: 10,
    webCaptures: data.analytics.webCaptures || 0,
    activity: activityData,
    todayStats: {
      todos: todayStats.todos,
      captures: todayStats.captures,
      notes: todayStats.notes,
      words: todayStats.words,
    },
    content: {
      totalWords,
      breakdown: notebookBreakdown,
    },
    goals: {
      currentStreak: todoStreak,
      bestStreak: bestStreak,
      monthlyProgress: monthlyProgress,
    },
    storageBreakdown: [
      { name: 'Notebooks', value: storageMb * 0.9 },
      { name: 'Todos', value: storageMb * 0.1 },
    ],
    weeklyInsights: weeklyInsights,
  };
};

// ============================================
// Activity Tracking Functions
// ============================================

// Track activity for a specific date
export const trackActivity = (data, activityType, value = 1) => {
  const today = new Date().toISOString().split('T')[0];
  
  if (!data.activityLog) {
    data.activityLog = {};
  }
  
  if (!data.activityLog[today]) {
    data.activityLog[today] = {
      todosCompleted: 0,
      notesCreated: 0,
      captures: 0,
      wordsWritten: 0,
    };
  }
  
  switch (activityType) {
    case 'todoCompleted':
      data.activityLog[today].todosCompleted += value;
      console.log(`📊 Tracked ${value} todos completed on ${today}. Total: ${data.activityLog[today].todosCompleted}`);
      break;
    case 'noteCreated':
      data.activityLog[today].notesCreated += value;
      console.log(`📊 Tracked ${value} notes created on ${today}. Total: ${data.activityLog[today].notesCreated}`);
      break;
    case 'capture':
      data.activityLog[today].captures += value;
      console.log(`📊 Tracked ${value} captures on ${today}. Total: ${data.activityLog[today].captures}`);
      break;
    case 'wordsWritten':
      data.activityLog[today].wordsWritten += value;
      console.log(`📊 Tracked ${value} words written on ${today}. Total: ${data.activityLog[today].wordsWritten}`);
      break;
  }
  
  return data;
};

// Generate 7-day activity chart data - calculate from actual data with demo fallback
export const generate7DayActivity = (activityLog, todoSystem = [], notebooks = []) => {
  const result = [];
  const today = new Date();
  
  console.log('📈 generate7DayActivity called with activityLog:', activityLog);
  
  // Demo data pattern for visual appeal (will be replaced by real data)
  const demoPattern = [3, 5, 4, 8, 6, 7, 5]; // Varying heights for visual interest
  
  let hasAnyRealData = false;
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Get data from activityLog
    const dayData = activityLog[dateStr] || {
      todosCompleted: 0,
      notesCreated: 0,
      captures: 0,
    };
    
    // Calculate REAL todos completed for this date from todoSystem
    let todosCompletedCount = 0;
    const targetYear = date.getFullYear();
    const targetMonth = date.getMonth();
    const targetDay = date.getDate();
    
    // Scan todoSystem for completed tasks on this specific date
    for (const year of todoSystem) {
      if (year.year === targetYear && year.months) {
        // Access month directly by index (months is an array where index = month number)
        const monthData = year.months[targetMonth];
        if (monthData && monthData.days) {
          for (const day of monthData.days) {
            if (day.day === targetDay && day.hours) {
              for (const hour of day.hours) {
                if (hour.completed) {
                  todosCompletedCount++;
                }
              }
            }
          }
        }
      }
    }
    
    // Count notebooks created on this date
    let notesCreatedCount = 0;
    for (const notebook of notebooks) {
      const notebookDate = notebook.createdAt ? new Date(notebook.createdAt).toISOString().split('T')[0] : null;
      if (notebookDate === dateStr) {
        notesCreatedCount++;
      }
    }
    
    // Check if we have any real data
    const hasDayData = todosCompletedCount > 0 || notesCreatedCount > 0 || dayData.todosCompleted > 0 || dayData.notesCreated > 0 || dayData.captures > 0;
    if (hasDayData) {
      hasAnyRealData = true;
    }
    
    const dayResult = {
      date: dateStr,
      todos: todosCompletedCount > 0 ? todosCompletedCount : (dayData.todosCompleted || 0),
      captures: dayData.captures || 0,
      notes: notesCreatedCount > 0 ? notesCreatedCount : (dayData.notesCreated || 0),
    };
    
    console.log(`📅 ${dateStr}: todos=${dayResult.todos}, captures=${dayResult.captures}, notes=${dayResult.notes}, hasData=${hasDayData}`);
    
    result.push(dayResult);
  }
  
  // If no real data exists, show demo data for visual appeal
  if (!hasAnyRealData) {
    console.log('⚠️ No real data found, using demo pattern');
    return result.map((item, index) => ({
      date: item.date,
      todos: demoPattern[index] || 5,
      notes: Math.max(1, demoPattern[index] - 2),
      captures: Math.max(1, Math.floor(demoPattern[index] / 2)),
    }));
  }
  
  console.log('✅ Returning real activity data:', result);
  return result;
};

// Get today's statistics - calculate directly from todo system and activity log
export const getTodayStats = (activityLog, todoSystem) => {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  
  // Calculate actual completed todos for today from todo system
  let todosCompleted = 0;
  
  if (todoSystem && todoSystem.length > 0) {
    const yearData = todoSystem.find(y => y.year === todayYear);
    if (yearData && yearData.months[todayMonth]) {
      const monthData = yearData.months[todayMonth];
      if (monthData.days) {
        const dayData = monthData.days.find(d => d.day === todayDay);
        if (dayData && dayData.hours) {
          todosCompleted = dayData.hours.filter(h => h.completed).length;
        }
      }
    }
  }
  
  // Get other stats from activity log
  const todayStr = today.toISOString().split('T')[0];
  const todayData = activityLog[todayStr] || {
    notesCreated: 0,
    captures: 0,
    wordsWritten: 0,
  };
  
  return {
    todos: todosCompleted,
    captures: todayData.captures || 0,
    notes: todayData.notesCreated || 0,
    words: todayData.wordsWritten || 0,
  };
};

// Calculate monthly progress
export const calculateMonthlyProgress = (todoSystem) => {
  if (!todoSystem || todoSystem.length === 0) return 0;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  const yearData = todoSystem.find(y => y.year === currentYear);
  if (!yearData || !yearData.months[currentMonth]) return 0;
  
  const monthData = yearData.months[currentMonth];
  if (!monthData.days || monthData.days.length === 0) return 0;
  
  let totalTasks = 0;
  let completedTasks = 0;
  
  monthData.days.forEach(day => {
    if (day.hours) {
      day.hours.forEach(hour => {
        totalTasks++;
        if (hour.completed) {
          completedTasks++;
        }
      });
    }
  });
  
  return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
};

// Generate weekly insights - calculate directly from todo system
export const generateWeeklyInsights = (activityLog, todoSystem) => {
  const last7Days = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Calculate actual completed todos for this day from todo system
    let completedTodos = 0;
    if (todoSystem && todoSystem.length > 0) {
      const yearData = todoSystem.find(y => y.year === date.getFullYear());
      if (yearData && yearData.months[date.getMonth()]) {
        const monthData = yearData.months[date.getMonth()];
        if (monthData.days) {
          const dayData = monthData.days.find(d => d.day === date.getDate());
          if (dayData && dayData.hours) {
            completedTodos = dayData.hours.filter(h => h.completed).length;
          }
        }
      }
    }
    
    last7Days.push({
      date: dateStr,
      dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
      totalTasks: completedTodos,
    });
  }
  
  // Calculate total tasks across the week
  const totalTasks = last7Days.reduce((sum, day) => sum + day.totalTasks, 0);
  
  // If no tasks at all, return N/A
  if (totalTasks === 0) {
    return {
      mostProductiveDay: 'N/A',
      averageTasksPerDay: 0,
      trend: 'Stable',
    };
  }
  
  // Find most productive day (only among days with tasks)
  const mostProductive = last7Days.reduce((max, day) => 
    day.totalTasks > max.totalTasks ? day : max, 
    last7Days[0]
  );
  
  // Calculate average
  const averageTasksPerDay = Math.round(totalTasks / 7);
  
  // Determine trend (compare first 3 days vs last 3 days)
  const firstHalf = last7Days.slice(0, 3).reduce((sum, day) => sum + day.totalTasks, 0) / 3;
  const secondHalf = last7Days.slice(4, 7).reduce((sum, day) => sum + day.totalTasks, 0) / 3;
  
  let trend = 'Stable';
  if (secondHalf > firstHalf * 1.2) trend = 'Increasing';
  else if (secondHalf < firstHalf * 0.8) trend = 'Decreasing';
  
  return {
    mostProductiveDay: mostProductive.dayName,
    averageTasksPerDay,
    trend,
  };
};

// Get recent notebooks (sorted by last accessed)
export const getRecentNotebooks = (notebooks, limit = 5) => {
  return notebooks
    .filter(nb => nb.lastAccessed)
    .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))
    .slice(0, limit);
};

// Get favorite notebooks
export const getFavoriteNotebooks = (notebooks) => {
  return notebooks
    .filter(nb => nb.isFavorite)
    .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
};
