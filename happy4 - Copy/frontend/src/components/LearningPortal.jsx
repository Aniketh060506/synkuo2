import { useState, useMemo, useEffect } from "react";
import { 
  Calendar, ChevronDown, Edit2, Save, Flame, Search, Tag, 
  Heart, TrendingUp, Filter, Star, Sparkles, Book, Smile,
  Meh, Frown, X, Plus, Download, BarChart3, Award, Target, Smartphone,
  ArrowUpDown, CalendarRange, Clock, SlidersHorizontal
} from "lucide-react";
import { NewEntryCard } from "./NewEntryCard";
import { DailyTimeline } from "./DailyTimeline";
import { MoodChart } from "./MoodChart";
import { SatisfactionChart } from "./SatisfactionChart";
import { SimpleCard } from "./SimpleCard";
import { saveLearningEntries, loadLearningEntries, saveLearningAnalytics } from "../utils/learningStorage";

const MOODS = {
  great: { icon: Smile, color: "text-green-500", label: "Great" },
  good: { icon: Smile, color: "text-blue-500", label: "Good" },
  okay: { icon: Meh, color: "text-yellow-500", label: "Okay" },
  bad: { icon: Frown, color: "text-red-500", label: "Bad" }
};

const DAILY_PROMPTS = [
  "What made you smile today?",
  "What are you grateful for?",
  "What challenge did you overcome?",
  "What did you learn today?",
  "What's your biggest goal right now?"
];

