import { useEffect, useState } from "react";
import { Smile, Meh, Frown } from "lucide-react";

const MOODS = {
  great: { icon: Smile, color: "text-green-500", label: "Great", bgColor: "bg-green-500" },
  good: { icon: Smile, color: "text-blue-500", label: "Good", bgColor: "bg-blue-500" },
  okay: { icon: Meh, color: "text-yellow-500", label: "Okay", bgColor: "bg-yellow-500" },
  bad: { icon: Frown, color: "text-red-500", label: "Bad", bgColor: "bg-red-500" }
};

export const MoodChart = ({ entries }) => {
  const [animatedWidths, setAnimatedWidths] = useState({});
  
  const moodCounts = entries.reduce((acc, entry) => {
    if (entry.mood) {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    }
    return acc;
  }, {});

  const totalEntries = Object.values(moodCounts).reduce((sum, count) => sum + count, 0);
  const maxCount = Math.max(...Object.values(moodCounts), 1);
  
  // Calculate satisfaction scores on a 1–5 scale (Great=5, Good=4, Okay=3, Bad=1)
  const moodScores = { great: 5, good: 4, okay: 3, bad: 1 };
  const totalScore = entries.reduce((sum, entry) => {
    return sum + (entry.mood ? moodScores[entry.mood] : 0);
  }, 0);
  const overallAverage = totalEntries > 0 ? (totalScore / totalEntries).toFixed(1) : 0;
  
  // Calculate this month's average
  const now = new Date();
  const thisMonthEntries = entries.filter(e => {
    const entryDate = new Date(e.date);
    return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear() && e.mood;
  });
  const monthScore = thisMonthEntries.reduce((sum, e) => sum + moodScores[e.mood], 0);
  const monthAverage = thisMonthEntries.length > 0 ? (monthScore / thisMonthEntries.length).toFixed(1) : 0;
  
  // Calculate this week's average
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekEntries = entries.filter(e => {
    const entryDate = new Date(e.date);
    return entryDate >= weekAgo && e.mood;
  });
  const weekScore = thisWeekEntries.reduce((sum, e) => sum + moodScores[e.mood], 0);
  const weekAverage = thisWeekEntries.length > 0 ? (weekScore / thisWeekEntries.length).toFixed(1) : 0;

  // Animated bar widths
  useEffect(() => {
    Object.keys(MOODS).forEach((moodKey, index) => {
      const count = moodCounts[moodKey] || 0;
      const barWidth = (count / maxCount) * 100;
      
      setTimeout(() => {
        setAnimatedWidths(prev => ({
          ...prev,
          [moodKey]: barWidth
        }));
      }, index * 200); // Stagger animation
    });
  }, [entries, moodCounts, maxCount]);

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="h-4 w-4 text-primary">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground">Satisfaction Analytics</h3>
        </div>
        
        {/* Satisfaction Averages */}
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">This Week</div>
            <div className="text-lg font-bold text-primary">{weekAverage}/5</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">This Month</div>
            <div className="text-lg font-bold text-primary">{monthAverage}/5</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Overall</div>
            <div className="text-lg font-bold text-primary">{overallAverage}/5</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {Object.entries(MOODS).map(([moodKey, { icon: Icon, color, label, bgColor }]) => {
          const count = moodCounts[moodKey] || 0;
          const percentage = totalEntries > 0 ? (count / totalEntries) * 100 : 0;
          const animatedWidth = animatedWidths[moodKey] || 0;
          
          return (
            <div key={moodKey} className="flex items-center gap-4 group hover:bg-secondary/10 p-2 rounded-lg transition-all">
              <div className="flex items-center gap-2 w-20">
                <Icon className={`h-4 w-4 ${color} group-hover:scale-110 transition-transform`} />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
              <div className="flex-1 relative">
                <div className="h-8 bg-secondary/50 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full ${bgColor} transition-all duration-700 ease-out rounded-full shadow-sm`}
                    style={{ width: `${animatedWidth}%` }}
                  >
                    {/* Shine effect */}
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  </div>
                </div>
                {/* Progress indicator */}
                {count > 0 && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {count}
                  </div>
                )}
              </div>
              <div className="text-right w-20">
                <div className="text-sm font-semibold text-foreground">{count} entries</div>
                <div className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {totalEntries === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No mood data available</p>
        </div>
      )}
    </div>
  );
};
