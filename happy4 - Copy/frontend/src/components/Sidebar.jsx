import { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Search,
  TrendingUp,
  Clock,
  Star,
  Calendar,
  Zap,
  RefreshCw,
  Clipboard,
  Check,
  BookOpen,
  Target,
  Brain,
  Timer,
  Award,
  Activity,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import { getRecentNotebooks, getFavoriteNotebooks } from '../utils/storage';
import Lenis from 'lenis';

// 1. SMART FOCUS TIME - Calculates remaining work hours today
function SmartFocusWidget() {
  const [focusData, setFocusData] = useState({ remaining: 0, total: 0, completed: 0 });

  useEffect(() => {
    const calculateFocusTime = () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const unifiedTasks = localStorage.getItem('unifiedTasks');
        
        if (unifiedTasks) {
          const allTasks = JSON.parse(unifiedTasks);
          const todayTasks = allTasks.filter(task => task.schedule && task.schedule[today] > 0);
          
          const total = todayTasks.reduce((sum, task) => sum + task.schedule[today], 0);
          const completed = todayTasks.filter(t => t.completions?.[today]).reduce((sum, task) => sum + task.schedule[today], 0);
          const remaining = total - completed;
          
          setFocusData({ remaining, total, completed });
        }
      } catch (error) {
        console.error('Error calculating focus time:', error);
      }
    };

    calculateFocusTime();
    const interval = setInterval(calculateFocusTime, 5000);
    return () => clearInterval(interval);
  }, []);

  const percentage = focusData.total > 0 ? (focusData.completed / focusData.total) * 100 : 0;

  return (
    <div className="bg-[#1C1C1E] rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-blue-400" />
          <h3 className="text-white font-medium text-sm">Smart Focus Time</h3>
        </div>
        <span className="text-xs text-blue-400 font-bold">{focusData.remaining}h left</span>
      </div>
      <div className="space-y-2">
        <div className="w-full bg-[#0A0A0A] rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">{focusData.completed}h done</span>
          <span className="text-gray-400">{focusData.total}h total</span>
        </div>
      </div>
    </div>
  );
}

