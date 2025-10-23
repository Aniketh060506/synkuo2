// Shared storage utility for Task Scheduler and Todo System

const STORAGE_KEYS = {
  SCHEDULED_TASKS: 'scheduledTasks',
  TASK_CONFIG: 'taskConfig',
  LAST_SYNC: 'lastTaskSync'
};

// Save scheduled tasks to localStorage
export const saveScheduledTasks = (tasks, config) => {
  try {
    const data = {
      tasks: tasks,
      config: config, // { totalDays, hoursPerDay, startDate }
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.SCHEDULED_TASKS, JSON.stringify(data));
    console.log('✅ Scheduled tasks saved:', tasks.length, 'tasks');
    return true;
  } catch (error) {
    console.error('Failed to save scheduled tasks:', error);
    return false;
  }
};

// Load scheduled tasks from localStorage
export const loadScheduledTasks = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SCHEDULED_TASKS);
    if (!data) return { tasks: [], config: null };
    
    const parsed = JSON.parse(data);
    console.log('📥 Loaded scheduled tasks:', parsed.tasks.length, 'tasks');
    return parsed;
  } catch (error) {
    console.error('Failed to load scheduled tasks:', error);
    return { tasks: [], config: null };
  }
};

// Convert scheduled tasks to Todo items for a specific date
export const getTasksForDate = (dateStr) => {
  try {
    const { tasks, config } = loadScheduledTasks();
    if (!tasks || !config) {
      console.log('❌ No tasks or config found');
      return [];
    }
    
    console.log('🔍 Checking tasks for date:', dateStr);
    console.log('📦 Tasks loaded:', tasks);
    console.log('⚙️ Config:', config);
    
    // Calculate which day index this date is
    const startDate = new Date(config.startDate || new Date().toISOString().split('T')[0]);
    const targetDate = new Date(dateStr);
    const daysDiff = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24 * 1000));
    
    console.log('📊 Date calculation:', {
      configStartDate: config.startDate,
      startDateParsed: startDate.toISOString().split('T')[0],
      targetDate: dateStr,
      targetDateParsed: targetDate.toISOString().split('T')[0],
      daysDiff,
      timeDiffMs: targetDate - startDate,
      calculation: `(${targetDate.getTime()} - ${startDate.getTime()}) / ${1000 * 60 * 60 * 24 * 1000}`
    });
    
    // Find tasks scheduled for this day
    const todosForDate = [];
    tasks.forEach(task => {
      console.log(`🔍 Checking task ${task.name}, dailySchedule:`, task.dailySchedule);
      const hoursForDay = task.dailySchedule?.[daysDiff];
      if (hoursForDay && hoursForDay > 0) {
        todosForDate.push({
          id: `scheduled-${task.id}-day${daysDiff}`,
          taskId: task.id,
          name: task.name,
          hours: hoursForDay,
          priority: task.priority,
          tags: task.tags || '',
          notes: task.notes || '',
          dueDate: task.dueDate || '',
          source: 'scheduler',
          scheduledDay: daysDiff,
          completed: false
        });
        console.log(`✅ Added task: ${task.name} - ${hoursForDay}h`);
      }
    });
    
    console.log(`📅 Tasks for ${dateStr}:`, todosForDate.length, 'tasks', todosForDate);
    return todosForDate;
  } catch (error) {
    console.error('Failed to get tasks for date:', error);
    return [];
  }
};

