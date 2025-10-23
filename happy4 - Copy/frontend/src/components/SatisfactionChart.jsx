import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const SatisfactionChart = ({ entries }) => {
  const [animatedHeights, setAnimatedHeights] = useState({});
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const weeksScrollRef = useRef(null);
  
  const satisfactionEntries = entries.filter(entry => entry.satisfaction);
  const avgSatisfaction = satisfactionEntries.length > 0 
    ? satisfactionEntries.reduce((sum, entry) => sum + entry.satisfaction, 0) / satisfactionEntries.length
    : 0;

  // Get last 30 days of satisfaction data
  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const entry = entries.find(e => e.date === dateStr);
      days.push({
        date: dateStr,
        satisfaction: entry?.satisfaction || 0,
        hasEntry: !!entry?.satisfaction,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return days;
  };

  const last30Days = getLast30Days();
  const maxSatisfaction = 10;

  // Points for SVG line (0-100 viewBox)
  const xStep = 100 / Math.max(1, last30Days.length - 1);
  const points = last30Days.map((day, idx) => ({
    x: idx * xStep,
    y: 100 - ((day.satisfaction || 0) / maxSatisfaction) * 100, // top-based for SVG
    display: day.displayDate,
    satisfaction: day.satisfaction || 0,
    hasEntry: day.hasEntry
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  // Animated bar heights
  useEffect(() => {
    const heights = {};
    last30Days.forEach((day, index) => {
      const height = day.hasEntry ? (day.satisfaction / maxSatisfaction) * 100 : 0;
      setTimeout(() => {
        setAnimatedHeights(prev => ({
          ...prev,
          [index]: height
        }));
      }, index * 50); // Stagger animation
    });
  }, [entries]);

  // Weekly data (12 weeks), Monday-start
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 Sun ... 6 Sat
    const diff = (day === 0 ? -6 : 1) - day; // Monday as start
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getWeeksData = (weeksCount = 12) => {
    const weeks = [];
    const startThisWeek = getStartOfWeek(new Date());
    for (let i = weeksCount - 1; i >= 0; i--) {
      const start = new Date(startThisWeek);
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const days = [];
      for (let d = 0; d < 7; d++) {
        const curr = new Date(start);
        curr.setDate(start.getDate() + d);
        const dateStr = curr.toISOString().split('T')[0];
        const entry = entries.find(e => e.date === dateStr);
        days.push({
          date: dateStr,
          satisfaction: entry?.satisfaction || 0,
          hasEntry: !!entry?.satisfaction,
          display: curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
      weeks.push({
        start,
        end,
        label: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        days
      });
    }
    return weeks;
  };

  const weeks = getWeeksData(12);

  // Build a continuous 12-week day array (no cards)
  const getContinuousDays = (weeksCount = 12) => {
    const list = [];
    const startThisWeek = getStartOfWeek(new Date());
    const earliest = new Date(startThisWeek);
    earliest.setDate(earliest.getDate() - (weeksCount - 1) * 7);
    for (let i = 0; i < weeksCount * 7; i++) {
      const d = new Date(earliest);
      d.setDate(earliest.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = entries.find(e => e.date === dateStr);
      list.push({
        date: dateStr,
        satisfaction: entry?.satisfaction || 0,
        hasEntry: !!entry?.satisfaction,
        display: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return list;
  };

  const continuousDays = getContinuousDays(12);
  const dayStepPx = 36; // horizontal spacing between days

  // Smooth path (Catmull-Rom to Bezier)
  const getSmoothPath = (pts, tension = 0.4) => {
    if (!pts || pts.length < 2) return '';
    const path = [`M ${pts[0].x} ${pts[0].y}`];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) * tension / 6;
      const cp1y = p1.y + (p2.y - p0.y) * tension / 6;
      const cp2x = p2.x - (p3.x - p1.x) * tension / 6;
      const cp2y = p2.y - (p3.y - p1.y) * tension / 6;
      path.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
    }
    return path.join(' ');
  };

  // Now that getSmoothPath is defined, compute the continuous series path
  const pointsAll = continuousDays.map((d, i) => ({
    x: i * dayStepPx,
    y: 100 - ((d.satisfaction || 0) / maxSatisfaction) * 100,
    has: d.hasEntry,
    display: d.display,
    satisfaction: d.satisfaction || 0,
  }));
  const svgWidth = Math.max(100, (continuousDays.length - 1) * dayStepPx);
  const pathAll = getSmoothPath(pointsAll);
  const areaAll = `${pathAll} L ${svgWidth} 100 L 0 100 Z`;

  // Auto-center to current week (center around last 7 days block)
  useEffect(() => {
    const container = weeksScrollRef.current;
    if (!container) return;
    const startIdxOfCurrentWeek = (continuousDays.length - 7);
    const targetCenterX = (startIdxOfCurrentWeek + 3) * dayStepPx; // middle of week
    const left = Math.max(0, targetCenterX - container.clientWidth / 2);
    container.scrollTo({ left, behavior: 'smooth' });
  }, [entries]);

  const scrollWeeks = (dir) => {
    const container = weeksScrollRef.current;
    if (!container) return;
    const step = Math.max(360, container.clientWidth * 0.8);
    container.scrollBy({ left: dir === 'right' ? step : -step, behavior: 'smooth' });
  };

  // Count high, medium, low days
  const highDays = satisfactionEntries.filter(e => e.satisfaction >= 8).length;
  const mediumDays = satisfactionEntries.filter(e => e.satisfaction >= 5 && e.satisfaction < 8).length;
  const lowDays = satisfactionEntries.filter(e => e.satisfaction < 5).length;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="h-4 w-4 text-primary">📈</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground">Satisfaction Trends</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">~{avgSatisfaction.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">Average</div>
        </div>
      </div>

      {/* Weekly, scrollable line chart (continuous) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-foreground">Weekly Satisfaction (12w)</div>
          <div className="flex gap-2">
            <button onClick={() => scrollWeeks('left')} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => scrollWeeks('right')} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div 
          id="satisfaction-weeks-scroll"
          ref={weeksScrollRef}
          className="overflow-x-auto pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`
            #satisfaction-weeks-scroll::-webkit-scrollbar{display:none}
            @keyframes dotPop{0%{transform:scale(0);opacity:.0}70%{opacity:1}100%{transform:scale(1)}}
            @keyframes dotPulse{0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,.35)}50%{box-shadow:0 0 0 10px rgba(59,130,246,0)}}
            @keyframes lineDraw{to{stroke-dashoffset:0}}
          `}</style>
          <div className="relative min-w-max px-1">
            {/* background grid */}
            <div className="absolute inset-0 pointer-events-none">
              {[0,20,40,60,80,100].map(p => (
                <div key={`h-${p}`} className="absolute w-full border-t border-border/30" style={{ bottom: `${p}%` }} />
              ))}
              {/* week separators */}
              {Array.from({ length: 13 }).map((_, i) => (
                <div key={`v-${i}`} className="absolute h-full border-l border-border/20" style={{ left: `${(i*7*dayStepPx)}px` }} />
              ))}
            </div>

            {/* single large svg */}
            <div className="h-40" style={{ width: `${svgWidth}px` }}>
              <svg viewBox={`0 0 ${svgWidth} 100`} preserveAspectRatio="none" className="w-full h-full">
                <defs>
                  <linearGradient id="satAreaBlueAll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={areaAll} fill="url(#satAreaBlueAll)" />
                <path d={pathAll} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" style={{ strokeDasharray: svgWidth*2, strokeDashoffset: svgWidth*2, animation: `lineDraw 1200ms ease-out 100ms forwards` }} />
              </svg>
              {/* dots */}
              {pointsAll.map((p, i) => {
                const bottomPct = Math.min(94, Math.max(6, 100 - p.y));
                return (
                <div key={`pt-${i}`} className="absolute" style={{ left: `${p.x}px`, bottom: `${bottomPct}%`, transform: 'translate(-50%, 60%)' }} title={`${continuousDays[i].display}: ${continuousDays[i].satisfaction || 0}/10`}>
                  <div
                    className={`relative h-2.5 w-2.5 rounded-full ${p.has ? 'bg-blue-400' : 'bg-gray-500/40'} border ${p.has ? 'border-blue-300' : 'border-gray-400/30'}`}
                    style={{ animation: `dotPop 420ms ${i*40}ms ease-out forwards, dotPulse 2.2s ${i*40}ms ease-in-out infinite` }}
                  >
                    <span className="absolute inset-0 rounded-full" style={{ boxShadow: p.has ? '0 0 10px rgba(59,130,246,0.45)' : 'none' }} />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                    </span>
                  </div>
                </div>
              );})}
            </div>
          </div>
        </div>
      </div>

      {/* This Week Summary */}
      <div>
        <div className="text-sm font-medium text-foreground mb-3">This Week</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-400">{highDays}</div>
            <div className="text-xs text-green-300">High Days (8-10)</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-yellow-400">{mediumDays}</div>
            <div className="text-xs text-yellow-300">Medium Days (5-7)</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-red-400">{lowDays}</div>
            <div className="text-xs text-red-300">Low Days (1-4)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
