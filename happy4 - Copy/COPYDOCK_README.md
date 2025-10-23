# 🚀 CopyDock - Production-Ready Productivity Suite

CopyDock is a powerful, dark-themed productivity application that combines note-taking, hierarchical task management, web content capture, and real-time analytics.

## ✨ Features

### 📚 Notebook Management
- **Create unlimited notebooks** for organizing your notes
- **Grid and List view modes** for notebook display
- **Set target notebooks** for web content capture
- **Delete notebooks** with confirmation
- **Real-time note count** for each notebook
- **Circular, modern UI** with pure black theme

### ✍️ Rich Text Note Editor (TipTap)
- **Full-featured rich text editing**:
  - Bold, Italic, Strikethrough, Code
  - Bullet lists, Numbered lists, Blockquotes
  - Headings (H1, H2, H3)
  - Undo/Redo functionality
- **Auto-save capability**
- **Word and character counting**
- **Note sidebar** for quick navigation
- **Beautiful placeholder text**

### 📋 Hierarchical Todo System
- **Year → Month → Day → Hour** planning structure
- **Create multiple planning years**
- **Navigate through months and days**
- **Set daily goals**
- **Add hourly tasks** with time ranges
- **Mark tasks as complete**
- **Visual calendar interface**

### 📊 Comprehensive Analytics Sidebar
- **Quick Stats Grid**:
  - Notebook count
  - Current streak with flame icon
  - Total notes count
  - Storage usage in MB

- **Activity Chart** (7 days visualization)
- **Today's Productivity**:
  - Notes created
  - Todos completed
  - Templates used
  - Web captures

- **Content Analytics**:
  - Total words written
  - Average words per note
  - Breakdown by notebook

- **Streak & Goals**:
  - Current streak
  - Best streak ever
  - Monthly progress

- **Storage Breakdown**:
  - Visual progress bar
  - Detailed breakdown (Notes, Images, Templates)

- **Quick Templates**:
  - Meeting Notes
  - Daily Journal
  - Research

- **Recent Activity**:
  - Last accessed notebooks
  - Timestamps

- **Favorites**:
  - Starred notebooks for quick access

- **Weekly Insights**:
  - Most productive day
  - Total words written
  - Notes created
  - Todos completed

### 🌐 Chrome Extension - Web Content Capture
- **Capture text from any webpage**
- **Preserves HTML formatting**
- **Tracks source URL and domain**
- **Visual confirmation notifications**
- **Right-click context menu** "Copy to CopyDock"
- **Seamless integration** with main app

