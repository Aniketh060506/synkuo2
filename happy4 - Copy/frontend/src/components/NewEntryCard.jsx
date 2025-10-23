import { useState } from "react";
import { Sparkles, Save, X, Plus, Smile, Meh, Frown } from "lucide-react";

const MOODS = {
  great: { icon: Smile, color: "text-green-500", label: "Great" },
  good: { icon: Smile, color: "text-blue-500", label: "Good" },
  okay: { icon: Meh, color: "text-yellow-500", label: "Okay" },
  bad: { icon: Frown, color: "text-red-500", label: "Bad" }
};

export const NewEntryCard = ({ onSave, dailyPrompt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [mood, setMood] = useState();
  const [satisfaction, setSatisfaction] = useState();
  const [usePrompt, setUsePrompt] = useState(false);

  const handleSave = () => {
    if (content.trim()) {
      onSave({
        content: content.trim(),
        tags,
        mood,
        satisfaction,
        prompt: usePrompt ? dailyPrompt : undefined
      });
      setContent("");
      setTags([]);
      setMood(undefined);
      setSatisfaction(undefined);
      setUsePrompt(false);
      setIsOpen(false);
    }
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  if (!isOpen) {
    return (
      <div 
        className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5 hover:border-primary/50 transition-all duration-300 cursor-pointer group animate-fade-in rounded-2xl"
        onClick={() => setIsOpen(true)}
      >
        <div className="py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:scale-110 transition-transform">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Start Writing</h3>
          <p className="text-sm text-muted-foreground">Capture your thoughts for today</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-primary/50 bg-gradient-to-br from-primary/5 to-secondary/5 animate-scale-in rounded-2xl">
      <div className="pt-6 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">New Entry</h3>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Daily Prompt */}
        <div 
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
            usePrompt 
              ? 'border-primary bg-primary/10' 
              : 'border-border bg-secondary/50 hover:border-primary/50'
          }`}
          onClick={() => setUsePrompt(!usePrompt)}
        >
          <p className="text-sm font-medium text-foreground italic">"{dailyPrompt}"</p>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[200px] bg-background/50 border border-border/50 resize-none text-foreground w-full rounded-lg p-4 focus:border-primary focus:outline-none"
          placeholder="Write your thoughts..."
          autoFocus
        />

        {/* Mood Selection */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            How are you feeling?
          </label>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(MOODS).map(([moodKey, { icon: Icon, color, label }]) => (
              <button
                key={moodKey}
                type="button"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  mood === moodKey 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border'
                }`}
                onClick={() => setMood(mood === moodKey ? undefined : moodKey)}
              >
                <Icon className={`h-4 w-4 ${color}`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Satisfaction Level */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Satisfaction Level (1-10)
          </label>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <button
                key={level}
                type="button"
                className={`w-10 h-10 rounded-lg text-sm transition-all ${
                  satisfaction === level
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border'
                }`}
                onClick={() => setSatisfaction(satisfaction === level ? undefined : level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Tags
          </label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {tags.map(tag => (
              <span key={tag} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm flex items-center gap-1">
                {tag}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeTag(tag)}
                />
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              placeholder="Add tag..."
              className="flex-1 bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <button onClick={addTag} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border px-3 py-2 rounded-lg transition-colors">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button 
            onClick={handleSave} 
            disabled={!content.trim()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Entry
          </button>
          <button 
            onClick={() => {
              setContent("");
              setTags([]);
              setMood(undefined);
              setSatisfaction(undefined);
              setUsePrompt(false);
              setIsOpen(false);
            }} 
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