// Sync scheduled tasks to Todo System
export const syncToTodoSystem = (todoData) => {
  try {
    console.log('🔄 Starting sync to TodoSystem...');
    console.log('📦 Input todoData:', todoData);
    
    const { tasks, config } = loadScheduledTasks();
    console.log('🗂️ Raw storage data:', { tasks, config });
    
    if (!tasks || tasks.length === 0 || !config) {
      console.log('⚠️ No scheduled tasks to sync');
      return todoData;
    }
    
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today:', today);
    const todayTasks = getTasksForDate(today);
    
    if (todayTasks.length === 0) {
      console.log('⚠️ No tasks scheduled for today');
      console.log('🔍 Debug: Let me check all days...');
      
      // Debug: Check what tasks exist for each day
      for (let i = 0; i < 7; i++) {
        const testDate = new Date();
        testDate.setDate(testDate.getDate() + i);
        const dateStr = testDate.toISOString().split('T')[0];
        const dayTasks = getTasksForDate(dateStr);
        console.log(`Day ${i}: ${dateStr} = ${dayTasks.length} tasks`, dayTasks);
      }
      
      return todoData;
    }
    
    console.log('📋 Tasks to sync:', todayTasks);
    
    // Find or create today's entry in todoData
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const currentDay = new Date().getDate();
    
    console.log('📊 Date info:', { currentYear, currentMonth, currentDay });
    
    let yearData = todoData.find(y => y.year === currentYear);
    if (!yearData) {
      yearData = { year: currentYear, months: [] };
      todoData.push(yearData);
      console.log('✅ Created year data:', currentYear);
    }
    
    let monthData = yearData.months.find(m => m.month === currentMonth);
    if (!monthData) {
      monthData = { month: currentMonth, days: [] };
      yearData.months.push(monthData);
      console.log('✅ Created month data:', currentMonth);
    }
    
    let dayData = monthData.days?.find(d => d.day === currentDay);
    if (!dayData) {
      if (!monthData.days) monthData.days = [];
      dayData = { day: currentDay, hours: [] };
      monthData.days.push(dayData);
      console.log('✅ Created day data:', currentDay);
    }
    
    // Add scheduled tasks to today's hours
    if (!dayData.hours) dayData.hours = [];
    
    todayTasks.forEach(task => {
      // Check if task already exists (by taskId)
      const exists = dayData.hours.some(h => h.taskId === task.taskId || h.id === task.id);
      console.log(`🔍 Task ${task.name} exists check:`, exists);
      console.log(`📋 Current dayData.hours:`, dayData.hours);
      
      // FORCE ADD FOR DEBUGGING - Remove exists check temporarily
      const newHourTask = {
        id: task.id + '-' + Date.now(), // Make unique
        taskId: task.taskId,
        timeRange: `Scheduled: ${task.hours}h`,
        task: task.name, // Use 'task' instead of 'tasks' array for simpler structure
        completed: false,
        source: 'scheduler',
        priority: task.priority,
        tags: task.tags ? task.tags.split(',').map(t => t.trim()) : [],
        notes: task.notes || `${task.hours}h scheduled from Task Scheduler`
      };
      dayData.hours.push(newHourTask);
      console.log('✅ FORCE ADDED task to TodoSystem:', task.name);
    });
    
    console.log('✅ Synced', todayTasks.length, 'tasks to Todo System for today');
    console.log('📦 Final todoData structure:', JSON.stringify(todoData, null, 2));
    
    // Update last sync time
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    
    return todoData;
  } catch (error) {
    console.error('Failed to sync to Todo System:', error);
    return todoData;
  }
};

// Check if sync is needed (date changed)
export const shouldSync = () => {
  try {
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (!lastSync) return true;
    
    const lastSyncDate = new Date(lastSync).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    return lastSyncDate !== today;
  } catch (error) {
    return true;
  }
};

// Get all scheduled tasks with their dates
export const getAllScheduledTasksWithDates = () => {
  try {
    const { tasks, config } = loadScheduledTasks();
    if (!tasks || !config) return [];
    
    const startDate = new Date(config.startDate || new Date().toISOString().split('T')[0]);
    const result = [];
    
    tasks.forEach(task => {
      Object.entries(task.dailySchedule || {}).forEach(([dayIndex, hours]) => {
        const taskDate = new Date(startDate);
        taskDate.setDate(taskDate.getDate() + parseInt(dayIndex));
        
        result.push({
          date: taskDate.toISOString().split('T')[0],
          dayIndex: parseInt(dayIndex),
          task: task,
          hours: hours
        });
      });
    });
    
    return result.sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error('Failed to get scheduled tasks with dates:', error);
    return [];
  }
};

// Clear all scheduled tasks
export const clearScheduledTasks = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.SCHEDULED_TASKS);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
    console.log('🗑️ Cleared all scheduled tasks');
    return true;
  } catch (error) {
    console.error('Failed to clear scheduled tasks:', error);
    return false;
  }
};