### 🎨 Design Features
- **Pure black theme** (#000000) with variations
- **Circular/rounded UI elements** throughout
- **Lenis smooth scrolling** for enhanced UX
- **Micro-animations** and transitions
- **Responsive layout** with fixed sidebar
- **Lucide React icons** (no emojis)
- **Clean, modern aesthetic**

## 🛠️ Tech Stack

- **Frontend**: React 19.x
- **Styling**: Tailwind CSS + Custom CSS
- **Rich Text Editor**: TipTap (ProseMirror-based)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Smooth Scrolling**: Lenis
- **State Management**: React Hooks (useState, useEffect)
- **Data Persistence**: localStorage
- **Chrome Extension**: Manifest V3

## 📦 Installation

### Main Application

The application is already running at `http://localhost:3000`

### Chrome Extension

1. **Open Chrome Extensions Page**:
   - Go to `chrome://extensions/`
   - Or Menu → More Tools → Extensions

2. **Enable Developer Mode**:
   - Toggle "Developer mode" in the top-right corner

3. **Load Extension**:
   - Click "Load unpacked"
   - Navigate to `/app/chrome-extension`
   - Select the folder

4. **Verify Installation**:
   - You should see "CopyDock Web Clipper" in your extensions
   - The extension icon will appear in your toolbar

### Using the Chrome Extension

1. **Set Target Notebook**:
   - Open CopyDock at `http://localhost:3000`
   - Click the target icon on any notebook
   - This notebook will receive captured content

2. **Capture Content**:
   - Go to any website
   - Select text you want to save
   - Right-click → "Copy to CopyDock"
   - You'll see a confirmation notification

3. **View Captured Content**:
   - Open the target notebook in CopyDock
   - Your captured content will be saved as a new note
   - Source URL and domain are preserved

## 🎯 Usage Guide

### Creating a Notebook
1. Click "New Notebook" button
2. Enter notebook name
3. Click "Create"

### Writing Notes
1. Click on any notebook
2. Click "New Note" in the sidebar
3. Enter a title
4. Use the rich text editor
5. Click "Save"

### Using Todo System
1. Click "Todo System" in top navigation
2. Click "Add Year" to create a planning year
3. Click on a year to view months
4. Click on a month to view days
5. Click on a day to add tasks and goals

### Managing Analytics
- **Switch tabs**: Click Analytics, Recent, or Favorites
- **Search**: Use the search bar at top of sidebar
- **View insights**: Scroll through the sidebar

### Sidebar Toggle
- Click the X button (top-right) to hide sidebar
- Click the Menu button to show sidebar

## 💾 Data Storage

All data is stored in browser **localStorage**:
- **Key**: `copyDockData`
- **Contains**:
  - Notebooks array
  - Notes array
  - Analytics object
  - Todo system array

### Data Backup
Since data is stored locally, you can:
1. Export localStorage data via browser DevTools
2. Import/restore using custom export feature (to be added)

## 🔧 Development

### File Structure
```
/app/frontend/src/
├── App.js                      # Main application
├── App.css                     # Global styles
├── index.css                   # Tailwind + custom CSS
├── types.js                    # TypeScript interfaces
├── components/
│   ├── LenisWrapper.jsx        # Smooth scroll wrapper
│   ├── Sidebar.jsx             # Analytics sidebar
│   ├── NotebookManager.jsx     # Notebook grid/list
│   ├── Dashboard.jsx           # Note editor
│   └── TodoSystem.jsx          # Hierarchical todos
└── utils/
    ├── storage.js              # localStorage utilities
    └── mockData.js             # Initial mock data

/app/chrome-extension/
├── manifest.json               # Extension config
├── background.js               # Service worker
├── content.js                  # Content script
├── popup.html                  # Extension popup
└── popup.js                    # Popup logic
```

### Key Utilities

**loadData()**: Load from localStorage
**saveData(data)**: Save to localStorage
**calculateAnalytics(data)**: Compute analytics from data
**getMockData()**: Generate initial demo data

### Adding Features

1. **New Component**: Create in `src/components/`
2. **Import in App.js**: Add to main app
3. **Add Route/View**: Update `currentView` state
4. **Update Data Model**: Modify `types.js` if needed
5. **Persist Data**: Use `saveData()` after changes

## 🎨 Design System

### Colors
```css
--color-black: #000000;          /* Pure black background */
--color-dark-1: #0A0A0A;         /* Slightly lighter black */
--color-dark-2: #141414;         /* Card backgrounds */
--color-dark-3: #1C1C1E;         /* Primary card color */
--color-dark-4: #262626;         /* Hover states */
--color-white: #FFFFFF;          /* Primary text */
--color-gray-400: #999999;       /* Secondary text */
--color-gray-600: #666666;       /* Muted text */
--color-border: rgba(255,255,255,0.1);  /* Borders */
--color-red: #EF4444;            /* Streak flame */
--color-blue: #3B82F6;           /* Accents */
```

### Typography
- **Font**: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Base Size**: 14px
- **Line Height**: 1.6

### Components
- **Cards**: `border-radius: 16-20px`
- **Buttons**: `border-radius: 20px` (full rounded)
- **Inputs**: `border-radius: 12px`
- **Transitions**: `0.3s ease`

## 🚀 Deployment Considerations

### For Production:
1. **Backend Integration**: Replace localStorage with API calls
2. **Authentication**: Add user login/signup
3. **Cloud Sync**: Implement cross-device synchronization
4. **Image Upload**: Add support for images in notes
5. **Export/Import**: Add data backup features
6. **Search**: Implement full-text search
7. **Collaboration**: Add sharing and collaboration features

## 🐛 Known Limitations

1. **localStorage only**: Data is device-specific
2. **No images**: Currently text-only notes
3. **No mobile app**: Browser-only for now
4. **Extension requires local app**: Must have CopyDock running
5. **No authentication**: Single-user local app

## 📝 Future Enhancements

- [ ] Backend API integration
- [ ] User authentication
- [ ] Cloud synchronization
- [ ] Mobile responsive improvements
- [ ] Image upload in notes
- [ ] Tags and categories
- [ ] Advanced search and filters
- [ ] Keyboard shortcuts
- [ ] Dark/Light theme toggle
- [ ] Export to PDF/Markdown
- [ ] Real-time collaboration
- [ ] Browser sync across devices

## 🎯 Performance

- **Fast**: No backend calls, instant localStorage reads
- **Smooth**: Lenis scroll for 60fps scrolling
- **Optimized**: Lazy loading for large note lists
- **Efficient**: Minimal re-renders with React hooks

## 🔒 Privacy

- **100% Local**: All data stays on your device
- **No tracking**: No analytics or telemetry
- **No ads**: Completely ad-free
- **Open source ready**: Transparent codebase

---

**Built with ❤️ for productivity enthusiasts**

CopyDock - Your productivity workspace, reimagined.
