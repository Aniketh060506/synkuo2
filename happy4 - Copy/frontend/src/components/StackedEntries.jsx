import { useState, useRef, useEffect } from "react";
import { 
  ChevronDown, Edit2, Save, Heart, Tag, X, Plus,
  Smile, Meh, Frown
} from "lucide-react";

const MOODS = {
  great: { icon: Smile, color: "text-green-500", label: "Great" },
  good: { icon: Smile, color: "text-blue-500", label: "Good" },
  okay: { icon: Meh, color: "text-yellow-500", label: "Okay" },
  bad: { icon: Frown, color: "text-red-500", label: "Bad" }
};

export const StackedEntries = ({
  entries,
  todayDate,
  formatDate,
  onEdit,
  onSave,
  onToggleFavorite,
  editingId,
  editContent,
  setEditContent,
  editTags,
  setEditTags,
  editMood,
  setEditMood,
  newTag,
  setNewTag,
  addTag,
  removeTag,
  cancelEdit
}) => {
  const [openCards, setOpenCards] = useState([]);
  const containerRef = useRef(null);

  // Auto-expand the first entry ONLY on initial load
  useEffect(() => {
    if (entries.length > 0 && openCards.length === 0) {
      setOpenCards([entries[0].id]);
    }
  }, []); // Empty dependency - only run once on mount

  // Check if a date is editable (today or yesterday only)
  const isEditable = (entryDate) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const entryDateObj = new Date(entryDate);
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const entryStr = entryDate;
    
    return entryStr === todayStr || entryStr === yesterdayStr;
  };

  const toggleCard = (id) => {
    setOpenCards(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => {
        const isOpen = openCards.includes(entry.id);
        const isEditing = editingId === entry.id;
        const isToday = entry.date === todayDate;
        const canEdit = isEditable(entry.date);
        const MoodIcon = entry.mood ? MOODS[entry.mood].icon : null;
        const moodColor = entry.mood ? MOODS[entry.mood].color : "";

        return (
          <div
            key={entry.id}
            className="w-full animate-fade-in"
          >
            <div className="overflow-hidden border border-border hover:border-border/80 shadow-2xl bg-card rounded-2xl relative">
              {/* Favorite Button - Large, prominent, always clickable */}
              <button
                type="button"
                onClick={(e) => {
                  console.log('Favorite button clicked for entry:', entry.id);
                  e.stopPropagation();
                  e.preventDefault();
                  if (onToggleFavorite) {
                    onToggleFavorite(entry.id);
                  } else {
                    console.error('onToggleFavorite is not defined');
                  }
                }}
                className={`absolute top-2 right-2 p-3 rounded-full transition-all duration-200 hover:scale-125 z-50 shadow-lg border-2 ${
                  entry.isFavorite 
                    ? 'text-pink-500 hover:text-pink-600 bg-pink-500/20 border-pink-500/50 shadow-pink-500/20' 
                    : 'text-gray-400 hover:text-pink-500 bg-white/80 border-gray-300 hover:bg-pink-50 hover:border-pink-300'
                }`}
                style={{ zIndex: 1000 }}
                title={entry.isFavorite ? "❤️ Remove from favorites" : "🤍 Add to favorites"}
              >
                <Heart 
                  className={`h-5 w-5 transition-all duration-200 ${
                    entry.isFavorite ? 'fill-pink-500 stroke-pink-500' : 'stroke-2'
                  }`} 
                />
              </button>

              <div 
                className="cursor-pointer hover:bg-secondary/20 transition-colors py-6 px-6 pr-16"
                onClick={() => {
                  toggleCard(entry.id);
                  if (!isEditing) {
                    onEdit(entry);
                  }
                }}
              >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {MoodIcon && (
                        <div className={`mt-1 ${moodColor}`}>
                          <MoodIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex-1 text-left">
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
                          {!canEdit && (
                            <span className="bg-muted/30 text-muted-foreground border border-muted/50 text-xs px-2 py-1 rounded-full">
                              🔒 Read Only
                            </span>
                          )}
                        </div>
                        {entry.prompt && (
                          <p className="text-sm text-muted-foreground italic mb-3">
                            "{entry.prompt}"
                          </p>
                        )}
                        {!isOpen && (
                          <p className="text-base text-muted-foreground line-clamp-2 mb-3">
                            {entry.isEmpty ? 
                              <span className="italic text-muted-foreground/60">No entry for this day - click to add</span> : 
                              entry.content
                            }
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {entry.tags && entry.tags.map(tag => (
                            <span key={tag} className="text-xs bg-secondary border border-border text-secondary-foreground px-2 py-1 rounded-full flex items-center gap-1">
                              <Tag className="h-2 w-2" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {entry.isEmpty ? "0 words" : `${entry.wordCount || 0} words`}
                      </span>
                      <ChevronDown 
                        className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </div>

              {isOpen && (
                <div className="pt-0 pb-6 px-6 animate-fade-in">
                  {canEdit ? (
                    /* EDITABLE - Only for Today and Yesterday */
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          ✏️ Your thoughts for {formatDate(entry.date)}
                        </label>
                        <textarea
                          id={`textarea-${entry.id}`}
                          defaultValue={entry.content || ""}
                          className="min-h-[200px] bg-background border-2 border-border rounded-lg p-4 text-foreground w-full focus:border-primary focus:outline-none resize-none"
                          placeholder="Write your thoughts for this day..."
                        />
                      </div>
                      
                      {/* MOOD SELECTOR */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          😊 How are you feeling?
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(MOODS).map(([mood, { icon: Icon, color, label }]) => (
                            <button
                              key={mood}
                              type="button"
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border ${
                                (entry.tempMood || entry.mood) === mood 
                                  ? 'bg-primary text-primary-foreground border-primary' 
                                  : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Mood clicked:', mood, 'for entry:', entry.id);
                                entry.tempMood = mood;
                                // Force component update by modifying state
                                setOpenCards(prev => [...prev]);
                              }}
                            >
                              <Icon className={`h-4 w-4 ${color}`} />
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* SAVE BUTTON */}
                      <div className="flex gap-2 pt-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Get content from textarea using ID
                            const textarea = document.getElementById(`textarea-${entry.id}`);
                            const content = textarea ? textarea.value : "";
                            const mood = entry.tempMood || entry.mood;
                            
                            console.log('💾 Save clicked:', { entryId: entry.id, content, mood });
                            
                            if (!content || content.trim() === '') {
                              alert('⚠️ Please write something before saving!');
                              return;
                            }
                            
                            if (entry.isEmpty) {
                              const newEntry = {
                                id: Date.now().toString(),
                                date: entry.date,
                                content: content,
                                wordCount: content.split(/\s+/).filter(Boolean).length,
                                tags: [],
                                mood: mood,
                                satisfaction: null,
                                isFavorite: entry.isFavorite || false,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                              };
                              console.log('✨ Creating new entry:', newEntry);
                              onSave(newEntry);
                            } else {
                              const updatedEntry = {
                                ...entry,
                                content: content,
                                wordCount: content.split(/\s+/).filter(Boolean).length,
                                mood: mood,
                                updatedAt: new Date().toISOString()
                              };
                              console.log('📝 Updating entry:', updatedEntry);
                              onSave(updatedEntry);
                            }
                            
                            // Show success message
                            alert('✅ Entry saved successfully!');
                            
                            // DO NOT close card - keep it open
                          }}
                          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                        >
                          <Save className="h-4 w-4" />
                          Save Entry
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => toggleCard(entry.id)}
                          className="flex items-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* READ-ONLY - For all older entries */
                    <div className="space-y-4">
                      <div className="bg-muted/20 border border-muted/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🔒</span>
                          <h4 className="text-lg font-semibold text-muted-foreground">
                            Read-Only Entry
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          This entry is from more than 2 days ago and cannot be edited.
                        </p>
                        
                        {/* DISPLAY CONTENT */}
                        <div className="bg-background/50 border border-border/30 rounded-lg p-4 mb-4">
                          <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                            {entry.content || (
                              <span className="text-muted-foreground italic">
                                No content was written for this day.
                              </span>
                            )}
                          </p>
                        </div>
                        
                        {/* DISPLAY MOOD */}
                        {entry.mood && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm font-medium text-foreground">Mood:</span>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/50 ${moodColor}`}>
                              <MoodIcon className="h-4 w-4" />
                              <span className="text-sm">{MOODS[entry.mood]?.label}</span>
                            </div>
                          </div>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => toggleCard(entry.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
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
      })}
    </div>
  );
};
