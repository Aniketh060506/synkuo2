import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, ChevronRight, Calendar, Check, Flame, X } from 'lucide-react';
import SmartTimeInput from './SmartTimeInput';

export default function TodoSystem({ todoData, onUpdateTodos, onBack }) {
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentDay = new Date().getDate();
  const years = todoData.length > 0 ? todoData : [];
  
  // Get initial year without side effects
  const getInitialYear = () => {
    let yearData = years.find(y => y.year === currentYear);
    if (!yearData) {
      yearData = {
        year: currentYear,
        months: Array.from({ length: 12 }, (_, i) => ({
          name: new Date(currentYear, i).toLocaleString('default', { month: 'long' }),
          taskCount: 0,
          focus: '',
          index: i,
          days: [],
        })),
      };
    }
    return yearData;
  };

  const [currentView, setCurrentView] = useState('month');
  const [selectedYear, setSelectedYear] = useState(getInitialYear());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [newTaskStartTime, setNewTaskStartTime] = useState('');
  const [newTaskEndTime, setNewTaskEndTime] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [streak, setStreak] = useState(0);
  const [showQuickJump, setShowQuickJump] = useState(false);
  
  // Refs for auto-scrolling
  const currentMonthRef = useRef(null);
  const currentDayRef = useRef(null);

  // Auto-reload scheduled tasks when localStorage changes
  useEffect(() => {
    if (!selectedDay || currentView !== 'hour') return;
    
    const dayDate = `${selectedYear.year}-${String(selectedMonth.index + 1).padStart(2, '0')}-${String(selectedDay.day).padStart(2, '0')}`;
    
    const reloadScheduledTasks = () => {
      try {
        const unifiedTasks = localStorage.getItem('unifiedTasks');
        if (!unifiedTasks) return;
        
        const allTasks = JSON.parse(unifiedTasks);
        const scheduledTasksForDay = allTasks.filter(task => 
          task.schedule && task.schedule[dayDate] > 0
        ).map(task => ({
          id: `scheduled-${task.id}`,
          taskId: task.id,
          timeRange: `Scheduled: ${task.schedule[dayDate]}h`,
          task: `${task.name} (${task.priority} priority)`,
          completed: task.completions?.[dayDate] || false,
          source: 'scheduler',
          priority: task.priority
        }));

        // Get current hours from state
        setSelectedDay(prevDay => {
          if (!prevDay) return prevDay; // Safety check
          
          const existingHours = (prevDay.hours || []).filter(h => h.source !== 'scheduler');
          const combinedHours = [...existingHours, ...scheduledTasksForDay];
          
          // Only update if different
          if (JSON.stringify(prevDay.hours) !== JSON.stringify(combinedHours)) {
            return { ...prevDay, hours: combinedHours };
          }
          return prevDay;
        });
      } catch (error) {
        console.error('Error reloading scheduled tasks:', error);
      }
    };

    // Initial load
    reloadScheduledTasks();
    
    // Listen for custom taskToggled event from sidebar
    const handleTaskToggled = (e) => {
      console.log('📡 Received taskToggled event from sidebar', e.detail);
      reloadScheduledTasks(); // Immediate reload
    };
    
    window.addEventListener('taskToggled', handleTaskToggled);
    
    return () => {
      window.removeEventListener('taskToggled', handleTaskToggled);
    };
  }, [selectedYear?.year, selectedMonth?.index, currentView, selectedDay?.day]); // Add specific properties instead of whole objects

  // Initialize year data if it doesn't exist
  useEffect(() => {
    const yearExists = years.find(y => y.year === currentYear);
    if (!yearExists) {
      const yearData = {
        year: currentYear,
        months: Array.from({ length: 12 }, (_, i) => ({
          name: new Date(currentYear, i).toLocaleString('default', { month: 'long' }),
          taskCount: 0,
          focus: '',
          index: i,
          days: [],
        })),
      };
      onUpdateTodos([...todoData, yearData]);
    }
  }, []);

  // Read scheduled tasks from localStorage directly
  const [scheduledTasks, setScheduledTasks] = useState([]);

  const calculateGlobalStreak = () => {
    console.log('🔥 Calculating streak');
    console.log('🔥 TodoData:', todoData);

    if (!todoData || todoData.length === 0) {
      console.log('🔥 No todo data');
      setStreak(0);
      return;
    }

    // Find the most recent day with completed tasks
    let mostRecentDate = null;
    let allDaysWithTasks = [];

    // Collect all days with completed tasks
    todoData.forEach(yearData => {
      yearData.months.forEach((monthData, monthIndex) => {
        if (monthData.days && monthData.days.length > 0) {
          monthData.days.forEach(dayData => {
            const hasCompletedTask = dayData?.hours?.some(h => h.completed);
            if (hasCompletedTask) {
              const date = new Date(yearData.year, monthIndex, dayData.day);
              date.setHours(0, 0, 0, 0);
              allDaysWithTasks.push(date);
            }
          });
        }
      });
    });

    console.log('🔥 Days with completed tasks:', allDaysWithTasks.map(d => d.toDateString()));

    if (allDaysWithTasks.length === 0) {
      console.log('🔥 No days with completed tasks');
      setStreak(0);
      return;
    }

    // Sort dates in descending order (newest first)
    allDaysWithTasks.sort((a, b) => b - a);
    mostRecentDate = allDaysWithTasks[0];

    console.log('🔥 Most recent date with tasks:', mostRecentDate.toDateString());

    // Now calculate streak backwards from the most recent date
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from today and work backwards
    let checkDate = new Date(today);
    
    while (checkDate >= mostRecentDate) {
      const hasTasksOnDate = allDaysWithTasks.some(d => d.getTime() === checkDate.getTime());
      
      if (hasTasksOnDate) {
        currentStreak++;
        console.log(`🔥 Found tasks on ${checkDate.toDateString()}, streak: ${currentStreak}`);
      } else {
        console.log(`🔥 No tasks on ${checkDate.toDateString()}, breaking streak`);
        break;
      }
      
      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
    }

    console.log('🔥 Final streak:', currentStreak);
    setStreak(currentStreak);
  };

  // Calculate global streak based on all years and months
  useEffect(() => {
    calculateGlobalStreak();
  }, [todoData]);
  
  useEffect(() => {
    // Load scheduled tasks from localStorage
    const loadScheduledTasks = () => {
      try {
        const unifiedTasks = localStorage.getItem('unifiedTasks');
        if (unifiedTasks) {
          const tasks = JSON.parse(unifiedTasks);
          setScheduledTasks(tasks);
          console.log('📥 Loaded scheduled tasks from localStorage:', tasks.length);
        }
      } catch (error) {
        console.error('Failed to load scheduled tasks:', error);
      }
    };
    
    loadScheduledTasks();
    
    // Listen for storage changes (when TaskScheduler updates)
    const handleStorageChange = (e) => {
      if (e.key === 'unifiedTasks') {
        loadScheduledTasks();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Get scheduled tasks for a specific date
  const getScheduledTasksForDate = (dateString) => {
    return scheduledTasks.filter(task => {
      return task.schedule && task.schedule[dateString] > 0;
    }).map(task => ({
      ...task,
      hoursScheduled: task.schedule[dateString]
    }));
  };

  // Calculate total scheduled hours for month view
  const getMonthScheduledTaskCount = (year, monthIndex) => {
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0);
    let totalTasks = 0;
    
    for (let day = 1; day <= endDate.getDate(); day++) {
      const dateString = new Date(year, monthIndex, day).toISOString().split('T')[0];
      const dayTasks = getScheduledTasksForDate(dateString);
      totalTasks += dayTasks.length;
    }
    
    return totalTasks;
  };

  // Auto-scroll to current month when in month view
  useEffect(() => {
    if (currentView === 'month' && currentMonthRef.current) {
      setTimeout(() => {
        currentMonthRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [currentView, selectedYear]);

  // Auto-scroll to current day when in day view
  useEffect(() => {
    if (currentView === 'day' && currentDayRef.current && selectedYear.year === currentYear && selectedMonth?.index === currentMonth) {
      setTimeout(() => {
        currentDayRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 200);
    }
  }, [currentView, selectedMonth]);


  // Quick Jump to any day (offset from today)
  const jumpToDay = (daysOffset = 0) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysOffset);
    
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();

    let yearData = years.find(y => y.year === year);
    if (!yearData) {
      yearData = {
        year,
        months: Array.from({ length: 12 }, (_, i) => ({
          name: new Date(year, i).toLocaleString('default', { month: 'long' }),
          taskCount: 0,
          focus: '',
          index: i,
          days: [],
        })),
      };
      onUpdateTodos([...years, yearData]);
    }

    setSelectedYear(yearData);
    setSelectedMonth(yearData.months[month]);
    
    // Get scheduled tasks for this day
    const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    let scheduledTasksForDay = [];
    try {
      const unifiedTasks = localStorage.getItem('unifiedTasks');
      if (unifiedTasks) {
        const allTasks = JSON.parse(unifiedTasks);
        scheduledTasksForDay = allTasks.filter(task => 
          task.schedule && task.schedule[dayDateStr] > 0
        ).map(task => ({
          ...task,
          hoursScheduled: task.schedule[dayDateStr]
        }));
      }
    } catch (error) {
      console.error('Error loading scheduled tasks:', error);
    }
    
    const existingDay = yearData.months[month].days?.find(d => d.day === day);
    const existingHours = existingDay?.hours || [];
    const scheduledHours = scheduledTasksForDay.map(task => ({
      id: `scheduled-${task.id}`,
      taskId: task.id,
      timeRange: `Scheduled: ${task.hoursScheduled}h`,
      task: `${task.name} (${task.priority} priority)`,
      completed: task.completions?.[dayDateStr] || false,
      source: 'scheduler',
      priority: task.priority
    }));
    
    const filteredExisting = existingHours.filter(h => h.source !== 'scheduler');
    const combinedHours = [...filteredExisting, ...scheduledHours];
    
    setSelectedDay({
      day,
      weekday: targetDate.toLocaleDateString('en-US', { weekday: 'long' }),
      hours: combinedHours,
      goal: existingDay?.goal || ''
    });
    
    setCurrentView('hour');
    setShowQuickJump(false);
  };

  const jumpToToday = () => jumpToDay(0);

  // Navigate between years - create year if it doesn't exist
  const navigateYear = (direction) => {
    const targetYear = direction === 'prev' ? selectedYear.year - 1 : selectedYear.year + 1;
    
    let yearData = years.find(y => y.year === targetYear);
    
    if (!yearData) {
      // Create the year if it doesn't exist
      yearData = {
        year: targetYear,
        months: Array.from({ length: 12 }, (_, i) => ({
          name: new Date(targetYear, i).toLocaleString('default', { month: 'long' }),
          taskCount: 0,
          focus: '',
          index: i,
          days: [],
        })),
      };
      onUpdateTodos([...todoData, yearData]);
    }
    
    setSelectedYear(yearData);
  };

  // Navigate between months
  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (selectedMonth.index > 0) {
        setSelectedMonth({ ...selectedYear.months[selectedMonth.index - 1], index: selectedMonth.index - 1 });
      } else {
        // Go to previous year's December
        const prevYearIndex = years.findIndex(y => y.year === selectedYear.year) - 1;
        if (prevYearIndex >= 0) {
          setSelectedYear(years[prevYearIndex]);
          setSelectedMonth({ ...years[prevYearIndex].months[11], index: 11 });
        }
      }
    } else {
      if (selectedMonth.index < 11) {
        setSelectedMonth({ ...selectedYear.months[selectedMonth.index + 1], index: selectedMonth.index + 1 });
      } else {
        // Go to next year's January
        const nextYearIndex = years.findIndex(y => y.year === selectedYear.year) + 1;
        if (nextYearIndex < years.length) {
          setSelectedYear(years[nextYearIndex]);
          setSelectedMonth({ ...years[nextYearIndex].months[0], index: 0 });
        }
      }
    }
  };

  // Navigate between days
  const navigateDay = (direction) => {
    const daysInMonth = new Date(selectedYear.year, selectedMonth.index + 1, 0).getDate();
    
    if (direction === 'prev') {
      if (selectedDay.day > 1) {
        const newDay = selectedDay.day - 1;
        const existingDay = selectedMonth.days?.find(d => d.day === newDay);
        setSelectedDay({
          day: newDay,
          weekday: new Date(selectedYear.year, selectedMonth.index, newDay).toLocaleDateString('en-US', { weekday: 'long' }),
          hours: existingDay?.hours || [],
          goal: existingDay?.goal || ''
        });
      }
    } else {
      if (selectedDay.day < daysInMonth) {
        const newDay = selectedDay.day + 1;
        const existingDay = selectedMonth.days?.find(d => d.day === newDay);
        setSelectedDay({
          day: newDay,
          weekday: new Date(selectedYear.year, selectedMonth.index, newDay).toLocaleDateString('en-US', { weekday: 'long' }),
          hours: existingDay?.hours || [],
          goal: existingDay?.goal || ''
        });
      }
    }
  };

  const handleCreateYear = () => {
    const newYear = {
      year: currentYear,
      months: Array.from({ length: 12 }, (_, i) => ({
        name: new Date(currentYear, i).toLocaleString('default', { month: 'long' }),
        taskCount: 0,
        focus: '',
        days: [],
      })),
    };
    onUpdateTodos([...todoData, newYear]);
  };

  const renderYearView = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* Streak Display - Top of All Views */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1E] rounded-lg border border-[rgba(255,255,255,0.1)]">
            <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-500' : 'text-gray-600'}`} />
            <span className={`font-bold text-lg ${streak > 0 ? 'text-orange-500' : 'text-gray-600'}`}>{streak}</span>
            <span className="text-gray-400 text-sm">Day Streak</span>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowQuickJump(!showQuickJump)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1E] rounded-lg hover:bg-[#262626] transition-all border border-[rgba(255,255,255,0.1)]"
          >
            <Calendar className="w-4 h-4 text-white" />
            <span className="text-white text-sm">Quick Jump</span>
          </button>
          {showQuickJump && (
            <div className="absolute right-0 mt-2 w-56 bg-[#1C1C1E] rounded-lg border border-[rgba(255,255,255,0.1)] shadow-lg z-50">
              <button onClick={() => jumpToDay(-2)} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 rounded-t-lg border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-sm">⏪ Day Before Yesterday</span>
              </button>
              <button onClick={() => jumpToDay(-1)} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-sm">⬅️ Yesterday</span>
              </button>
              <button onClick={jumpToToday} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)]">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">📅 Today</span>
              </button>
              <button onClick={() => jumpToDay(1)} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-sm">➡️ Tomorrow</span>
              </button>
              <button onClick={() => jumpToDay(2)} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 rounded-b-lg">
                <span className="text-sm">⏩ Day After Tomorrow</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Your Planning Years</h2>
        <button
          onClick={handleCreateYear}
          className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full hover:scale-105 transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Year
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {years.map((yearPlan, idx) => (
          <div
            key={yearPlan.year}
            onClick={() => {
              setSelectedYear(yearPlan);
              setCurrentView('month');
            }}
            style={{ animationDelay: `${idx * 0.1}s` }}
            className="bg-[#1C1C1E] rounded-3xl p-6 border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] hover:scale-105 transition-all cursor-pointer animate-slideUp"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-2xl">{yearPlan.year}</h3>
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <p className="text-gray-400 text-sm">12 months planned</p>
          </div>
        ))}
      </div>
      {years.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
          <Calendar className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-white text-xl font-semibold mb-2">No planning years yet</h3>
          <p className="text-gray-400 text-center mb-6">Create your first year to start planning</p>
          <button
            onClick={handleCreateYear}
            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full hover:scale-105 transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Year
          </button>
        </div>
      )}
    </div>
  );

  const updateMonthFocus = (monthIndex, focus) => {
    const updatedYears = years.map(y => 
      y.year === selectedYear.year 
        ? {
            ...y,
            months: y.months.map((m, idx) => 
              idx === monthIndex ? { ...m, focus, index: idx } : m
            )
          }
        : y
    );
    onUpdateTodos(updatedYears);
    setSelectedYear(updatedYears.find(y => y.year === selectedYear.year));
  };

  const renderMonthView = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* Streak Display - Top */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1E] rounded-lg border border-[rgba(255,255,255,0.1)]">
            <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-500' : 'text-gray-600'}`} />
            <span className={`font-bold text-lg ${streak > 0 ? 'text-orange-500' : 'text-gray-600'}`}>{streak}</span>
            <span className="text-gray-400 text-sm">Day Streak</span>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowQuickJump(!showQuickJump)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1E] rounded-lg hover:bg-[#262626] transition-all border border-[rgba(255,255,255,0.1)]"
          >
            <Calendar className="w-4 h-4 text-white" />
            <span className="text-white text-sm">Quick Jump</span>
          </button>
          {showQuickJump && (
            <div className="absolute right-0 mt-2 w-56 bg-[#1C1C1E] rounded-lg border border-[rgba(255,255,255,0.1)] shadow-lg z-50">
              <button onClick={() => jumpToDay(-2)} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 rounded-t-lg border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-sm">⏪ Day Before Yesterday</span>
              </button>
              <button onClick={() => jumpToDay(-1)} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-sm">⬅️ Yesterday</span>
              </button>
              <button onClick={jumpToToday} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)]">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">📅 Today</span>
              </button>
              <button onClick={() => jumpToDay(1)} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-sm">➡️ Tomorrow</span>
              </button>
              <button onClick={() => jumpToDay(2)} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 rounded-b-lg">
                <span className="text-sm">⏩ Day After Tomorrow</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-blue-400 text-xl font-bold">{selectedYear?.year}</h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigateYear('prev')}
            className="p-2 hover:bg-[#1C1C1E] rounded-lg transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button 
            onClick={() => navigateYear('next')}
            className="p-2 hover:bg-[#1C1C1E] rounded-lg transition-all"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">{selectedYear?.year} - Monthly Overview</h1>
        
        {/* Month/Day Tabs */}
        <div className="flex justify-center gap-2">
          <button
            className="px-6 py-2 bg-white text-black rounded-lg font-medium shadow-md"
          >
            📅 Month
          </button>
          <button
            onClick={() => {
              // Go to current month's day view
              const currentMonthData = selectedYear.months[currentMonth];
              setSelectedMonth({ ...currentMonthData, index: currentMonth });
              setCurrentView('day');
            }}
            className="px-6 py-2 bg-[#1C1C1E] text-white rounded-lg hover:bg-[#262626] transition-all border border-[rgba(255,255,255,0.1)]"
          >
            📆 Day
          </button>
        </div>
      </div>

      <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.1)]">
        <table className="w-full">
          <thead className="bg-[#2C2C2E]">
            <tr>
              <th className="text-left text-gray-400 font-medium text-sm px-6 py-4">Month</th>
              <th className="text-left text-gray-400 font-medium text-sm px-6 py-4">What I Will Focus On</th>
              <th className="text-right text-gray-400 font-medium text-sm px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {selectedYear?.months.map((month, idx) => (
              <tr 
                key={idx}
                ref={idx === currentMonth ? currentMonthRef : null}
                className="border-t border-[rgba(255,255,255,0.05)] hover:bg-[#262626] transition-all"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <td className="px-6 py-5">
                  <div>
                    <div className="text-white font-semibold text-base">{month.name}</div>
                    <div className="text-gray-500 text-sm">
                      {((month.taskCount || 0) + getMonthScheduledTaskCount(selectedYear.year, idx))} tasks
                      {getMonthScheduledTaskCount(selectedYear.year, idx) > 0 && (
                        <span className="text-blue-400 ml-1">
                          ({getMonthScheduledTaskCount(selectedYear.year, idx)} scheduled)
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <input
                    type="text"
                    value={month.focus || ''}
                    onChange={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      updateMonthFocus(idx, e.target.value);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    placeholder={`Enter ${month.name} goals...`}
                    className="w-full bg-transparent text-gray-400 placeholder-gray-600 focus:outline-none focus:text-white transition-all"
                  />
                </td>
                <td className="px-6 py-5 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMonth({ ...month, index: idx });
                      setCurrentView('day');
                    }}
                    className="px-6 py-2 bg-white text-black rounded-full hover:scale-105 transition-all font-medium text-sm"
                  >
                    Open Month
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Check if all hours are completed for a day
  const isDayComplete = (dayData) => {
    if (!dayData || !dayData.hours || dayData.hours.length === 0) return false;
    return dayData.hours.every(h => h.completed);
  };


  const renderDayView = () => {
    const daysInMonth = new Date(selectedYear.year, selectedMonth.index + 1, 0).getDate();
    const days = selectedMonth.days || [];

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Streak Display - Top */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1E] rounded-lg border border-[rgba(255,255,255,0.1)]">
              <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-500' : 'text-gray-600'}`} />
              <span className={`font-bold text-lg ${streak > 0 ? 'text-orange-500' : 'text-gray-600'}`}>{streak}</span>
              <span className="text-gray-400 text-sm">Day Streak</span>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowQuickJump(!showQuickJump)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1E] rounded-lg hover:bg-[#262626] transition-all border border-[rgba(255,255,255,0.1)]"
            >
              <Calendar className="w-4 h-4 text-white" />
              <span className="text-white text-sm">Quick Jump</span>
            </button>
            {showQuickJump && (
              <div className="absolute right-0 mt-2 w-56 bg-[#1C1C1E] rounded-lg border border-[rgba(255,255,255,0.1)] shadow-lg z-50">
                <button onClick={() => jumpToDay(-2)} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 rounded-t-lg border-b border-[rgba(255,255,255,0.05)]">
                  <span className="text-sm">⏪ Day Before Yesterday</span>
                </button>
                <button onClick={() => jumpToDay(-1)} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)]">
                  <span className="text-sm">⬅️ Yesterday</span>
                </button>
                <button onClick={jumpToToday} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)]">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">📅 Today</span>
                </button>
                <button onClick={() => jumpToDay(1)} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)]">
                  <span className="text-sm">➡️ Tomorrow</span>
                </button>
                <button onClick={() => jumpToDay(2)} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 rounded-b-lg">
                  <span className="text-sm">⏩ Day After Tomorrow</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-blue-400 text-xl font-bold">{selectedMonth.name}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-[#1C1C1E] rounded-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button 
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-[#1C1C1E] rounded-lg transition-all"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">{selectedMonth.name} {selectedYear.year} - Daily Schedule</h1>
          
          {/* Month/Day Tabs */}
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setCurrentView('month')}
              className="px-6 py-2 bg-[#1C1C1E] text-white rounded-lg hover:bg-[#262626] transition-all border border-[rgba(255,255,255,0.1)]"
            >
              📅 Month
            </button>
            <button
              className="px-6 py-2 bg-white text-black rounded-lg font-medium shadow-md"
            >
              📆 Day
            </button>
          </div>
        </div>

        <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.1)]">
          <table className="w-full">
            <thead className="bg-[#2C2C2E]">
              <tr>
                <th className="text-center text-gray-400 font-medium text-sm px-4 py-4 w-12">✓</th>
                <th className="text-left text-gray-400 font-medium text-sm px-6 py-4 w-32">Date</th>
                <th className="text-left text-gray-400 font-medium text-sm px-6 py-4">What I Will Do</th>
                <th className="text-right text-gray-400 font-medium text-sm px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const dayData = days.find((d) => d.day === dayNum);
                const weekday = new Date(selectedYear.year, selectedMonth.index, dayNum).toLocaleDateString(
                  'en-US',
                  { weekday: 'short' }
                );
                const isComplete = isDayComplete(dayData);
                
                // Check if there are scheduled tasks for this day
                const dayDateStr = `${selectedYear.year}-${String(selectedMonth.index + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const scheduledTasksCount = scheduledTasks.filter(task => 
                  task.schedule && task.schedule[dayDateStr] > 0
                ).length;

                return (
                  <tr 
                    key={dayNum}
                    ref={dayNum === currentDay ? currentDayRef : null}
                    className={`border-t border-[rgba(255,255,255,0.05)] hover:bg-[#262626] transition-all ${
                      scheduledTasksCount > 0 ? 'bg-blue-500/10 border-l-4 border-l-blue-500' : ''
                    }`}
                    style={{ animationDelay: `${i * 0.02}s` }}
                  >
                    <td className="px-4 py-5 text-center">
                      <input
                        type="checkbox"
                        checked={isComplete}
                        readOnly
                        className="w-5 h-5 rounded-full cursor-not-allowed"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <div className="text-white font-bold text-lg">{dayNum}</div>
                        <div className="text-gray-500 text-xs">{weekday}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {scheduledTasksCount > 0 && !dayData?.goal && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-blue-400 text-sm font-semibold">📅 {scheduledTasksCount} Scheduled</span>
                        </div>
                      )}
                      <input
                        type="text"
                        value={dayData?.goal || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          updateDayGoal(dayNum, e.target.value);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        placeholder={`Day ${dayNum} tasks...`}
                        className={`w-full bg-transparent focus:outline-none focus:text-white transition-all ${
                          scheduledTasksCount > 0 ? 'text-blue-300 placeholder-blue-400/60' : 'text-gray-400 placeholder-gray-600'
                        }`}
                      />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const existingDay = days.find(d => d.day === dayNum);
                          
                          // Get scheduled tasks for this specific day - READ DIRECTLY FROM LOCALSTORAGE
                          // IMPORTANT: Create date in UTC to avoid timezone issues
                          const dayDate = `${selectedYear.year}-${String(selectedMonth.index + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                          console.log('🔍 Getting scheduled tasks for:', dayDate);
                          console.log('🔍 Day clicked:', dayNum, 'Month:', selectedMonth.index, 'Year:', selectedYear.year);
                          
                          // Read directly from localStorage instead of using state
                          let scheduledTasksForDay = [];
                          try {
                            const unifiedTasks = localStorage.getItem('unifiedTasks');
                            if (unifiedTasks) {
                              const allTasks = JSON.parse(unifiedTasks);
                              console.log('🔍 Tasks from localStorage:', allTasks);
                              scheduledTasksForDay = allTasks.filter(task => {
                                return task.schedule && task.schedule[dayDate] > 0;
                              }).map(task => ({
                                ...task,
                                hoursScheduled: task.schedule[dayDate]
                              }));
                              console.log('🔍 Tasks found for this day:', scheduledTasksForDay);
                            }
                          } catch (error) {
                            console.error('Error loading scheduled tasks:', error);
                          }
                          
                          // Combine existing hours with scheduled tasks
                          const existingHours = existingDay?.hours || [];
                          const scheduledHours = scheduledTasksForDay.map(task => ({
                            id: `scheduled-${task.id}`,
                            taskId: task.id,
                            timeRange: `Scheduled: ${task.hoursScheduled}h`,
                            task: `${task.name} (${task.priority} priority)`,
                            completed: task.completions?.[dayDate] || false,
                            source: 'scheduler',
                            priority: task.priority
                          }));
                          
                          // Remove duplicate scheduled tasks (in case they're already there)
                          const filteredExisting = existingHours.filter(h => h.source !== 'scheduler');
                          const combinedHours = [...filteredExisting, ...scheduledHours];
                          
                          console.log(`📅 Opening Day ${dayNum}:`, {
                            dayDate,
                            scheduledTasksForDay,
                            existing: filteredExisting.length,
                            scheduled: scheduledHours.length,
                            total: combinedHours.length,
                            combinedHours
                          });
                          
                          const dayData = {
                            day: dayNum,
                            weekday: new Date(selectedYear.year, selectedMonth.index, dayNum).toLocaleDateString('en-US', { weekday: 'long' }),
                            hours: combinedHours || [],
                            goal: existingDay?.goal || ''
                          };
                          
                          console.log('📅 Opening day:', dayNum, 'with hours:', dayData.hours.length);
                          
                          setSelectedDay(dayData);
                          setCurrentView('hour');
                        }}
                        className="px-6 py-2 bg-white text-black rounded-full hover:scale-105 transition-all font-medium text-sm"
                      >
                        Open Hours
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const toggleHourComplete = (target) => {
    console.log('🔘 Checkbox clicked, target:', target);
    
    if (!selectedDay || !selectedDay.hours) {
      console.error('❌ Invalid selectedDay or hours:', { selectedDay });
      return;
    }
    
    const hourIndex = typeof target === 'number'
      ? target
      : selectedDay.hours.findIndex(h => h?.id === target);
    
    if (hourIndex < 0 || !selectedDay.hours[hourIndex]) {
      console.error('❌ Could not resolve hour index from target:', { target, hours: selectedDay.hours });
      return;
    }
    
    const hourTask = selectedDay.hours[hourIndex];
    const newCompletedState = !hourTask.completed;
    
    console.log('✅ Toggling task:', hourTask.task, 'from', hourTask.completed, 'to', newCompletedState);
    
    // Update local state immediately
    const updatedHours = [...selectedDay.hours];
    updatedHours[hourIndex] = { ...updatedHours[hourIndex], completed: newCompletedState };
    
    // If this is a scheduled task, also update localStorage
    if (hourTask?.source === 'scheduler' && hourTask?.taskId) {
      // Use local YYYY-MM-DD to match reloadScheduledTasks and Sidebar
      const dayDate = `${selectedYear.year}-${String(selectedMonth.index + 1).padStart(2, '0')}-${String(selectedDay.day).padStart(2, '0')}`;
      
      try {
        const unifiedTasks = localStorage.getItem('unifiedTasks');
        if (unifiedTasks) {
          const tasks = JSON.parse(unifiedTasks);
          const updatedTasks = tasks.map(task => {
            if (task.id === hourTask.taskId) {
              const completions = task.completions || {};
              if (newCompletedState) {
                completions[dayDate] = new Date().toISOString();
              } else {
                delete completions[dayDate];
              }
              return { ...task, completions };
            }
            return task;
          });
          
          localStorage.setItem('unifiedTasks', JSON.stringify(updatedTasks));
          console.log('✅ Synced completion to localStorage:', hourTask.task, newCompletedState);
          
          // Dispatch custom event for sidebar to pick up
          window.dispatchEvent(new CustomEvent('taskToggled', { detail: { taskId: hourTask.taskId, date: dayDate } }));
        }
      } catch (error) {
        console.error('Failed to sync completion to localStorage:', error);
      }
    }
    
    const updatedDay = { ...selectedDay, hours: updatedHours };
    setSelectedDay(updatedDay);

    // Update in the main data structure
    const updatedYears = years.map(y => 
      y.year === selectedYear.year 
        ? {
            ...y,
            months: y.months.map((m, idx) => 
              idx === selectedMonth.index 
                ? {
                    ...m,
                    days: (() => {
                      const existingDays = m.days || [];
                      const dayIndex = existingDays.findIndex(d => d.day === selectedDay.day);
                      
                      if (dayIndex >= 0) {
                        const newDays = [...existingDays];
                        newDays[dayIndex] = { 
                          day: selectedDay.day, 
                          hours: updatedHours,
                          goal: selectedDay.goal 
                        };
                        return newDays;
                      } else {
                        return [...existingDays, { 
                          day: selectedDay.day, 
                          hours: updatedHours,
                          goal: selectedDay.goal 
                        }];
                      }
                    })()
                  }
                : m
            )
          }
        : y
    );
    
    onUpdateTodos(updatedYears);
    const updatedYear = updatedYears.find(y => y.year === selectedYear.year);
    setSelectedYear(updatedYear);
    setSelectedMonth(updatedYear.months[selectedMonth.index]);
  };

  const deleteHourTask = (hourIndex) => {
    const updatedHours = selectedDay.hours.filter((_, idx) => idx !== hourIndex);
    const updatedDay = { ...selectedDay, hours: updatedHours };
    setSelectedDay(updatedDay);

    // Update in the main data structure
    const updatedYears = years.map(y => 
      y.year === selectedYear.year 
        ? {
            ...y,
            months: y.months.map((m, idx) => 
              idx === selectedMonth.index 
                ? {
                    ...m,
                    days: (() => {
                      const existingDays = m.days || [];
                      const dayIndex = existingDays.findIndex(d => d.day === selectedDay.day);
                      
                      if (dayIndex >= 0) {
                        const newDays = [...existingDays];
                        newDays[dayIndex] = { 
                          day: selectedDay.day, 
                          hours: updatedHours,
                          goal: selectedDay.goal 
                        };
                        return newDays;
                      }
                      return existingDays;
                    })()
                  }
                : m
            )
          }
        : y
    );
    
    onUpdateTodos(updatedYears);
    const updatedYear = updatedYears.find(y => y.year === selectedYear.year);
    setSelectedYear(updatedYear);
    setSelectedMonth(updatedYear.months[selectedMonth.index]);
  };

  const addNewHourTask = () => {
    if (!newTaskStartTime || !newTaskEndTime || !newTaskDesc) return;

    const newHour = {
      id: `hour-${Date.now()}-${Math.random()}`,
      timeRange: `${newTaskStartTime} to ${newTaskEndTime}`,
      task: newTaskDesc,
      completed: false
    };

    const updatedHours = [...selectedDay.hours, newHour];
    const updatedDay = { ...selectedDay, hours: updatedHours };
    setSelectedDay(updatedDay);

    // Update in the main data structure
    const updatedYears = years.map(y => 
      y.year === selectedYear.year 
        ? {
            ...y,
            months: y.months.map((m, idx) => 
              idx === selectedMonth.index 
                ? {
                    ...m,
                    days: (() => {
                      const existingDays = m.days || [];
                      const dayIndex = existingDays.findIndex(d => d.day === selectedDay.day);
                      
                      if (dayIndex >= 0) {
                        const newDays = [...existingDays];
                        newDays[dayIndex] = { 
                          day: selectedDay.day, 
                          hours: updatedHours,
                          goal: selectedDay.goal 
                        };
                        return newDays;
                      } else {
                        return [...existingDays, { 
                          day: selectedDay.day, 
                          hours: updatedHours,
                          goal: selectedDay.goal 
                        }];
                      }
                    })()
                  }
                : m
            )
          }
        : y
    );
    
    onUpdateTodos(updatedYears);
    const updatedYear = updatedYears.find(y => y.year === selectedYear.year);
    setSelectedYear(updatedYear);
    setSelectedMonth(updatedYear.months[selectedMonth.index]);

    // Reset form
    setNewTaskStartTime('');
    setNewTaskEndTime('');
    setNewTaskDesc('');
  };

  const renderHourView = () => {
    // Create date string without timezone conversion issues
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Use UTC to avoid timezone issues
    const dateObj = new Date(Date.UTC(selectedYear.year, selectedMonth.index, selectedDay.day));
    const weekday = dayNames[dateObj.getUTCDay()];
    const dateStr = `${weekday}, ${monthNames[selectedMonth.index]} ${selectedDay.day}, ${selectedYear.year}`;

    const allCompleted = selectedDay.hours.length > 0 && selectedDay.hours.every(h => h.completed);
    const someCompleted = selectedDay.hours.some(h => h.completed);

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Streak Display - Top */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1E] rounded-lg border border-[rgba(255,255,255,0.1)]">
              <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-500' : 'text-gray-600'}`} />
              <span className={`font-bold text-lg ${streak > 0 ? 'text-orange-500' : 'text-gray-600'}`}>{streak}</span>
              <span className="text-gray-400 text-sm">Day Streak</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowQuickJump(!showQuickJump)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1E] rounded-lg hover:bg-[#262626] transition-all border border-[rgba(255,255,255,0.1)]"
              >
                <Calendar className="w-4 h-4 text-white" />
                <span className="text-white text-sm">Quick Jump</span>
              </button>
              {showQuickJump && (
                <div className="absolute right-0 mt-2 w-56 bg-[#1C1C1E] rounded-lg border border-[rgba(255,255,255,0.1)] shadow-lg z-50">
                  <button onClick={() => jumpToDay(-2)} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 rounded-t-lg border-b border-[rgba(255,255,255,0.05)]">
                    <span className="text-sm">⏪ Day Before Yesterday</span>
                  </button>
                  <button onClick={() => jumpToDay(-1)} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)]">
                    <span className="text-sm">⬅️ Yesterday</span>
                  </button>
                  <button onClick={jumpToToday} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)]">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">📅 Today</span>
                  </button>
                  <button onClick={() => jumpToDay(1)} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 border-b border-[rgba(255,255,255,0.05)]">
                    <span className="text-sm">➡️ Tomorrow</span>
                  </button>
                  <button onClick={() => jumpToDay(2)} className="w-full px-4 py-2.5 text-left text-white hover:bg-[#262626] transition-all flex items-center gap-2 rounded-b-lg">
                    <span className="text-sm">⏩ Day After Tomorrow</span>
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={onBack}
              className="p-2 hover:bg-[#1C1C1E] rounded-lg transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setCurrentView('day');
                setSelectedDay(null);
              }}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            
            {/* Scheduled Tasks Indicator */}
            {(() => {
              const dayDateStr = `${selectedYear.year}-${String(selectedMonth.index + 1).padStart(2, '0')}-${String(selectedDay.day).padStart(2, '0')}`;
              const scheduledCount = selectedDay.hours.filter(h => h.source === 'scheduler').length;
              return scheduledCount > 0 ? (
                <div className="ml-4 px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center gap-2">
                  <span className="text-blue-400 text-sm font-semibold">📅 {scheduledCount} Scheduled</span>
                </div>
              ) : null;
            })()}
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigateDay('prev')}
              disabled={selectedDay.day === 1}
              className="p-2 hover:bg-[#1C1C1E] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button 
              onClick={() => navigateDay('next')}
              disabled={selectedDay.day === new Date(selectedYear.year, selectedMonth.index + 1, 0).getDate()}
              className="p-2 hover:bg-[#1C1C1E] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{dateStr} - Hourly Schedule</h1>
        </div>

        {/* Add Task Form */}
        <div className="bg-[#1C1C1E] rounded-2xl p-6 border border-[rgba(255,255,255,0.1)] mb-6">
          <div className="flex items-center gap-4">
            <SmartTimeInput
              value={newTaskStartTime}
              onChange={setNewTaskStartTime}
              placeholder="00:00 AM"
            />
            <span className="text-gray-600">to</span>
            <SmartTimeInput
              value={newTaskEndTime}
              onChange={setNewTaskEndTime}
              placeholder="00:00 AM"
            />
            <input
              type="text"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              placeholder="What will you do during this time?"
              className="flex-1 px-4 py-3 bg-[#0A0A0A] border border-[rgba(255,255,255,0.1)] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[rgba(255,255,255,0.3)]"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addNewHourTask();
                }
              }}
            />
            <button 
              onClick={addNewHourTask}
              className="px-6 py-3 bg-white text-black rounded-xl hover:scale-105 transition-all font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.1)]">
          <table className="w-full">
            <thead className="bg-[#2C2C2E]">
              <tr>
                <th className="text-center text-gray-400 font-medium text-sm px-4 py-4 w-12">✓</th>
                <th className="text-left text-gray-400 font-medium text-sm px-6 py-4 w-48">Time Range</th>
                <th className="text-left text-gray-400 font-medium text-sm px-6 py-4">What I Will Do</th>
                <th className="text-right text-gray-400 font-medium text-sm px-6 py-4 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!selectedDay.hours || selectedDay.hours.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      No tasks scheduled for this day. Add your first task above!
                    </div>
                  </td>
                </tr>
              ) : (
                selectedDay.hours.map((hour, idx) => (
                  <tr 
                    key={hour.id || `idx-${idx}`}
                    className="border-t border-[rgba(255,255,255,0.05)] hover:bg-[#262626] transition-all"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <td className="px-4 py-5 text-center">
                      <input
                        type="checkbox"
                        checked={hour.completed}
                        onChange={() => toggleHourComplete(hour.id ?? idx)}
                        className="w-5 h-5 rounded-full cursor-pointer accent-green-500"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-gray-400 text-sm font-medium">{hour.timeRange}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`${hour.completed ? 'text-gray-600 line-through' : 'text-white'} transition-all`}>
                        {hour.task}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => deleteHourTask(idx)}
                        className="text-red-500 hover:text-red-400 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Status Message */}
        {allCompleted && selectedDay.hours.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 text-center animate-fadeIn">
            <p className="text-green-400 font-medium">🎉 All tasks completed! Great job!</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {currentView === 'month' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back to Notebooks</span>
            </button>
          </div>
          
        </div>
      )}

      {currentView === 'year' && renderYearView()}
      {currentView === 'month' && renderMonthView()}
      {currentView === 'day' && renderDayView()}
      {currentView === 'hour' && renderHourView()}
    </div>
  );
}
