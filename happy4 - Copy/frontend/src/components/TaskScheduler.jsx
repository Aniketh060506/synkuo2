import { useState, useEffect, useRef } from "react";
import { Clock, Calendar, TrendingUp, Zap, Trophy, Plus, AlertTriangle, Sparkles } from "lucide-react";
import { useTaskContext } from "../contexts/TaskContext";

export const TaskScheduler = () => {
  // Use unified task context - single source of truth
  const { 
    tasks, 
    config, 
    updateTask, 
    updateTaskSchedule, 
    updateConfig,
    getDailyTotals,
    getAllScheduledDates 
  } = useTaskContext();

  // Local UI state only
  const [taskRows, setTaskRows] = useState([
    { id: 'temp-1', name: "", priority: "medium", hoursNeeded: 0 },
    { id: 'temp-2', name: "", priority: "medium", hoursNeeded: 0 },
    { id: 'temp-3', name: "", priority: "medium", hoursNeeded: 0 }
  ]);
  
  const [activeTab, setActiveTab] = useState("tasks");
  const [showDaysPopup, setShowDaysPopup] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [suggestion, setSuggestion] = useState(null); // smart suggestion when over capacity
  const [validateModal, setValidateModal] = useState(null); // modal for Validate action

  // Focus management for overflow popup
  const overflowDialogRef = useRef(null);
  const overflowPrimaryBtnRef = useRef(null);

  // Switch to planner tab if tasks exist
  useEffect(() => {
    if (tasks.length > 0) {
      setActiveTab("planner");
    }
  }, [tasks]);

  // Helper functions
  const updateTaskRow = (id, field, value) => {
    setTaskRows(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // Validate modal actions
  const addMoreDays = (n) => {
    const days = parseInt(config.totalDays || 7);
    updateConfig({ totalDays: days + n });
    setValidateModal(null);
  };

  // Reduce the selected day's total down to the daily limit by trimming lower-priority tasks first
  const fitDayToLimit = (date) => {
    const maxH = parseInt(config.hoursPerDay || 8);
    const totals = getDailyTotals();
    let over = Math.max(0, (totals[date] || 0) - maxH);
    if (over <= 0) { setValidateModal(null); return; }

    const prioWeight = { low: 1, medium: 2, high: 3 };
    const ordered = [...tasks]
      .filter(t => (t.schedule?.[date] || 0) > 0)
      .sort((a,b) => (prioWeight[a.priority]||2) - (prioWeight[b.priority]||2));

    for (const t of ordered) {
      if (over <= 0) break;
      const current = t.schedule?.[date] || 0;
      if (current <= 0) continue;
      const cut = Math.min(current, over);
      updateTaskSchedule(t.id, date, current - cut);
      over -= cut;
    }
    setValidateModal(null);
  };

  // Move the excess hours from a given day into subsequent days' free slots, starting from low-priority tasks
  const redistributeOverCapacityDay = (date) => {
    const maxH = parseInt(config.hoursPerDay || 8);
    let totals = getDailyTotals();
    let excess = Math.max(0, (totals[date] || 0) - maxH);
    if (excess <= 0) { setValidateModal(null); return; }

    const prioWeight = { low: 1, medium: 2, high: 3 };
    const dayIndex = generateDateRange().findIndex(d => d.date === date);
    const dates = generateDateRange();

    const ordered = [...tasks]
      .filter(t => (t.schedule?.[date] || 0) > 0)
      .sort((a,b) => (prioWeight[a.priority]||2) - (prioWeight[b.priority]||2));

    for (const t of ordered) {
      if (excess <= 0) break;
      let scheduledToday = t.schedule?.[date] || 0;
      if (scheduledToday <= 0) continue;
      for (let i = dayIndex + 1; i < dates.length && excess > 0 && scheduledToday > 0; i++) {
        const d = dates[i].date;
        const used = totals[d] || 0;
        const free = Math.max(0, maxH - used);
        if (free <= 0) continue;
        const move = Math.min(free, scheduledToday, excess);
        // remove from today
        updateTaskSchedule(t.id, date, scheduledToday - move);
        scheduledToday -= move;
        // add to target day
        const currentFuture = t.schedule?.[d] || 0;
        updateTaskSchedule(t.id, d, currentFuture + move);
        totals[d] = used + move;
        excess -= move;
      }
    }
    setValidateModal(null);
  };

  const setHoursPerDay = (h) => {
    updateConfig({ hoursPerDay: Math.min(24, Math.max(1, parseInt(h) || 1)) });
    setValidateModal(null);
  };

  const autoDistributeMissing = () => {
    // Fill remaining unscheduled time across free capacities day-by-day
    const dates = generateDateRange();
    const maxH = parseInt(config.hoursPerDay || 8);
    let totals = getDailyTotals();

    // Compute remaining per task
    const remaining = tasks.map(t => ({
      id: t.id,
      name: t.name,
      remain: Math.max(0, t.hoursNeeded - Object.values(t.schedule || {}).reduce((s,h)=>s+h,0))
    }));

    let any = true;
    while (any) {
      any = false;
      for (const r of remaining) {
        if (r.remain <= 0) continue;
        // find first day with free capacity
        for (const d of dates) {
          const used = totals[d.date] || 0;
          const free = Math.max(0, maxH - used);
          if (free > 0) {
            const assign = Math.min(free, r.remain);
            const current = (tasks.find(t => t.id === r.id)?.schedule?.[d.date]) || 0;
            updateTaskSchedule(r.id, d.date, current + assign);
            totals[d.date] = used + assign;
            r.remain -= assign;
            any = true;
            break;
          }
        }
      }
      if (!any) break;
    }
    setValidateModal(null);
  };

  // Smart capacity guard for planner cell edits
  const handleHoursChange = (task, dateInfo, rawValue) => {
    const entered = Math.max(0, parseInt(rawValue) || 0);
    const date = dateInfo.date;
    const maxHours = parseInt(config.hoursPerDay || 8);

    // Current total for this date
    const dailyTotals = getDailyTotals();
    const currentForTask = task.schedule?.[date] || 0;
    const otherTotal = Math.max(0, (dailyTotals[date] || 0) - currentForTask);
    const available = Math.max(0, maxHours - otherTotal);
    const clamped = Math.min(entered, available);

    // Apply clamped value
    updateTaskSchedule(task.id, date, clamped);

    const overflow = Math.max(0, entered - clamped);
    if (overflow > 0) {
      // Build a distribution plan across subsequent days with free capacity
      const plan = buildDistributionPlan(overflow, dateInfo.index, maxHours);
      setSuggestion({
        taskId: task.id,
        taskName: task.name,
        attempted: entered,
        setTo: clamped,
        available,
        overflow,
        dateInfo,
        plan
      });
    }
  };

  // Create plan to fill overflow into next days that have free capacity
  const buildDistributionPlan = (overflow, startIndex, maxHours) => {
    const totals = getDailyTotals();
    const dates = generateDateRange();
    let remaining = overflow;
    const plan = [];
    for (let i = startIndex + 1; i < dates.length && remaining > 0; i++) {
      const d = dates[i];
      const dayTotal = totals[d.date] || 0;
      const free = Math.max(0, maxHours - dayTotal);
      if (free > 0) {
        const assign = Math.min(free, remaining);
        plan.push({ index: i, date: d.date, display: d.display, assign });
        remaining -= assign;
      }
    }
    return plan;
  };

  const applyDistribution = async () => {
    if (!suggestion || !suggestion.plan || suggestion.plan.length === 0) {
      setSuggestion(null);
      return;
    }
    const task = tasks.find(t => t.id === suggestion.taskId);
    if (!task) {
      setSuggestion(null);
      return;
    }
    // Apply each planned assignment by adding to any existing hours on that date
    suggestion.plan.forEach(p => {
      const current = task.schedule?.[p.date] || 0;
      updateTaskSchedule(suggestion.taskId, p.date, current + p.assign);
    });
    setSuggestion(null);
  };

  // Helpers for overflow actions
  const increaseHoursPerDayToFit = () => {
    if (!suggestion) return;
    const desired = (suggestion.available || 0) + (suggestion.overflow || 0);
    updateConfig({ hoursPerDay: Math.min(24, Math.max(config.hoursPerDay || 1, desired)) });
    setSuggestion(null);
  };

  const addDaysToFitOverflow = () => {
    if (!suggestion) return;
    const maxH = parseInt(config.hoursPerDay || 8);
    const remaining = Math.max(0, suggestion.overflow - (suggestion.plan?.reduce((s,p)=>s+p.assign,0) || 0));
    const needDays = remaining > 0 ? Math.ceil(remaining / Math.max(1, maxH)) : 1;
    updateConfig({ totalDays: (parseInt(config.totalDays||7) + needDays) });
    setSuggestion(null);
  };

  const removeOverflowFromThisTask = () => {
    if (!suggestion) return;
    // Keep the clamped value that was applied, and drop the overflow
    const date = suggestion.dateInfo?.date;
    if (!date) { setSuggestion(null); return; }
    const task = tasks.find(t => t.id === suggestion.taskId);
    if (!task) { setSuggestion(null); return; }
    updateTaskSchedule(task.id, date, suggestion.setTo);
    setSuggestion(null);
  };

  // Autofocus and basic focus trap for overflow popup
  useEffect(() => {
    if (suggestion && overflowPrimaryBtnRef.current) {
      overflowPrimaryBtnRef.current.focus();
    }
  }, [suggestion]);

  const addMoreRows = () => {
    const newRows = Array.from({ length: 3 }, (_, i) => ({
      id: `temp-${Date.now()}-${i}`,
      name: "",
      priority: "medium",
      hoursNeeded: 0
    }));
    setTaskRows(prev => [...prev, ...newRows]);
  };

  const finalizeTasks = () => {
    const filledTasks = taskRows.filter(row => row.name.trim() && row.hoursNeeded > 0);
    if (filledTasks.length === 0) return;
    setShowDaysPopup(true);
  };

  const proceedToScheduling = () => {
    const days = parseInt(config.totalDays || 7);
    const hours = parseInt(config.hoursPerDay || 8);
    
    // Update config first
    updateConfig({
      totalDays: days,
      hoursPerDay: hours,
      startDate: new Date().toISOString().split('T')[0]
    });

    // Add tasks to unified context
    const filledTasks = taskRows.filter(row => row.name.trim() && row.hoursNeeded > 0);
    filledTasks.forEach(row => {
      updateTask({
        id: `task-${Date.now()}-${Math.random()}`,
        name: row.name,
        hoursNeeded: row.hoursNeeded,
        priority: row.priority,
        schedule: {} // Empty schedule to start
      });
    });

    setShowDaysPopup(false);
    setActiveTab("planner");
  };

  const updateDailyHours = (taskId, dayIndex, hours) => {
    const dateKey = new Date(config.startDate);
    dateKey.setDate(dateKey.getDate() + dayIndex);
    const dateStr = dateKey.toISOString().split('T')[0];
    
    updateTaskSchedule(taskId, dateStr, hours);
  };

  const validateSchedule = () => {
    const dailyTotals = getDailyTotals();
    const maxHours = config.hoursPerDay;
    
    // Check daily capacity
    for (const [date, totalHours] of Object.entries(dailyTotals)) {
      if (totalHours > maxHours) {
        return {
          isValid: false,
          type: 'overCapacity',
          date,
          totalHours,
          maxHours,
          errorMessage: `${date} has ${totalHours}h scheduled, but you only have ${maxHours}h available per day.`
        };
      }
    }
    
    // Check total completion
    const totalNeeded = tasks.reduce((sum, task) => sum + task.hoursNeeded, 0);
    const totalScheduled = Object.values(dailyTotals).reduce((sum, hours) => sum + hours, 0);
    
    if (totalScheduled < totalNeeded) {
      return {
        isValid: false,
        type: 'underScheduled',
        totalNeeded,
        totalScheduled,
        missing: totalNeeded - totalScheduled,
        errorMessage: `You need ${totalNeeded}h total, but only scheduled ${totalScheduled}h.`
      };
    }
    
    return { isValid: true };
  };

  const finalizeSchedule = () => {
    const result = validateSchedule();
    setValidationResult(result);
    
    if (result.isValid) {
      console.log('✅ Schedule validated - forcing save to localStorage');
      console.log('📊 Current tasks:', tasks);
      console.log('⚙️ Current config:', config);
      
      // Force save to localStorage
      try {
        localStorage.setItem('unifiedTasks', JSON.stringify(tasks));
        localStorage.setItem('unifiedConfig', JSON.stringify(config));
        console.log('💾 FORCE SAVED to localStorage');
      } catch (error) {
        console.error('❌ Failed to save to localStorage:', error);
      }
      
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "text-red-400 border-red-400/30 bg-red-500/10";
      case "medium": return "text-yellow-400 border-yellow-400/30 bg-yellow-500/10";
      case "low": return "text-green-400 border-green-400/30 bg-green-500/10";
      default: return "";
    }
  };

  // Stats calculations from unified context
  const totalTasksScheduled = tasks.filter(task => 
    Object.keys(task.schedule || {}).length > 0
  ).length;
  
  const totalHoursScheduled = Object.values(getDailyTotals()).reduce((sum, hours) => sum + hours, 0);

  const generateDateRange = () => {
    const dates = [];
    const startDate = new Date(config.startDate || new Date().toISOString().split('T')[0]);
    
    for (let i = 0; i < (config.totalDays || 7); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push({
        index: i,
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return dates;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Days Popup */}
      {showDaysPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              🚀 Let's Plan Your Schedule!
            </h2>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Number of Days Available</label>
                <input
                  type="number"
                  placeholder="e.g., 7"
                  value={config.totalDays || ''}
                  onChange={(e) => updateConfig({ totalDays: parseInt(e.target.value) || 7 })}
                  className="w-full px-4 py-3 bg-black border border-blue-500/30 rounded-full text-2xl text-center focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Hours Per Day You Can Study</label>
                <input
                  type="number"
                  placeholder="e.g., 3"
                  value={config.hoursPerDay || ''}
                  onChange={(e) => updateConfig({ hoursPerDay: parseInt(e.target.value) || 8 })}
                  className="w-full px-4 py-3 bg-black border border-blue-500/30 rounded-full text-2xl text-center focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                />
              </div>

              <button 
                onClick={proceedToScheduling}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-black hover:from-blue-700 hover:to-black/90 rounded-lg font-semibold text-lg text-white shadow-[0_0_20px_rgba(37,99,235,0.35)] border border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                disabled={!config.totalDays || !config.hoursPerDay}
              >
                Let's Schedule! 🎯
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overflow suggestion popup (auto-focus) */}
      {suggestion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80" role="dialog" aria-modal="true">
          <div ref={overflowDialogRef} className="w-full max-w-xl bg-black border border-blue-500/30 rounded-2xl p-6 text-white shadow-2xl">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5" />
              <div>
                <div className="text-lg font-semibold">Day over capacity</div>
                <div className="text-sm text-gray-300">
                  You attempted {suggestion.attempted}h, but only {suggestion.available}h was free. We set {suggestion.setTo}h for this day. Overflow: {suggestion.overflow}h.
                </div>
              </div>
            </div>

            {suggestion.plan && suggestion.plan.length > 0 && (
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 mb-4">
                <div className="text-sm font-medium mb-2">Suggested distribution for remaining {suggestion.overflow}h:</div>
                <ul className="text-sm text-gray-300 space-y-1 max-h-40 overflow-y-auto pr-1">
                  {suggestion.plan.map(p => (
                    <li key={p.date} className="flex items-center justify-between">
                      <span>Day {p.index + 1} • {p.display}</span>
                      <span className="font-semibold">+{p.assign}h</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button ref={overflowPrimaryBtnRef} onClick={applyDistribution} className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                Auto‑distribute
              </button>
              <button onClick={addDaysToFitOverflow} className="px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                Add next day(s)
              </button>
              <button onClick={increaseHoursPerDayToFit} className="px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                Increase hours/day
              </button>
              <button onClick={removeOverflowFromThisTask} className="px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                Remove hours from this task
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setSuggestion(null)} className="px-3 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Validate Modal (all black) */}
      {validateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-xl bg-black border border-blue-500/30 rounded-2xl p-6 text-white">
            {validateModal.kind === 'underScheduled' ? (
              <>
                <div className="text-lg font-semibold mb-2">Schedule needs more time</div>
                <div className="text-sm text-gray-300 mb-4">
                  You are missing <span className="font-semibold">{validateModal.missing}h</span> (scheduled {validateModal.totalScheduled}h / needed {validateModal.totalNeeded}h).
                </div>
                <div className="space-y-2 mb-5">
                  <button onClick={() => addMoreDays(validateModal.addDays)} className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm">
                    Add {validateModal.addDays} day(s)
                  </button>
                  <button onClick={() => setHoursPerDay(validateModal.neededHPD)} className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm">
                    Set hours/day to {validateModal.neededHPD}
                  </button>
                  <button onClick={autoDistributeMissing} className="w-full px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-blue-500/30 text-sm">
                    Auto‑distribute missing hours into free slots
                  </button>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setValidateModal(null)} className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-sm">Close</button>
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold mb-2">Day over capacity</div>
                <div className="text-sm text-gray-300 mb-4">
                  {validateModal.date} has {validateModal.totalHours}h scheduled; daily limit is {validateModal.maxHours}h.
                </div>
                <div className="space-y-2 mb-5">
                  <button onClick={() => fitDayToLimit(validateModal.date)} className="w-full px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-blue-500/30 text-sm">
                    Trim lower‑priority tasks on this day to fit {validateModal.maxHours}h
                  </button>
                  <button onClick={() => redistributeOverCapacityDay(validateModal.date)} className="w-full px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-blue-500/30 text-sm">
                    Move today's excess into future free slots
                  </button>
                  <button onClick={() => setHoursPerDay(validateModal.totalHours)} className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm">
                    Increase hours/day to {validateModal.totalHours}
                  </button>
                  <button onClick={() => addMoreDays(1)} className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm">
                    Add 1 more day to plan
                  </button>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setValidateModal(null)} className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-sm">Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Celebration */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <Sparkles className="w-24 h-24 mx-auto mb-6 text-primary animate-pulse" />
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Perfect Schedule! 🎉
            </h2>
            <p className="text-2xl text-muted-foreground">You're ready to crush it!</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-3">Task Scheduler</h1>
          <p className="text-xl text-muted-foreground">Transform your goals into organized daily tasks</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex bg-card border border-border rounded-xl p-1">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`flex-1 px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === "tasks"
                  ? "bg-white text-black shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📋 Tasks ({taskRows.filter(r => r.name.trim()).length})
            </button>
            <button
              onClick={() => setActiveTab("planner")}
              className={`flex-1 px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === "planner"
                  ? "bg-white text-black shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📅 Planner ({tasks.length} scheduled)
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {activeTab === "tasks" ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-card border border-border rounded-2xl p-6">
              <Clock className="w-8 h-8 mb-3 text-orange-400" />
              <div className="text-3xl font-bold mb-1">
                {taskRows.filter(r => r.name.trim() && r.hoursNeeded > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Tasks Ready</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <TrendingUp className="w-8 h-8 mb-3 text-purple-400" />
              <div className="text-3xl font-bold mb-1">
                {taskRows.reduce((sum, r) => sum + (r.hoursNeeded || 0), 0)}h
              </div>
              <div className="text-sm text-muted-foreground">Hours Needed</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <Zap className="w-8 h-8 mb-3 text-green-400" />
              <div className="text-3xl font-bold mb-1">
                {taskRows.filter(r => r.priority === "high" && r.name.trim()).length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <Trophy className="w-8 h-8 mb-3 text-yellow-400" />
              <div className="text-3xl font-bold mb-1">0</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-card border border-border rounded-2xl p-6">
              <Calendar className="w-8 h-8 mb-3 text-blue-400" />
              <div className="text-3xl font-bold mb-1">{config.totalDays || 0}</div>
              <div className="text-sm text-muted-foreground">Days Available</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <Clock className="w-8 h-8 mb-3 text-orange-400" />
              <div className="text-3xl font-bold mb-1">{config.hoursPerDay || 0}h</div>
              <div className="text-sm text-muted-foreground">Hours Per Day</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <TrendingUp className="w-8 h-8 mb-3 text-purple-400" />
              <div className="text-3xl font-bold mb-1">{totalHoursScheduled}h</div>
              <div className="text-sm text-muted-foreground">Hours Scheduled</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <Zap className="w-8 h-8 mb-3 text-green-400" />
              <div className="text-3xl font-bold mb-1">{totalTasksScheduled}</div>
              <div className="text-sm text-muted-foreground">Tasks Scheduled</div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {activeTab === "tasks" ? (
          /* Task Input Mode */
          <div className="bg-card border border-border rounded-2xl p-8 mb-8">
            <h2 className="text-lg font-semibold mb-4">What do you want to do?</h2>
            
            <div className="space-y-3 mb-6">
              {taskRows.map((row, index) => (
                <div key={row.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-secondary/30 rounded-lg border border-border/50 hover:border-primary/30 transition-all">
                  <div className="col-span-1 text-center font-mono text-sm text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  
                  <input
                    placeholder="Enter task..."
                    value={row.name}
                    onChange={(e) => updateTaskRow(row.id, 'name', e.target.value)}
                    className="col-span-6 h-10 px-3 text-sm bg-background border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />

                  <input
                    type="number"
                    placeholder="Hours"
                    value={row.hoursNeeded || ''}
                    onChange={(e) => updateTaskRow(row.id, 'hoursNeeded', parseInt(e.target.value) || 0)}
                    className="col-span-2 h-10 px-3 text-sm font-semibold bg-background border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                    min="0"
                  />
                  
                  <select
                    value={row.priority}
                    onChange={(e) => updateTaskRow(row.id, 'priority', e.target.value)}
                    className="col-span-3 h-10 px-3 text-sm bg-background border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button onClick={addMoreRows} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add More Tasks
              </button>
              
              <button 
                onClick={finalizeTasks} 
                className="flex-1 px-4 py-2 bg-white text-black hover:bg-gray-100 rounded-full font-medium text-sm shadow-md border border-white/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={taskRows.filter(r => r.name.trim() && r.hoursNeeded > 0).length === 0}
              >
                Finalize & Schedule 🚀
              </button>
            </div>
          </div>
        ) : (
          /* Planning Mode - Using Unified Context Data */
          <div className="bg-card border border-border rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold">Schedule Your Tasks</h2>
              <span className="text-sm text-muted-foreground">({tasks.length} tasks from unified context)</span>
            </div>
            
            {validationResult && !validationResult.isValid && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <div>
                    <div className="font-bold text-red-500">Schedule Issue!</div>
                    <div className="text-sm text-red-400">{validationResult.errorMessage}</div>
                  </div>
                </div>
              </div>
            )}

            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">No tasks to schedule yet</div>
                <button 
                  onClick={() => setActiveTab("tasks")}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                >
                  Add Tasks First
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="overflow-x-auto overflow-y-auto max-h-[600px] border border-border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-secondary/50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold min-w-[60px] border-r border-border">#</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold min-w-[200px] border-r border-border">Task</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold min-w-[80px] border-r border-border">Hours</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold min-w-[100px] border-r border-border">Priority</th>
                        
                        {generateDateRange().map((dateInfo) => (
                          <th key={dateInfo.index} className="px-4 py-3 text-center text-sm font-semibold min-w-[80px] border-r border-border/50">
                            <div>Day {dateInfo.index + 1}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {dateInfo.display}
                            </div>
                          </th>
                        ))}
                        
                        <th className="px-4 py-3 text-center text-sm font-semibold min-w-[80px]">Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {tasks.map((task, index) => {
                        const totalScheduled = Object.values(task.schedule || {}).reduce((s, h) => s + h, 0);
                        const isComplete = totalScheduled >= task.hoursNeeded;
                        
                        return (
                          <tr key={task.id} className="border-b border-border hover:bg-secondary/20">
                            <td className="px-4 py-4 text-center font-mono text-sm border-r border-border">
                              {String(index + 1).padStart(2, '0')}
                            </td>
                            
                            <td className="px-4 py-4 border-r border-border">
                              <div className="font-medium text-sm">{task.name}</div>
                              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-yellow-500'}`}
                                  style={{ width: `${Math.min((totalScheduled / task.hoursNeeded) * 100, 100)}%` }}
                                />
                              </div>
                            </td>
                            
                            <td className="px-4 py-4 text-center font-semibold border-r border-border">
                              {task.hoursNeeded}h
                            </td>
                            
                            <td className="px-4 py-4 text-center border-r border-border">
                              <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </td>
                            
                            {generateDateRange().map((dateInfo) => (
                              <td key={dateInfo.index} className="px-4 py-4 text-center border-r border-border/50">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={task.schedule?.[dateInfo.date] ?? ''}
                                  onChange={(e) => handleHoursChange(task, dateInfo, e.target.value)}
                                  className="w-16 h-16 px-2 bg-background border border-border rounded-full text-center focus:outline-none focus:ring-1 focus:ring-primary text-sm font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  min="0"
                                  max={config.hoursPerDay || 24}
                                />
                              </td>
                            ))}
                            
                            <td className="px-4 py-4 text-center font-semibold">
                              <div className={`${isComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                                {totalScheduled}h
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                    <tfoot className="bg-secondary/50 border-t border-border">
                      <tr>
                        <td colSpan="4" className="px-4 py-3 font-semibold border-r border-border">
                          Daily Totals
                        </td>
                        {generateDateRange().map((dateInfo) => {
                          const dayTotal = tasks.reduce((sum, task) => 
                            sum + (task.schedule?.[dateInfo.date] || 0), 0
                          );
                          const maxHours = config.hoursPerDay || 8;
                          const isOverCapacity = dayTotal > maxHours;
                          
                          return (
                            <td key={dateInfo.index} className="px-4 py-3 text-center border-r border-border/50">
                              <div className={`text-sm font-bold ${
                                isOverCapacity ? 'text-red-400' : 
                                dayTotal === maxHours ? 'text-green-400' : 
                                dayTotal > 0 ? 'text-blue-400' : 'text-muted-foreground'
                              }`}>
                                {dayTotal}h
                              </div>
                              <div className="text-xs text-muted-foreground">/ {maxHours}h</div>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center">
                          <div className="text-sm font-bold">
                            {totalHoursScheduled}h
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {tasks.length > 0 && (
              <div className="mt-6 flex justify-between items-center">
                <button 
                  onClick={() => {
                    const unifiedTasks = localStorage.getItem('unifiedTasks');
                    const unifiedConfig = localStorage.getItem('unifiedConfig');
                    console.log('🔍 DEBUGGING localStorage:');
                    console.log('Tasks in localStorage:', unifiedTasks ? JSON.parse(unifiedTasks) : 'EMPTY');
                    console.log('Config in localStorage:', unifiedConfig ? JSON.parse(unifiedConfig) : 'EMPTY');
                    console.log('Current context tasks:', tasks);
                    console.log('Current context config:', config);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                >
                  🔍 Check localStorage
                </button>
                
                <button 
                  onClick={finalizeSchedule}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-lg font-semibold text-lg text-white shadow-lg transition-all"
                >
                  Validate Schedule ✨
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Smart Suggestion Modal */}
      {suggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5" />
              <div>
                <div className="font-bold text-red-400 mb-1">Day over capacity</div>
                <div className="text-sm text-muted-foreground">
                  You tried to schedule <span className="text-foreground font-semibold">{suggestion.attempted}h</span> for <span className="font-semibold">{suggestion.taskName}</span>,
                  but only <span className="text-foreground font-semibold">{suggestion.available}h</span> was available. We've set it to <span className="text-foreground font-semibold">{suggestion.setTo}h</span>.
                </div>
              </div>
            </div>

            {suggestion.plan && suggestion.plan.length > 0 ? (
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">Suggested distribution for remaining {suggestion.overflow}h:</div>
                <div className="space-y-1 max-h-40 overflow-auto pr-1">
                  {suggestion.plan.map(p => (
                    <div key={p.date} className="flex items-center justify-between text-sm bg-secondary/30 border border-border/50 rounded-md px-3 py-2">
                      <div>Day {p.index + 1} • {p.display}</div>
                      <div className="font-semibold">+{p.assign}h</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4 text-sm text-muted-foreground">
                No free hours remain in the next {config.totalDays || 7} days. Reduce hours or extend the plan length.
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSuggestion(null)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-secondary text-sm"
              >
                Keep as set
              </button>
              <button
                onClick={applyDistribution}
                disabled={!suggestion.plan || suggestion.plan.length === 0}
                className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-sm disabled:opacity-50"
              >
                Auto-distribute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
