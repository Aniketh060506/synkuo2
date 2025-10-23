import { createContext, useContext, useState, useEffect } from 'react';

// Unified Task Data Structure
const TaskContext = createContext();

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  // Unified state - single source of truth
  const [tasks, setTasks] = useState([]);
  const [config, setConfig] = useState({
    totalDays: 7,
    hoursPerDay: 8,
    startDate: new Date().toISOString().split('T')[0]
  });

  // Load from localStorage on mount
  useEffect(() => {
    loadTasksFromStorage();
  }, []);

  // Save to localStorage whenever tasks change (but not on initial load)
  useEffect(() => {
    if (tasks.length > 0 || Object.keys(config).length > 0) {
      console.log('🔄 Saving to localStorage...', { tasks: tasks.length, config });
      saveTasksToStorage();
    }
  }, [tasks, config]);

  const loadTasksFromStorage = () => {
    try {
      const storedTasks = localStorage.getItem('unifiedTasks');
      const storedConfig = localStorage.getItem('unifiedConfig');
      
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        setTasks(parsedTasks);
        console.log('📥 Loaded unified tasks:', parsedTasks);
      }
      
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        setConfig(parsedConfig);
        console.log('📥 Loaded unified config:', parsedConfig);
      }
    } catch (error) {
      console.error('Failed to load tasks from storage:', error);
    }
  };

  const saveTasksToStorage = () => {
    try {
      localStorage.setItem('unifiedTasks', JSON.stringify(tasks));
      localStorage.setItem('unifiedConfig', JSON.stringify(config));
      console.log('💾 Saved unified tasks:', tasks.length, 'tasks');
    } catch (error) {
      console.error('Failed to save tasks to storage:', error);
    }
  };

  // Add or update a task
  const updateTask = (taskData) => {
    setTasks(prev => {
      const existingIndex = prev.findIndex(t => t.id === taskData.id);
      if (existingIndex >= 0) {
        // Update existing task
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...taskData };
        console.log('📝 Updated task:', taskData.name);
        return updated;
      } else {
        // Add new task
        const newTask = {
          id: taskData.id || `task-${Date.now()}`,
          name: taskData.name || '',
          hoursNeeded: taskData.hoursNeeded || 0,
          priority: taskData.priority || 'medium',
          tags: taskData.tags || '',
          notes: taskData.notes || '',
          dueDate: taskData.dueDate || '',
          schedule: taskData.schedule || {}, // { "2025-10-22": 3, "2025-10-23": 4 }
          completed: taskData.completed || false,
          createdAt: new Date().toISOString(),
          ...taskData
        };
        console.log('➕ Added new task:', newTask.name);
        return [...prev, newTask];
      }
    });
  };

  // Delete a task
  const deleteTask = (taskId) => {
    setTasks(prev => {
      const filtered = prev.filter(t => t.id !== taskId);
      console.log('🗑️ Deleted task:', taskId);
      return filtered;
    });
  };

  // Update task schedule for a specific date
  const updateTaskSchedule = (taskId, date, hours) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newSchedule = { ...task.schedule };
        if (hours > 0) {
          newSchedule[date] = hours;
        } else {
          delete newSchedule[date];
        }
        console.log(`📅 Updated schedule for ${task.name} on ${date}: ${hours}h`);
        return { ...task, schedule: newSchedule };
      }
      return task;
    }));
  };

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    return tasks.filter(task => task.schedule?.[date] > 0).map(task => ({
      ...task,
      hoursScheduled: task.schedule[date]
    }));
  };

  // Get all scheduled dates
  const getAllScheduledDates = () => {
    const dates = new Set();
    tasks.forEach(task => {
      Object.keys(task.schedule || {}).forEach(date => {
        if (task.schedule[date] > 0) {
          dates.add(date);
        }
      });
    });
    return Array.from(dates).sort();
  };

  // Update config
  const updateConfig = (newConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    console.log('⚙️ Updated config:', newConfig);
  };

  // Get daily totals for capacity checking
  const getDailyTotals = () => {
    const totals = {};
    tasks.forEach(task => {
      Object.entries(task.schedule || {}).forEach(([date, hours]) => {
        totals[date] = (totals[date] || 0) + hours;
      });
    });
    return totals;
  };

  // Mark task as completed for a specific date
  const toggleTaskCompletion = (taskId, date, completed) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const completions = task.completions || {};
        if (completed) {
          completions[date] = new Date().toISOString();
        } else {
          delete completions[date];
        }
        console.log(`✅ Toggled completion for ${task.name} on ${date}:`, completed);
        return { ...task, completions };
      }
      return task;
    }));
  };

  const contextValue = {
    // State
    tasks,
    config,
    
    // Actions
    updateTask,
    deleteTask,
    updateTaskSchedule,
    updateConfig,
    toggleTaskCompletion,
    
    // Getters
    getTasksForDate,
    getAllScheduledDates,
    getDailyTotals,
    
    // Utils
    loadTasksFromStorage,
    saveTasksToStorage
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};
