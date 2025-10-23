import { useState, useEffect } from 'react';

export const CalendarHeatmap = ({ entries }) => {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [animatedDays, setAnimatedDays] = useState(new Set());
  
  const today = new Date();
  const startDate = new Date(today.getFullYear(), 0, 1); // Start of year
  
  // Generate all days of the year
  const getDaysInYear = () => {
    const days = [];
    const current = new Date(startDate);
    
    while (current <= today) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };
  
  const yearDays = getDaysInYear();
  
  // Animate in the squares progressively
  useEffect(() => {
    yearDays.forEach((day, index) => {
      setTimeout(() => {
        setAnimatedDays(prev => new Set([...prev, day.getTime()]));
      }, index * 2); // 2ms delay between each square
    });
  }, [entries]);
  
  // Get entry count for each day
  const getIntensity = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const entry = entries.find(e => e.date === dateStr);
    
    if (!entry || !entry.content) return 0;
    
    // Base intensity on word count and satisfaction
    let intensity = 1;
    if (entry.wordCount > 50) intensity = 2;
    if (entry.wordCount > 150) intensity = 3;
    if (entry.satisfaction >= 8) intensity = Math.min(intensity + 1, 4);
    
    return intensity;
  };
  
  const getColor = (intensity) => {
    const colors = [
      'bg-secondary/30', // 0 - no entry
      'bg-gradient-to-br from-green-400/40 to-green-500/40', // 1 - light
      'bg-gradient-to-br from-green-500/60 to-green-600/60', // 2 - medium
      'bg-gradient-to-br from-green-600/80 to-green-700/80', // 3 - high
      'bg-gradient-to-br from-green-700 to-green-800' // 4 - maximum
    ];
    return colors[intensity] || colors[0];
  };
  
  const getHoverColor = (intensity) => {
    const colors = [
      'hover:bg-secondary/50', // 0 - no entry
      'hover:bg-gradient-to-br hover:from-green-400/60 hover:to-green-500/60', // 1 - light
      'hover:bg-gradient-to-br hover:from-green-500/80 hover:to-green-600/80', // 2 - medium
      'hover:bg-gradient-to-br hover:from-green-600 hover:to-green-700', // 3 - high
      'hover:bg-gradient-to-br hover:from-green-700 hover:to-green-900' // 4 - maximum
    ];
    return colors[intensity] || colors[0];
  };

  // Group days by week for proper GitHub-style layout
  const weeks = [];
  let currentWeek = [];
  
  // Start from first Sunday of the year or pad with empty cells
  const firstDay = yearDays[0];
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
  
  // Add empty cells for days before the first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }
  
  // Add all days
  yearDays.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  // Add remaining days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs">📅</span>
        <h3 className="text-sm font-semibold text-foreground">Activity Heatmap</h3>
        <span className="text-xs text-muted-foreground ml-auto">{yearDays.length} days tracked</span>
      </div>
      
      {/* Scrollable container */}
      <div className="overflow-x-auto">
        <div className="flex gap-2">
          {/* Day labels */}
          <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-5">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>
          
          {/* Weeks grid - horizontal scroll */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {/* Month label on first week of month */}
                {week[0] && week[0].getDate() <= 7 && (
                  <div className="text-xs text-muted-foreground font-medium mb-1 h-4">
                    {week[0].toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                )}
                {!week[0] || week[0].getDate() > 7 ? <div className="h-4"></div> : null}
                
                {/* Days in this week */}
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={dayIndex} className="w-3 h-3" />;
                  }
                  
                  const intensity = getIntensity(day);
                  const isAnimated = animatedDays.has(day.getTime());
                  const isToday = day.toDateString() === today.toDateString();
                  const dateStr = day.toISOString().split('T')[0];
                  const entry = entries.find(e => e.date === dateStr);
                  
                  return (
                    <div 
                      key={day.getTime()} 
                      className={`
                        w-3 h-3 rounded-sm transition-all duration-200 ease-out cursor-pointer
                        ${getColor(intensity)} ${getHoverColor(intensity)}
                        ${isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
                        ${isToday ? 'ring-2 ring-primary' : ''}
                        ${hoveredDay === day.getTime() ? 'scale-125 shadow-lg z-10 relative' : ''}
                      `}
                      onMouseEnter={() => setHoveredDay(day.getTime())}
                      onMouseLeave={() => setHoveredDay(null)}
                      title={`${day.toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}${entry ? `\n${entry.wordCount || 0} words` : '\nNo entry'}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Compact Legend */}
      <div className="flex items-center justify-between mt-3 px-1">
        <span className="text-xs text-muted-foreground">Less</span>
        <div className="flex gap-0.5">
          <div className="w-2 h-2 rounded-sm bg-secondary/30" />
          <div className="w-2 h-2 rounded-sm bg-gradient-to-br from-green-400/40 to-green-500/40" />
          <div className="w-2 h-2 rounded-sm bg-gradient-to-br from-green-500/60 to-green-600/60" />
          <div className="w-2 h-2 rounded-sm bg-gradient-to-br from-green-600/80 to-green-700/80" />
          <div className="w-2 h-2 rounded-sm bg-gradient-to-br from-green-700 to-green-800" />
        </div>
        <span className="text-xs text-muted-foreground">More</span>
      </div>
    </div>
  );
};
