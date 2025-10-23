import { useState, useEffect } from 'react';
import { Save, Heart, Smile, Meh, Frown, ChevronDown } from 'lucide-react';

const MOODS = {
  great: { icon: Smile, color: "text-green-500", label: "Great" },
  good: { icon: Smile, color: "text-blue-500", label: "Good" },
  okay: { icon: Meh, color: "text-yellow-500", label: "Okay" },
  bad: { icon: Frown, color: "text-red-500", label: "Bad" }
};

export const SimpleCard = ({ entry, onSave, onToggleFavorite, isEditable }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(entry.content || "");
  const [mood, setMood] = useState(entry.mood || null);

  // Update local state when entry prop changes
  useEffect(() => {
    setContent(entry.content || "");
    setMood(entry.mood || null);
  }, [entry.content, entry.mood, entry.id]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleSave = () => {
    if (!content.trim()) {
      return; // Silently ignore empty saves
    }

    const savedEntry = {
      id: entry.id.startsWith('empty-') ? Date.now().toString() : entry.id,
      date: entry.date,
      content: content,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      mood: mood,
      tags: entry.tags || [],
      satisfaction: entry.satisfaction || null,
      isFavorite: entry.isFavorite || false,
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('💾 Saving:', savedEntry);
    onSave(savedEntry);
    // No alert - silent save
  };

  const MoodIcon = mood ? MOODS[mood].icon : null;
  const moodColor = mood ? MOODS[mood].color : "";
  const isToday = entry.date === new Date().toISOString().split('T')[0];

  return (
    <div className="w-full animate-fade-in mb-4">
      <div className="overflow-hidden border border-border hover:border-border/80 shadow-2xl bg-card rounded-2xl relative">
        {/* Favorite Heart - Instant tap, pink when favorited */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(entry.id);
          }}
          className={`absolute top-2 right-2 p-2 rounded-full transition-transform hover:scale-110 active:scale-95 z-50 ${
            entry.isFavorite 
              ? 'text-pink-500' 
              : 'text-muted-foreground hover:text-pink-400'
          }`}
        >
          <Heart className={`h-6 w-6 ${entry.isFavorite ? 'fill-pink-500' : ''}`} />
        </button>

        {/* Card Header - Clickable */}
        <div 
          className="cursor-pointer hover:bg-secondary/20 transition-colors py-6 px-6 pr-16"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {MoodIcon && (
                <div className={`mt-1 ${moodColor}`}>
                  <MoodIcon className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {entry.isFavorite && (
                    <div className="flex items-center gap-1 bg-pink-500/10 border border-pink-500/30 text-pink-500 text-xs px-2 py-1 rounded-full">
                      <Heart className="h-3 w-3 fill-pink-500" />
                      <span className="font-medium">Favorite</span>
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-foreground">
                    {formatDate(entry.date)}
                  </h3>
                  {isToday && (
                    <span className="bg-primary/20 text-primary border border-primary/40 text-xs px-2 py-1 rounded-full">
                      Today
                    </span>
                  )}
                  {!isEditable && (
                    <span className="bg-muted/30 text-muted-foreground border border-muted/50 text-xs px-2 py-1 rounded-full">
                      🔒 Read Only
                    </span>
                  )}
                </div>
                {!isOpen && (
                  <p className="text-base text-muted-foreground line-clamp-2">
                    {content || <span className="italic text-muted-foreground/60">No entry - click to add</span>}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {content.split(/\s+/).filter(Boolean).length} words
              </span>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>

        {/* Card Content - Expanded */}
        {isOpen && (
          <div className="pt-0 pb-6 px-6 animate-fade-in">
            {isEditable ? (
              /* EDITABLE */
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    ✏️ Your thoughts for {formatDate(entry.date)}
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[200px] bg-background border-2 border-border rounded-lg p-4 text-foreground w-full focus:border-primary focus:outline-none resize-none"
                    placeholder="Write your thoughts..."
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    😊 How are you feeling?
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(MOODS).map(([moodKey, { icon: Icon, color, label }]) => (
                      <button
                        key={moodKey}
                        type="button"
                        onClick={() => setMood(moodKey)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border ${
                          mood === moodKey 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${color}`} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                  >
                    <Save className="h-4 w-4" />
                    Save Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* READ-ONLY */
              <div className="space-y-4">
                <div className="bg-muted/20 border border-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🔒</span>
                    <h4 className="text-lg font-semibold text-muted-foreground">Read-Only Entry</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    This entry is from more than 2 days ago and cannot be edited.
                  </p>
                  
                  <div className="bg-background/50 border border-border/30 rounded-lg p-4 mb-4">
                    <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                      {content || <span className="text-muted-foreground italic">No content</span>}
                    </p>
                  </div>
                  
                  {mood && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm font-medium text-foreground">Mood:</span>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/50 ${moodColor}`}>
                        <MoodIcon className="h-4 w-4" />
                        <span className="text-sm">{MOODS[mood]?.label}</span>
                      </div>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