// 2. PRODUCTIVITY SCORE - AI-powered score
function ProductivityScoreWidget() {
  const [score, setScore] = useState(0);
  const [trend, setTrend] = useState('stable');

  useEffect(() => {
    const calculateScore = () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const unifiedTasks = localStorage.getItem('unifiedTasks');
        
        if (unifiedTasks) {
          const allTasks = JSON.parse(unifiedTasks);
          const todayTasks = allTasks.filter(task => task.schedule && task.schedule[today] > 0);
          const completedTasks = todayTasks.filter(t => t.completions?.[today]);
          
          // Calculate score based on completion rate, priority, and streak
          const completionRate = todayTasks.length > 0 ? (completedTasks.length / todayTasks.length) * 100 : 0;
          const highPriorityBonus = completedTasks.filter(t => t.priority === 'high').length * 10;
          const streakBonus = (parseInt(localStorage.getItem('todoStreak')) || 0) * 2;
          
          const finalScore = Math.min(100, Math.round(completionRate + highPriorityBonus + streakBonus));
          setScore(finalScore);
          
          // Determine trend
          if (finalScore >= 80) setTrend('up');
          else if (finalScore >= 50) setTrend('stable');
          else setTrend('down');
        }
      } catch (error) {
        console.error('Error calculating score:', error);
      }
    };

    calculateScore();
    const interval = setInterval(calculateScore, 5000);
    return () => clearInterval(interval);
  }, []);

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-[#1C1C1E] rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <h3 className="text-white font-medium text-sm">Productivity Score</h3>
        </div>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
      </div>
      <div className="flex items-center gap-4">
        <div className={`text-4xl font-bold ${getScoreColor()}`}>{score}</div>
        <div className="flex-1">
          <div className="text-xs text-gray-400 mb-1">Performance</div>
          <div className="w-full bg-[#0A0A0A] rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                score >= 80 ? 'bg-green-400' : score >= 50 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. UPCOMING DEADLINES - Next 3 urgent tasks
function UpcomingDeadlinesWidget() {
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    const loadDeadlines = () => {
      try {
        const unifiedTasks = localStorage.getItem('unifiedTasks');
        if (unifiedTasks) {
          const allTasks = JSON.parse(unifiedTasks);
          const today = new Date();
          
          // Get tasks scheduled in next 7 days
          const upcoming = allTasks
            .filter(task => {
              if (!task.schedule) return false;
              const dates = Object.keys(task.schedule);
              return dates.some(date => {
                const taskDate = new Date(date);
                const diffDays = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 7 && !task.completions?.[date];
              });
            })
            .slice(0, 3);
          
          setDeadlines(upcoming);
        }
      } catch (error) {
        console.error('Error loading deadlines:', error);
      }
    };

    loadDeadlines();
    const interval = setInterval(loadDeadlines, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#1C1C1E] rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-red-400" />
        <h3 className="text-white font-medium text-sm">Upcoming Deadlines</h3>
      </div>
      {deadlines.length > 0 ? (
        <div className="space-y-2">
          {deadlines.map((task, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-[#0A0A0A] rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                task.priority === 'high' ? 'bg-red-400' :
                task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
              }`} />
              <span className="text-sm text-white truncate flex-1">{task.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm text-center py-2">All caught up! 🎉</p>
      )}
    </div>
  );
}

// 4. LEARNING PROGRESS - Courses being learned
function LearningProgressWidget() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const loadCourses = () => {
      try {
        const learningData = localStorage.getItem('learningCourses');
        if (learningData) {
          const parsed = JSON.parse(learningData);
          setCourses(parsed.slice(0, 3));
        }
      } catch (error) {
        console.error('Error loading courses:', error);
      }
    };

    loadCourses();
    const interval = setInterval(loadCourses, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#1C1C1E] rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-green-400" />
        <h3 className="text-white font-medium text-sm">Learning Progress</h3>
      </div>
      {courses.length > 0 ? (
        <div className="space-y-3">
          {courses.map((course, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white truncate">{course.name || `Course ${idx + 1}`}</span>
                <span className="text-xs text-gray-400">{course.progress || 0}%</span>
              </div>
              <div className="w-full bg-[#0A0A0A] rounded-full h-1.5">
                <div
                  className="bg-green-400 h-1.5 rounded-full transition-all"
                  style={{ width: `${course.progress || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm text-center py-2">Start learning! 📚</p>
      )}
    </div>
  );
}

// 5. WEEKLY MOMENTUM - Trend analysis
function WeeklyMomentumWidget() {
  const [momentum, setMomentum] = useState({ trend: 'stable', change: 0, prediction: 'steady' });

  useEffect(() => {
    const calculateMomentum = () => {
      try {
        const unifiedTasks = localStorage.getItem('unifiedTasks');
        if (unifiedTasks) {
          const allTasks = JSON.parse(unifiedTasks);
          const today = new Date();
          
          // Calculate completions for last 7 days
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
          });
          
          const completionsPerDay = last7Days.map(date => {
            return allTasks.filter(task => task.completions?.[date]).length;
          });
          
          const avgFirst3 = completionsPerDay.slice(4, 7).reduce((a, b) => a + b, 0) / 3;
          const avgLast3 = completionsPerDay.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
          const change = avgLast3 - avgFirst3;
          
          const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
          const prediction = change > 1 ? 'accelerating' : change < -1 ? 'slowing' : 'steady';
          
          setMomentum({ trend, change: Math.abs(Math.round(change)), prediction });
        }
      } catch (error) {
        console.error('Error calculating momentum:', error);
      }
    };

    calculateMomentum();
    const interval = setInterval(calculateMomentum, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#1C1C1E] rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-cyan-400" />
        <h3 className="text-white font-medium text-sm">Weekly Momentum</h3>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {momentum.trend === 'up' && <TrendingUp className="w-6 h-6 text-green-400" />}
          {momentum.trend === 'down' && <TrendingDown className="w-6 h-6 text-red-400" />}
          {momentum.trend === 'stable' && <Activity className="w-6 h-6 text-gray-400" />}
          <div>
            <div className={`text-lg font-bold ${
              momentum.trend === 'up' ? 'text-green-400' :
              momentum.trend === 'down' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {momentum.trend === 'up' ? '+' : momentum.trend === 'down' ? '-' : ''}{momentum.change}
            </div>
            <div className="text-xs text-gray-400 capitalize">{momentum.prediction}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Next week</div>
          <div className="text-sm text-white font-medium">
            {momentum.prediction === 'accelerating' ? '📈 Strong' :
             momentum.prediction === 'slowing' ? '📉 Weak' : '➡️ Steady'}
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. ACHIEVEMENT BADGES - Gamification
function AchievementBadgesWidget() {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    const calculateBadges = () => {
      const earned = [];
      const streak = parseInt(localStorage.getItem('todoStreak')) || 0;
      const unifiedTasks = localStorage.getItem('unifiedTasks');
      
      if (streak >= 7) earned.push({ icon: '🔥', name: 'Week Warrior', desc: '7 day streak' });
      if (streak >= 30) earned.push({ icon: '💎', name: 'Diamond Mind', desc: '30 day streak' });
      
      if (unifiedTasks) {
        const tasks = JSON.parse(unifiedTasks);
        const completed = tasks.filter(t => Object.values(t.completions || {}).some(v => v)).length;
        
        if (completed >= 10) earned.push({ icon: '⭐', name: 'Task Master', desc: '10 tasks done' });
        if (completed >= 50) earned.push({ icon: '👑', name: 'Productivity King', desc: '50 tasks done' });
      }
      
      setBadges(earned.slice(0, 3));
    };

    calculateBadges();
    const interval = setInterval(calculateBadges, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#1C1C1E] rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-4 h-4 text-yellow-400" />
        <h3 className="text-white font-medium text-sm">Achievements</h3>
      </div>
      {badges.length > 0 ? (
        <div className="space-y-2">
          {badges.map((badge, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 bg-[#0A0A0A] rounded-lg">
              <span className="text-2xl">{badge.icon}</span>
              <div className="flex-1">
                <div className="text-sm text-white font-medium">{badge.name}</div>
                <div className="text-xs text-gray-400">{badge.desc}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm text-center py-2">Keep going! 🎯</p>
      )}
    </div>
  );
}

// 7. QUICK ACTIONS - Smart shortcuts
function QuickActionsWidget() {
  return (
    <div className="bg-[#1C1C1E] rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-pink-400" />
        <h3 className="text-white font-medium text-sm">Quick Actions</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button className="p-2 bg-[#0A0A0A] rounded-lg hover:bg-[#262626] transition-all text-left">
          <div className="text-xs text-white font-medium">📝 New Note</div>
        </button>
        <button className="p-2 bg-[#0A0A0A] rounded-lg hover:bg-[#262626] transition-all text-left">
          <div className="text-xs text-white font-medium">✅ Add Task</div>
        </button>
        <button className="p-2 bg-[#0A0A0A] rounded-lg hover:bg-[#262626] transition-all text-left">
          <div className="text-xs text-white font-medium">📚 Study</div>
        </button>
        <button className="p-2 bg-[#0A0A0A] rounded-lg hover:bg-[#262626] transition-all text-left">
          <div className="text-xs text-white font-medium">🔍 Search</div>
        </button>
      </div>
    </div>
  );
}

// Today's Tasks Widget Component
function TodayTasksWidget() {
  const [todayTasks, setTodayTasks] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    loadTodayTasks();
    // Reload every 5 seconds to sync with TodoSystem
    const interval = setInterval(loadTodayTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadTodayTasks = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const unifiedTasks = localStorage.getItem('unifiedTasks');
      
      if (unifiedTasks) {
        const allTasks = JSON.parse(unifiedTasks);
        const tasksForToday = allTasks.filter(task => 
          task.schedule && task.schedule[today] > 0
        ).map(task => ({
          id: task.id,
          name: task.name,
          hours: task.schedule[today],
          priority: task.priority,
          completed: task.completions?.[today] || false
        }));
        
        setTodayTasks(tasksForToday);
        setCompletedCount(tasksForToday.filter(t => t.completed).length);
      }
    } catch (error) {
      console.error('Error loading today tasks:', error);
    }
  };

  const toggleTask = (taskId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const unifiedTasks = localStorage.getItem('unifiedTasks');
      
      if (unifiedTasks) {
        const allTasks = JSON.parse(unifiedTasks);
        const updatedTasks = allTasks.map(task => {
          if (task.id === taskId) {
            const completions = task.completions || {};
            const newState = !completions[today];
            if (newState) {
              completions[today] = new Date().toISOString();
            } else {
              delete completions[today];
            }
            return { ...task, completions };
          }
          return task;
        });
        
        localStorage.setItem('unifiedTasks', JSON.stringify(updatedTasks));
        
        // Dispatch custom event for TodoSystem to listen
        window.dispatchEvent(new CustomEvent('taskToggled', { detail: { taskId, date: today } }));
        
        loadTodayTasks();
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  return (
    <div className="bg-[#1C1C1E] rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white" />
          <h3 className="text-white font-medium text-sm">Today's Tasks</h3>
        </div>
        <span className="text-xs text-gray-400">{completedCount}/{todayTasks.length}</span>
      </div>

      {todayTasks.length > 0 ? (
        <div className="space-y-2">
          {todayTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-2 p-2 bg-[#0A0A0A] rounded-lg hover:bg-[#262626] transition-all cursor-pointer"
              onClick={() => toggleTask(task.id)}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                task.completed ? 'bg-white border-white' : 'border-gray-600'
              }`}>
                {task.completed && <Check className="w-3 h-3 text-black" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${task.completed ? 'text-gray-600 line-through' : 'text-white'}`}>
                  {task.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{task.hours}h</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No tasks for today</p>
          <p className="text-gray-600 text-xs mt-1">Schedule tasks to see them here</p>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ 
  analytics, 
  notebooks = [], 
  onSearch, 
  onSelectNotebook,
  onSyncWebCaptures,
  isSyncing = false,
  lastSyncTime
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');
  const scrollContainerRef = useRef(null);
  const lenisRef = useRef(null);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    if (scrollContainerRef.current) {
      lenisRef.current = new Lenis({
        wrapper: scrollContainerRef.current,
        content: scrollContainerRef.current,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });

      function raf(time) {
        lenisRef.current?.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);

      return () => {
        lenisRef.current?.destroy();
      };
    }
  }, []);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const recentNotebooks = getRecentNotebooks(notebooks, 5);
  const favoriteNotebooks = getFavoriteNotebooks(notebooks);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className="w-80 h-screen bg-transparent border-r border-[rgba(255,255,255,0.1)] flex flex-col fixed left-0 top-0 z-30"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.1)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-white" />
          <h2 className="text-white font-semibold text-base">Quick Tools</h2>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.1)] flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search everywhere..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1C1C1E] border border-[rgba(255,255,255,0.1)] rounded-full text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[rgba(255,255,255,0.2)] transition-all"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.1)] flex-shrink-0">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1C1C1E] rounded-2xl p-3 text-center border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all cursor-pointer" title="Notebooks">
            <div className="text-2xl font-bold text-white mb-1">{analytics?.notebookCount || 0}</div>
            <div className="text-xs text-gray-400">NB</div>
          </div>
          <div className="bg-[#1C1C1E] rounded-2xl p-3 text-center border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all cursor-pointer" title="Todo Streak">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className={`w-5 h-5 ${(analytics?.streak || 0) > 0 ? 'text-orange-500' : 'text-gray-600'}`} />
              <span className="text-2xl font-bold text-white">{analytics?.streak || 0}</span>
            </div>
            <div className="text-xs text-gray-400">Streak</div>
          </div>
          <div className="bg-[#1C1C1E] rounded-2xl p-3 text-center border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all cursor-pointer" title="Storage Used">
            <div className="text-lg font-bold text-white mb-1">{(analytics?.storageMb || 0).toFixed(1)}</div>
            <div className="text-xs text-gray-400">MB</div>
          </div>
        </div>
        
        {/* Web Captures Row with Sync Button */}
        <div className="mt-3">
          <div className="bg-[#1C1C1E] rounded-2xl p-3 border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all" title="Web Captures">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Web Clips</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{analytics?.webCaptures || 0}</span>
                <button
                  onClick={onSyncWebCaptures}
                  disabled={isSyncing}
                  className={`p-1.5 rounded-lg transition-all ${
                    isSyncing 
                      ? 'bg-gray-700 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  title={isSyncing ? 'Syncing...' : 'Sync web captures from extension'}
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-white ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            {lastSyncTime && (
              <div className="mt-1 text-[10px] text-gray-500">
                Last synced: {lastSyncTime.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation - Horizontal */}
      <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.1)] flex gap-2 flex-shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
          }`}
        >
          <TrendingUp className="w-4 h-4 flex-shrink-0" />
          <span>Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'recent'
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
          }`}
        >
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>Recent</span>
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'favorites'
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
          }`}
        >
          <Star className="w-4 h-4 flex-shrink-0" />
          <span>Favorites</span>
        </button>
      </div>

      {/* Scrollable Content - Lenis Smooth Scroll with Stacking */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 pb-8"
        style={{ 
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {activeTab === 'analytics' && (
          <div className="space-y-3">
            {/* Row 1: Today's Tasks - Full Width */}
            <div className="animate-fadeIn" style={{ animationDelay: '0ms' }}>
              <TodayTasksWidget />
            </div>

            {/* Row 2: Productivity Score - Full Width, Prominent */}
            <div className="animate-fadeIn" style={{ animationDelay: '100ms' }}>
              <ProductivityScoreWidget />
            </div>

            {/* Row 3: Smart Focus Time - Full Width */}
            <div className="animate-fadeIn" style={{ animationDelay: '200ms' }}>
              <SmartFocusWidget />
            </div>

            {/* Row 4: Quick Overview - Compact Stats */}
            <div className="animate-fadeIn" style={{ animationDelay: '300ms' }}>
              <div className="bg-[#1C1C1E] rounded-xl p-3 border border-[rgba(255,255,255,0.1)]">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-[#0A0A0A] rounded-lg">
                    <div className="text-lg font-bold text-white">{analytics?.notebookCount || 0}</div>
                    <div className="text-xs text-gray-400">Notebooks</div>
                  </div>
                  <div className="text-center p-2 bg-[#0A0A0A] rounded-lg">
                    <div className="text-lg font-bold text-white">{(analytics?.content?.totalWords || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Words</div>
                  </div>
                  <div className="text-center p-2 bg-[#0A0A0A] rounded-lg">
                    <div className="text-lg font-bold text-white">{analytics?.streak || 0}</div>
                    <div className="text-xs text-gray-400">Streak</div>
                  </div>
                  <div className="text-center p-2 bg-[#0A0A0A] rounded-lg">
                    <div className="text-lg font-bold text-white">{analytics?.webCaptures || 0}</div>
                    <div className="text-xs text-gray-400">Clips</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 5: Upcoming Deadlines */}
            <div className="animate-fadeIn" style={{ animationDelay: '400ms' }}>
              <UpcomingDeadlinesWidget />
            </div>

            {/* Row 6: Weekly Momentum */}
            <div className="animate-fadeIn" style={{ animationDelay: '500ms' }}>
              <WeeklyMomentumWidget />
            </div>

            {/* Row 7: Achievement Badges */}
            <div className="animate-fadeIn" style={{ animationDelay: '600ms' }}>
              <AchievementBadgesWidget />
            </div>

            {/* Row 8: Learning Progress */}
            <div className="animate-fadeIn" style={{ animationDelay: '700ms' }}>
              <LearningProgressWidget />
            </div>

            {/* Row 9: Quick Actions - Bottom */}
            <div className="animate-fadeIn" style={{ animationDelay: '800ms' }}>
              <QuickActionsWidget />
            </div>
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="space-y-3">
            {recentNotebooks.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-white" />
                  <h3 className="text-white font-medium text-sm">Recently Accessed</h3>
                </div>
                {recentNotebooks.map((notebook) => (
                  <div
                    key={notebook.id}
                    onClick={() => onSelectNotebook && onSelectNotebook(notebook)}
                    className="bg-[#1C1C1E] rounded-xl p-3 border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#262626] flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm truncate">{notebook.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{formatTimeAgo(notebook.lastAccessed)}</span>
                          <span className="text-xs text-gray-600">•</span>
                          <span className="text-xs text-gray-500">{notebook.wordCount.toLocaleString()} words</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="bg-[#1C1C1E] rounded-2xl p-8 border border-[rgba(255,255,255,0.1)] text-center">
                <Clock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No recent notebooks</p>
                <p className="text-gray-600 text-xs mt-1">Open a notebook to see it here</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="space-y-3">
            {favoriteNotebooks.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <h3 className="text-white font-medium text-sm">Favorite Notebooks</h3>
                </div>
                {favoriteNotebooks.map((notebook) => (
                  <div
                    key={notebook.id}
                    onClick={() => onSelectNotebook && onSelectNotebook(notebook)}
                    className="bg-[#1C1C1E] rounded-xl p-3 border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#262626] flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-medium text-sm truncate flex-1">{notebook.name}</h4>
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{notebook.wordCount.toLocaleString()} words</span>
                          <span className="text-xs text-gray-600">•</span>
                          <span className="text-xs text-gray-500">Modified {formatTimeAgo(notebook.lastModified)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="bg-[#1C1C1E] rounded-2xl p-8 border border-[rgba(255,255,255,0.1)] text-center">
                <Star className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No favorite notebooks</p>
                <p className="text-gray-600 text-xs mt-1">Star notebooks to add them here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
