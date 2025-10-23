import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MOOD_COLORS = {
  great: '#22c55e',  // green
  good: '#3b82f6',   // blue
  okay: '#eab308',   // yellow
  bad: '#ef4444'     // red
};

const MOOD_EMOJIS = {
  great: '😊',
  good: '🙂',
  okay: '😐',
  bad: '☹️'
};

export const DailyTimeline = ({ entries }) => {
  const [hoveredDay, setHoveredDay] = useState(null);
  
  // Generate all days: past + today + future (INFINITE SCROLL)
  const generateAllDays = () => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31); // Dec 31
    const days = [];
    
    // Generate from Jan 1 to Dec 31 (entire year)
    for (let date = new Date(startOfYear); date <= endOfYear; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      // Find entry - exclude empty placeholders
      const entry = entries.find(e => e.date === dateStr && !e.id.startsWith('empty-'));
      
      days.push({
        date: new Date(date),
        dateStr: dateStr,
        entry: entry,
        mood: entry?.mood,
        hasContent: entry && entry.content
      });
    }
    
    return days; // Chronological order (Jan 1 -> Dec 31)
  };

  const allDays = generateAllDays();
  
  console.log('📊 DailyTimeline rendering with', entries.length, 'entries');
  console.log('Real entries (non-empty):', entries.filter(e => !e.id.startsWith('empty-')).length);
  console.log('Days with mood:', allDays.filter(d => d.mood).length);
  console.log('Days with content:', allDays.filter(d => d.hasContent).length);
  
  // Debug: log ALL entries with their exact dates
  console.log('=== ALL ENTRIES WITH DATES ===');
  entries.filter(e => !e.id.startsWith('empty-')).forEach(e => {
    const entryDate = new Date(e.date + 'T00:00:00');
    console.log(`Entry Date: ${e.date} (${entryDate.toDateString()}), Mood: ${e.mood || 'NONE'}, Content: "${e.content?.substring(0, 20)}"`);
  });
  
  // Debug: log timeline days with moods
  console.log('=== TIMELINE DAYS WITH MOODS ===');
  allDays.filter(d => d.mood).forEach(d => {
    console.log(`Timeline Date: ${d.dateStr} (${d.date.toDateString()}), Mood: ${d.mood}, Entry: ${d.entry?.content?.substring(0, 20)}`);
  });
  console.log('================================');
  
  // Auto-scroll to CENTER TODAY on mount
  useEffect(() => {
    const container = document.getElementById('timeline-scroll');
    if (container) {
      // Find today's element and scroll it to center
      setTimeout(() => {
        const todayElement = container.querySelector('[data-is-today="true"]');
        if (todayElement) {
          todayElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 100);
    }
  }, []);

  const scroll = (direction) => {
    const container = document.getElementById('timeline-scroll');
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const isToday = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getMonthLabel = (date, index, allDays) => {
    // Only show month label on the first day of each month
    if (date.getDate() === 1) {
      return date.toLocaleDateString('en-US', { month: 'long' });
    }
    // Show month + year for the very first day
    if (index === 0 && date.getDate() !== 1) {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground">Daily Satisfaction Level</h3>
        
        {/* Scroll buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Clean Bar Chart - Hide scrollbar */}
      <div 
        id="timeline-scroll"
        className="overflow-x-auto pb-4 scrollbar-hide"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <style>{`
          #timeline-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="flex items-end gap-3 min-w-max px-4" style={{ minHeight: '320px' }}>
          {allDays.map((day, index) => {
            const mood = day.mood;
            const emoji = mood ? MOOD_EMOJIS[mood] : day.hasContent ? '📝' : null;
            const color = mood ? MOOD_COLORS[mood] : day.hasContent ? '#94a3b8' : '#e2e8f0';
            const today = isToday(day.dateStr);
            
            // Bar height based on mood or word count
            const getHeight = () => {
              if (mood === 'great') return 200;
              if (mood === 'good') return 150;
              if (mood === 'okay') return 100;
              if (mood === 'bad') return 60;
              if (day.hasContent) {
                const words = day.entry?.wordCount || 0;
                return Math.min(200, Math.max(40, words / 2));
              }
              return 30;
            };
            
            const height = getHeight();
            const monthLabel = getMonthLabel(day.date, index, allDays);
            
            return (
              <div 
                key={day.dateStr} 
                className="flex flex-col items-center"
                data-is-today={today ? "true" : "false"}
              >
                {/* Month label */}
                {monthLabel && (
                  <div className="absolute -top-8 text-sm font-bold text-primary">
                    {monthLabel}
                  </div>
                )}
                
                {/* Bar with emoji on top */}
                <div 
                  className="flex flex-col items-center cursor-pointer group relative"
                  onMouseEnter={() => setHoveredDay(day.dateStr)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Emoji on top of bar */}
                  {emoji && (
                    <div className={`text-2xl mb-1 transition-transform duration-300 ${
                      hoveredDay === day.dateStr ? 'scale-125' : ''
                    }`}>
                      {emoji}
                    </div>
                  )}
                  
                  {/* Vertical bar */}
                  <div 
                    className={`
                      w-14 rounded-t-lg transition-all duration-500 ease-out
                      ${hoveredDay === day.dateStr ? 'opacity-90 scale-105' : 'opacity-100'}
                      ${today ? 'ring-2 ring-primary ring-offset-2' : ''}
                    `}
                    style={{
                      height: `${height}px`,
                      backgroundColor: color
                    }}
                  >
                    {/* Hover tooltip */}
                    {hoveredDay === day.dateStr && day.entry && (
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {day.entry.wordCount || 0} words
                      </div>
                    )}
                  </div>
                  
                  {/* Date number */}
                  <div className={`text-sm font-bold mt-2 ${
                    today ? 'text-primary' : 'text-foreground'
                  }`}>
                    {parseInt(day.dateStr.split('-')[2])}
                  </div>
                  
                  {/* Day of week */}
                  <div className="text-xs text-muted-foreground">
                    {new Date(day.dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  
                  {/* Full date: Month Year */}
                  <div className="text-xs text-muted-foreground/60 font-mono">
                    {new Date(day.dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-xl">{MOOD_EMOJIS.great}</span>
          <span className="text-sm text-muted-foreground">Great</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">{MOOD_EMOJIS.good}</span>
          <span className="text-sm text-muted-foreground">Good</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">{MOOD_EMOJIS.okay}</span>
          <span className="text-sm text-muted-foreground">Okay</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">{MOOD_EMOJIS.bad}</span>
          <span className="text-sm text-muted-foreground">Bad</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">📝</span>
          <span className="text-sm text-muted-foreground">Entry</span>
        </div>
      </div>
    </div>
  );
};