export default function LearningPortal() {
  // Initialize with localStorage only - no hardcoded data
  const [entries, setEntries] = useState(() => {
    const savedEntries = loadLearningEntries();
    return savedEntries || [];
  });
  
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState([]);
  const [editMood, setEditMood] = useState();
  const [editSatisfaction, setEditSatisfaction] = useState();
  const [newTag, setNewTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMood, setFilterMood] = useState(null);
  const [filterTag, setFilterTag] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showFavoritesPopup, setShowFavoritesPopup] = useState(false);
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [showSatisfactionPopup, setShowSatisfactionPopup] = useState(false);
  
  // Calculate current streak function
  const calculateStreak = () => {
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let currentStreak = 0;
    let checkDate = new Date();
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].date);
      const daysDiff = Math.floor((checkDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === currentStreak) {
        currentStreak++;
        checkDate = entryDate;
      } else if (daysDiff > currentStreak) {
        break;
      }
    }
    return currentStreak;
  };
  
  // Calculate best streak ever
  const calculateBestStreak = () => {
    if (entries.length === 0) return { count: 0, startDate: null, endDate: null };
    
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let bestStreak = 0;
    let currentStreakCount = 1;
    let bestStartDate = sortedEntries[0].date;
    let bestEndDate = sortedEntries[0].date;
    let currentStartDate = sortedEntries[0].date;
    
    for (let i = 1; i < sortedEntries.length; i++) {
      const prevDate = new Date(sortedEntries[i - 1].date);
      const currDate = new Date(sortedEntries[i].date);
      const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day
        currentStreakCount++;
      } else {
        // Streak broken
        if (currentStreakCount > bestStreak) {
          bestStreak = currentStreakCount;
          bestStartDate = currentStartDate;
          bestEndDate = sortedEntries[i - 1].date;
        }
        currentStreakCount = 1;
        currentStartDate = sortedEntries[i].date;
      }
    }
    
    // Check last streak
    if (currentStreakCount > bestStreak) {
      bestStreak = currentStreakCount;
      bestStartDate = currentStartDate;
      bestEndDate = sortedEntries[sortedEntries.length - 1].date;
    }
    
    return { count: bestStreak, startDate: bestStartDate, endDate: bestEndDate };
  };
  
  const streak = calculateStreak();
  const bestStreak = calculateBestStreak();
  const totalEntries = entries.length;
  const thisMonth = entries.filter(e => {
    const entryDate = new Date(e.date);
    const now = new Date();
    return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
  }).length;
  const favoriteCount = entries.filter(e => e.isFavorite).length;
  const avgSatisfaction = entries.length > 0 
    ? entries.filter(e => e.satisfaction).reduce((sum, e) => sum + (e.satisfaction || 0), 0) / entries.filter(e => e.satisfaction).length
    : 0;

  // Save to localStorage whenever entries change  
  useEffect(() => {
    if (entries.length > 0) {
      saveLearningEntries(entries);
      
      // Also save analytics data
      const analyticsData = {
        streak,
        totalEntries,
        thisMonth,
        favoriteCount,
        avgSatisfaction
      };
      saveLearningAnalytics(analyticsData);
    }
  }, [entries, streak, totalEntries, thisMonth, favoriteCount, avgSatisfaction]);

  // AI Suggestions based on previous days data
  const generateSmartPrompt = () => {
    if (entries.length === 0) return DAILY_PROMPTS[0];
    
    const recentEntries = entries.slice(0, 7); // Last 7 days
    const commonTags = {};
    const moods = {};
    let avgSat = 0;
    
    recentEntries.forEach(entry => {
      // Count tags
      entry.tags?.forEach(tag => {
        commonTags[tag] = (commonTags[tag] || 0) + 1;
      });
      
      // Count moods
      if (entry.mood) {
        moods[entry.mood] = (moods[entry.mood] || 0) + 1;
      }
      
      // Sum satisfaction
      if (entry.satisfaction) {
        avgSat += entry.satisfaction;
      }
    });
    
    avgSat = avgSat / recentEntries.filter(e => e.satisfaction).length || 0;
    
    // Generate contextual prompts based on patterns
    const topTag = Object.keys(commonTags).sort((a, b) => commonTags[b] - commonTags[a])[0];
    const topMood = Object.keys(moods).sort((a, b) => moods[b] - moods[a])[0];
    
    const contextualPrompts = [
      topTag ? `How did ${topTag} impact you today?` : "What was the highlight of your day?",
      avgSat < 6 ? "What could make tomorrow better?" : "What are you most proud of today?",
      topMood === 'great' ? "What made today so special?" : "What challenged you today?",
      `Reflecting on your recent ${topTag || 'experiences'}, what did you learn?`,
      "What patterns do you notice in your recent entries?"
    ];
    
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return contextualPrompts[dayOfYear % contextualPrompts.length] || DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
  };

  const dailyPrompt = useMemo(() => {
    return generateSmartPrompt();
  }, [entries]);

  const todayDate = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === todayDate);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set();
    entries.forEach(e => e.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  }, [entries]);

  // Create or update today's journal entry from NewEntryCard
  const createNewEntry = (data) => {
    const todayDateStr = new Date().toISOString().split('T')[0];
    const existingTodayEntry = entries.find(e => e.date === todayDateStr && !e.id.startsWith('empty-'));
    
    console.log('📝 createNewEntry called:', { data, existingTodayEntry });
    
    if (existingTodayEntry) {
      // APPEND to existing today's entry
      const updatedEntry = {
        ...existingTodayEntry,
        content: existingTodayEntry.content 
          ? `${existingTodayEntry.content}\n\n${data.content}` // Append with line breaks
          : data.content,
        wordCount: (existingTodayEntry.content + '\n\n' + data.content).split(/\s+/).filter(Boolean).length,
        tags: [...new Set([...(existingTodayEntry.tags || []), ...(data.tags || [])])], // Merge tags
        mood: data.mood || existingTodayEntry.mood,
        satisfaction: data.satisfaction || existingTodayEntry.satisfaction,
        prompt: data.prompt || existingTodayEntry.prompt,
        updatedAt: new Date().toISOString()
      };
      
      console.log('✨ Appending to existing entry:', updatedEntry);
      
      setEntries(prev => {
        const updated = prev.map(e => e.date === todayDateStr ? updatedEntry : e);
        // Save to localStorage
        const realEntries = updated.filter(e => !e.id.startsWith('empty-'));
        saveLearningEntries(realEntries);
        console.log('✅ Saved to localStorage:', realEntries.length, 'entries');
        return updated;
      });
    } else {
      // Create new entry for today
      const newEntry = {
        id: Date.now().toString(),
        date: todayDateStr,
        content: data.content,
        wordCount: data.content.split(/\s+/).filter(Boolean).length,
        tags: data.tags || [],
        mood: data.mood,
        satisfaction: data.satisfaction,
        isFavorite: false,
        prompt: data.prompt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('✨ Creating new entry:', newEntry);
      
      setEntries(prev => {
        const updated = [newEntry, ...prev.filter(e => e.date !== todayDateStr)];
        // Save to localStorage
        const realEntries = updated.filter(e => !e.id.startsWith('empty-'));
        saveLearningEntries(realEntries);
        console.log('✅ Saved to localStorage:', realEntries.length, 'entries');
        return updated;
      });
    }
  };

  // SIMPLE SAVE FUNCTION
  const saveEntry = (entryData) => {
    console.log('💾 Saving entry:', entryData);
    
    setEntries(prev => {
      // Remove old version if exists
      const filtered = prev.filter(e => e.date !== entryData.date);
      // Add new/updated entry
      const updated = [entryData, ...filtered];
      // Save to localStorage
      const realEntries = updated.filter(e => !e.id.startsWith('empty-'));
      saveLearningEntries(realEntries);
      console.log('✅ Saved to localStorage:', realEntries.length, 'entries');
      return updated;
    });
  };

  // Keep for compatibility but simplify
  const startEditing = (entry) => {
    setEditingId(entry.id);
    setEditContent(entry.content || "");
    setEditTags(entry.tags || []);
    setEditMood(entry.mood);
  };

  const addTag = () => {
    if (newTag && !editTags.includes(newTag)) {
      setEditTags([...editTags, newTag]);
      setNewTag("");
    }
  };

  const removeTag = (tag) => {
    setEditTags(editTags.filter(t => t !== tag));
  };

  const toggleFavorite = (id) => {
    setEntries(prev => {
      const updated = prev.map(e => 
        e.id === id ? { ...e, isFavorite: !e.isFavorite, updatedAt: new Date().toISOString() } : e
      );
      // Save to localStorage
      const realEntries = updated.filter(e => !e.id.startsWith('empty-'));
      saveLearningEntries(realEntries);
      return updated;
    });
  };

  // Check if date is editable (today or yesterday only)
  const isEditable = (dateStr) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    return dateStr === todayStr || dateStr === yesterdayStr;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Generate all days from today back to start of year, including empty days
  const generateYearEntries = () => {
    const yearEntries = [];
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1); // January 1st
    
    // Generate from today back to start of year
    for (let date = new Date(today); date >= startOfYear; date.setDate(date.getDate() - 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const existingEntry = entries.find(e => e.date === dateStr);
      
      if (existingEntry) {
        yearEntries.push(existingEntry);
      } else {
        // Create empty placeholder entry
        yearEntries.push({
          id: `empty-${dateStr}`,
          date: dateStr,
          content: "",
          wordCount: 0,
          tags: [],
          mood: null,
          satisfaction: null,
          isFavorite: false,
          isEmpty: true,
          createdAt: date.toISOString(),
          updatedAt: date.toISOString()
        });
      }
    }
    
    return yearEntries;
  };

  // Filter and sort entries (including empty days)
  const filteredEntries = useMemo(() => {
    let allYearEntries = generateYearEntries();
    
    // Apply filters only to entries with content (skip empty days in filtering)
    let filtered = allYearEntries.filter(entry => {
      // Always show empty days
      if (entry.isEmpty) return true;
      
      const matchesSearch = searchQuery === "" || 
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.tags && entry.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesMood = !filterMood || entry.mood === filterMood;
      const matchesTag = !filterTag || (entry.tags && entry.tags.includes(filterTag));
      
      return matchesSearch && matchesMood && matchesTag;
    });

    // Sort entries - by date only (NO favorites first)
    filtered.sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "longest") {
        return (b.wordCount || 0) - (a.wordCount || 0);
      } else if (sortBy === "shortest") {
        return (a.wordCount || 0) - (b.wordCount || 0);
      } else {
        // Default "newest" - most recent first
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return filtered;
  }, [entries, searchQuery, filterMood, filterTag, sortBy]);

  return (
    <div className="bg-transparent min-h-full">
      {/* Header */}
      <header className="border-b border-transparent bg-transparent">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
                <Book className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Daily Journal</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Your personal growth companion</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Read-Only Mode Toggle */}
              <button 
                onClick={() => setReadOnlyMode(!readOnlyMode)}
                className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  readOnlyMode ? 'bg-orange-500 text-white' : 'bg-secondary text-secondary-foreground border border-border'
                }`}
                title={readOnlyMode ? "Read-Only Mode ON" : "Read-Only Mode OFF"}
              >
                <Book className="h-4 w-4" />
                {readOnlyMode ? 'Read-Only' : 'Edit Mode'}
              </button>
              
              <button 
                onClick={() => setShowStats(!showStats)}
                className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  showStats ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground border border-border'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Stats
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4">
            <div className="group relative bg-gradient-to-br from-card to-secondary/50 rounded-2xl p-4 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-help">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Flame className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Streak</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-foreground tabular-nums">{streak}</div>
                  <span className="text-xs text-muted-foreground">current</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>📊 {totalEntries} total entries</div>
                  {bestStreak.count > 0 && (
                    <div className="flex items-center gap-1">
                      <span>🏆 Best: {bestStreak.count} days</span>
                      {bestStreak.startDate && (
                        <span className="text-xs opacity-70">
                          ({new Date(bestStreak.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(bestStreak.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="group relative bg-gradient-to-br from-card to-secondary/50 rounded-2xl p-4 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-help">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">This Month</span>
              </div>
              <div className="text-3xl font-bold text-foreground tabular-nums">{thisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to filter</p>
            </div>
            
            <div 
              className="group relative bg-gradient-to-br from-card to-secondary/50 rounded-2xl p-4 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
              onClick={() => setShowFavoritesPopup(true)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Heart className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Favorites</span>
              </div>
              <div className="text-3xl font-bold text-foreground tabular-nums">{favoriteCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to view all</p>
            </div>

            <div className="group relative bg-gradient-to-br from-card to-secondary/50 rounded-2xl p-4 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
              onClick={() => setShowSatisfactionPopup(true)}>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Satisfaction</span>
              </div>
              <div className="text-3xl font-bold text-foreground tabular-nums">
                {avgSatisfaction ? avgSatisfaction.toFixed(1) : '0.0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Average rating</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showStats ? (
          /* Analytics Section - When Stats is Open */
          <div className="space-y-6 animate-fade-in">
            <DailyTimeline entries={entries} />
            <div className="grid grid-cols-1 gap-6">
              <MoodChart entries={entries} />
            </div>
          </div>
        ) : (
          /* Cards Section - When Stats is Closed */
          <>
            {/* Search and Filters */}
            <div className="mb-6 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search entries, tags..."
                    className="w-full pl-10 pr-4 py-2 bg-card/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Filters Bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  className="flex items-center gap-1 px-3 py-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm transition-colors"
                  onClick={() => {
                    setFilterMood(null);
                    setFilterTag(null);
                    setSearchQuery("");
                  }}
                >
                  <Filter className="h-3 w-3" />
                  All
                </button>
                
                {Object.entries(MOODS).map(([mood, { icon: Icon, color }]) => (
                  <button
                    key={mood}
                    className={`flex items-center gap-1 px-3 py-1 text-sm rounded-lg transition-colors ${
                      filterMood === mood 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                    }`}
                    onClick={() => setFilterMood(filterMood === mood ? null : mood)}
                  >
                    <Icon className={`h-3 w-3 ${color}`} />
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* New Entry Card */}
            <div className="mb-6">
              <NewEntryCard onSave={createNewEntry} dailyPrompt={dailyPrompt} />
            </div>

            {/* Journal Entries - Simple Cards */}
            {filteredEntries.length > 0 ? (
              <div className="space-y-4">
                {filteredEntries.map(entry => (
                  <SimpleCard
                    key={`${entry.id}-${entry.updatedAt}`}
                    entry={entry}
                    onSave={saveEntry}
                    onToggleFavorite={toggleFavorite}
                    isEditable={isEditable(entry.date) ? true : !readOnlyMode}
                    readOnlyMode={readOnlyMode && !isEditable(entry.date)}
                  />
                ))}
              </div>
            ) : (
              <div className="border border-border/40 rounded-2xl">
                <div className="py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No entries found matching your filters</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Favorites Popup */}
      {showFavoritesPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Favorite Entries</h2>
                  <p className="text-sm text-muted-foreground">{favoriteCount} favorite entries</p>
                </div>
              </div>
              <button
                onClick={() => setShowFavoritesPopup(false)}
                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {entries.filter(e => e.isFavorite && !e.isEmpty).length > 0 ? (
                <div className="space-y-4">
                  {entries
                    .filter(e => e.isFavorite && !e.isEmpty)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((entry) => {
                      const MoodIcon = entry.mood ? MOODS[entry.mood].icon : null;
                      const moodColor = entry.mood ? MOODS[entry.mood].color : "";
                      
                      return (
                        <div key={entry.id} className="bg-secondary/30 border border-border/50 rounded-xl p-4 hover:bg-secondary/40 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {MoodIcon && (
                                <MoodIcon className={`h-5 w-5 ${moodColor}`} />
                              )}
                              <h3 className="text-lg font-semibold text-foreground">
                                {formatDate(entry.date)}
                              </h3>
                              {entry.date === todayDate && (
                                <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">Today</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {entry.satisfaction && (
                                <div className="flex items-center gap-1">
                                  <Target className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{entry.satisfaction}/10</span>
                                </div>
                              )}
                              <button
                                onClick={() => onToggleFavorite(entry.id)}
                                className="p-1 rounded-full text-pink-500 hover:text-pink-600 hover:scale-110 transition-all"
                              >
                                <Heart className="h-4 w-4 fill-pink-500" />
                              </button>
                            </div>
                          </div>
                          
                          {entry.prompt && (
                            <p className="text-sm text-muted-foreground italic mb-3">"{entry.prompt}"</p>
                          )}
                          
                          <p className="text-base text-foreground mb-3 leading-relaxed">
                            {entry.content}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2 flex-wrap">
                              {entry.tags && entry.tags.map(tag => (
                                <span key={tag} className="text-xs bg-primary/10 border border-primary/20 text-primary px-2 py-1 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {entry.wordCount || 0} words
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No favorites yet</h3>
                  <p className="text-muted-foreground">Click the heart icon on any entry to add it to your favorites</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSatisfactionPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Satisfaction Overview</h2>
                  <p className="text-sm text-muted-foreground">Average {avgSatisfaction ? avgSatisfaction.toFixed(1) : '0.0'}</p>
                </div>
              </div>
              <button onClick={() => setShowSatisfactionPopup(false)} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors" autoFocus>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-72px)] space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="flex items-center justify-center">
                  <div className="w-40 h-80 rounded-[2rem] border border-border/60 bg-gradient-to-b from-secondary/20 to-secondary/5 shadow-inner relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-2 h-6 w-28 bg-black/50 rounded-full" />
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                      <div className="text-xs text-muted-foreground">Average</div>
                      <div className="text-5xl font-bold">{avgSatisfaction ? avgSatisfaction.toFixed(1) : '0.0'}</div>
                      <div className="text-xs text-muted-foreground">/ 10</div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <SatisfactionChart entries={entries} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">All entries</div>
                <div className="divide-y divide-border/50 rounded-xl border border-border/50 overflow-hidden">
                  {entries.filter(e => e.satisfaction).sort((a,b) => new Date(b.date) - new Date(a.date)).map((e) => (
                    <div key={e.id} className="flex items-center justify-between px-4 py-3 bg-secondary/20">
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-muted-foreground w-28">{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-sm text-foreground">{e.content?.slice(0, 60) || 'No content'}</div>
                      </div>
                      <div className="text-sm font-semibold">{e.satisfaction}/10</div>
                    </div>
                  ))}
                  {entries.filter(e => e.satisfaction).length === 0 && (
                    <div className="px-4 py-6 text-sm text-muted-foreground">No satisfaction data yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
