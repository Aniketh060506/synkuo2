import { useState, useEffect, useRef } from 'react';
import './App.css';
import LenisWrapper from './components/LenisWrapper';
import Sidebar from './components/Sidebar';
import NotebookManager from './components/NotebookManager';
import Dashboard from './components/Dashboard';
import TodoSystem from './components/TodoSystem';
import LearningPortal from './components/LearningPortal';
import { TaskScheduler } from './components/TaskScheduler';
import { TaskProvider } from './contexts/TaskContext';
import { loadData, saveData, calculateAnalytics, getInitialData, trackActivity } from './utils/storage';
import { Menu, X, CheckSquare, RefreshCw, BookOpen, Calendar, GripVertical, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import WebCaptureService from './services/webCaptureService';
import SplashScreen from './components/SplashScreen';

function App() {
  const [data, setData] = useState(null);
  const [currentView, setCurrentView] = useState('notebooks');
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [openTabs, setOpenTabs] = useState(['notebooks']);
  const [draggedTab, setDraggedTab] = useState(null);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 24 }); // x: %, y: px from top
  const [isDraggingBall, setIsDraggingBall] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0, time: 0 });
  const [showSplash, setShowSplash] = useState(true);

  // Smooth movement heuristics for the floating nav ball
  const isBallMoving = isDraggingBall || Math.abs(velocity.x) > 0.5 || Math.abs(velocity.y) > 0.5;

  // Ref to the floating nav container, used to compute position on collapse
  const navRef = useRef(null);
  const [snapNoTransition, setSnapNoTransition] = useState(false);

  const collapseNavAtCurrentSpot = () => {
    try {
      const el = navRef.current;
      if (!el) return setNavCollapsed(true);
      const rect = el.getBoundingClientRect();
      const ballSize = 56; // collapsed: w-14 h-14
      const leftPx = rect.left + rect.width / 2 - ballSize / 2;
      const topPx = rect.top + rect.height / 2 - ballSize / 2;
      const xPercent = (leftPx / window.innerWidth) * 100;

      const clampedX = Math.min(98, Math.max(2, xPercent));
      const clampedY = Math.min(window.innerHeight - 80, Math.max(24, topPx));

      setVelocity({ x: 0, y: 0 });
      // Phase 1: collapse exactly where it is (no transition)
      setBallPosition({ x: clampedX, y: clampedY });
      setSnapNoTransition(true);
      setNavCollapsed(true);

      // Phase 2: on next frame, animate to bottom-left corner smoothly
      requestAnimationFrame(() => {
        // Compute bottom-left corner position (respect sidebar)
        const margin = 16; // px breathing space from edges
        const leftPxCorner = (showSidebar ? 320 : 0) + margin;
        const xPercentCorner = (leftPxCorner / window.innerWidth) * 100;
        const yPxCorner = window.innerHeight - 80; // near bottom within bounds

        setSnapNoTransition(false);
        setBallPosition({
          x: Math.min(98, Math.max(2, xPercentCorner)),
          y: Math.min(window.innerHeight - 80, Math.max(24, yPxCorner))
        });
      });
    } catch {
      setNavCollapsed(true);
    }
  };

  useEffect(() => {
    // Load data from localStorage
    const storedData = loadData();
    setData(storedData);
    
    // Initial sync of web captures
    syncWebCaptures(storedData);
  }, []);

  // Handle ball dragging
  const handleBallMouseDown = (e) => {
    if (!navCollapsed) return;
    setIsDraggingBall(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  useEffect(() => {
    if (!isDraggingBall) return;

    const handleMouseMove = (e) => {
      const now = Date.now();
      const x = ((e.clientX - dragOffset.x) / window.innerWidth) * 100;
      const y = e.clientY - dragOffset.y;
      
      // Calculate velocity for momentum
      if (lastPosition.time > 0) {
        const dt = (now - lastPosition.time) / 1000; // seconds
        const vx = (x - lastPosition.x) / dt;
        const vy = (y - lastPosition.y) / dt;
        setVelocity({ x: vx, y: vy });
      }
      
      setLastPosition({ x, y, time: now });
      setBallPosition({ x, y });
    };

    const handleMouseUp = () => {
      setIsDraggingBall(false);
      // Momentum will be applied in separate useEffect
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingBall, dragOffset, lastPosition]);

  // Momentum physics after release - FIXED GLITCHING
  useEffect(() => {
    if (isDraggingBall) return;
    if (Math.abs(velocity.x) < 0.5 && Math.abs(velocity.y) < 0.5) return;

    const friction = 0.95; // closer to 1 => longer, smoother stop
    const minVelocity = 0.07; // lower threshold for a gentle settle
    let animationFrame;
    let currentVelocity = { x: velocity.x, y: velocity.y };
    let currentPosition = { x: ballPosition.x, y: ballPosition.y };
    let lastTime = performance.now();

    const animate = (currentTime) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap deltaTime
      lastTime = currentTime;

      // Apply velocity
      currentPosition.x += currentVelocity.x * deltaTime * 50;
      currentPosition.y += currentVelocity.y * deltaTime * 50;

      // Apply friction
      currentVelocity.x *= friction;
      currentVelocity.y *= friction;

      // Boundary checks with bounce
      if (currentPosition.x < 2) {
        currentPosition.x = 2;
        currentVelocity.x = Math.abs(currentVelocity.x) * 0.35;
      } else if (currentPosition.x > 98) {
        currentPosition.x = 98;
        currentVelocity.x = -Math.abs(currentVelocity.x) * 0.35;
      }

      if (currentPosition.y < 24) {
        currentPosition.y = 24;
        currentVelocity.y = Math.abs(currentVelocity.y) * 0.35;
      } else if (currentPosition.y > window.innerHeight - 80) {
        currentPosition.y = window.innerHeight - 80;
        currentVelocity.y = -Math.abs(currentVelocity.y) * 0.35;
      }

      // Update state less frequently to avoid glitching
      setBallPosition({ x: currentPosition.x, y: currentPosition.y });

      // Continue animation if still moving
      if (Math.abs(currentVelocity.x) > minVelocity || Math.abs(currentVelocity.y) > minVelocity) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setVelocity({ x: 0, y: 0 });
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isDraggingBall, velocity.x, velocity.y]);

  useEffect(() => {
    // Auto-sync web captures every 30 seconds
    const cleanup = WebCaptureService.startAutoSync((updatedData) => {
      setData(updatedData);
      setLastSyncTime(new Date());
    }, 30);

    return cleanup;
  }, []);

  useEffect(() => {
    // Listen for web capture messages from Chrome extension
    const handleMessage = (event) => {
      if (event.data.type === 'CONTENT_CAPTURE') {
        handleWebCapture(event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [data]);

  // Global mousemove -> sync interactive gradient for root + main surfaces
  useEffect(() => {
    let rafId;
    const handleMouse = (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const root = document.getElementById('app-surface-root');
        if (root) {
          const r = root.getBoundingClientRect();
          root.style.setProperty('--mx', `${e.clientX - r.left}px`);
          root.style.setProperty('--my', `${e.clientY - r.top}px`);
        }
        const main = document.getElementById('app-surface-main');
        if (main) {
          const m = main.getBoundingClientRect();
          main.style.setProperty('--mx', `${e.clientX - m.left}px`);
          main.style.setProperty('--my', `${e.clientY - m.top}px`);
        }
      });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => {
      window.removeEventListener('mousemove', handleMouse);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const syncWebCaptures = async (currentData = data) => {
    if (!currentData) return;
    
    setIsSyncing(true);
    try {
      const updatedData = await WebCaptureService.syncCapturesWithLocalStorage(currentData);
      setData(updatedData);
      saveData(updatedData);
      setLastSyncTime(new Date());
      console.log('✅ Web captures synced successfully');
    } catch (error) {
      console.error('Failed to sync web captures:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleWebCapture = (payload) => {
    if (!data) return;

    const targetNotebook = data.notebooks.find(nb => nb.isTarget);
    if (!targetNotebook) {
      alert('Please set a target notebook first');
      return;
    }

    // Append captured content to target notebook
    const capturedContent = `\n\n---\n**Captured from ${payload.sourceDomain}**\n${payload.sourceUrl}\n\n${payload.selectedHTML}`;
    
    const updatedData = {
      ...data,
      notebooks: data.notebooks.map(nb =>
        nb.id === targetNotebook.id
          ? { 
              ...nb, 
              content: nb.content + capturedContent,
              lastModified: new Date().toISOString(),
              lastAccessed: new Date().toISOString(),
              wordCount: nb.wordCount + payload.selectedText.split(/\s+/).filter(Boolean).length,
              characterCount: nb.characterCount + payload.selectedText.length,
            }
          : nb
      ),
    };

    // Track capture
    trackActivity(updatedData, 'capture', 1);

    updatedData.analytics = calculateAnalytics(updatedData);
    updatedData.analytics.webCaptures = (updatedData.analytics.webCaptures || 0) + 1;
    
    setData(updatedData);
    saveData(updatedData);

    // Show success message
    alert(`✅ Captured from ${payload.sourceDomain}`);
  };

  const handleCreateNotebook = (name) => {
    const newNotebook = {
      id: `nb_${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      isTarget: data.notebooks.length === 0,
      isFavorite: false,
      content: '',
      wordCount: 0,
      characterCount: 0,
    };

    const updatedData = {
      ...data,
      notebooks: [...data.notebooks, newNotebook],
    };

    // Track note creation
    trackActivity(updatedData, 'noteCreated', 1);
    
    updatedData.analytics = calculateAnalytics(updatedData);
    setData(updatedData);
    saveData(updatedData);
  };

  const handleSelectNotebook = (notebook) => {
    // Update last accessed timestamp
    const updatedData = {
      ...data,
      notebooks: data.notebooks.map(nb =>
        nb.id === notebook.id
          ? { ...nb, lastAccessed: new Date().toISOString() }
          : nb
      ),
    };
    
    setData(updatedData);
    saveData(updatedData);
    setSelectedNotebook(notebook);
    setCurrentView('editor');
  };

  const handleDeleteNotebook = (notebookId) => {
    if (window.confirm('Are you sure you want to delete this notebook?')) {
      const updatedData = {
        ...data,
        notebooks: data.notebooks.filter(nb => nb.id !== notebookId),
      };

      updatedData.analytics = calculateAnalytics(updatedData);
      setData(updatedData);
      saveData(updatedData);
      
      // If deleted notebook was selected, go back to notebooks
      if (selectedNotebook?.id === notebookId) {
        setCurrentView('notebooks');
        setSelectedNotebook(null);
      }
    }
  };

  const handleSetTarget = (notebookId) => {
    const updatedData = {
      ...data,
      notebooks: data.notebooks.map(nb => ({
        ...nb,
        isTarget: nb.id === notebookId,
      })),
    };

    setData(updatedData);
    saveData(updatedData);

    // Send message to Chrome extension
    window.postMessage({
      type: 'TARGET_NOTEBOOK_UPDATED',
      notebookId,
    }, '*');
  };

  const handleToggleFavorite = (notebookId) => {
    const updatedData = {
      ...data,
      notebooks: data.notebooks.map(nb =>
        nb.id === notebookId
          ? { ...nb, isFavorite: !nb.isFavorite }
          : nb
      ),
    };

    setData(updatedData);
    saveData(updatedData);
  };

  const handleSaveNotebook = (notebookId, content, wordCount, characterCount) => {
    const notebook = data.notebooks.find(nb => nb.id === notebookId);
    const previousWordCount = notebook ? notebook.wordCount : 0;
    const wordsAdded = Math.max(0, wordCount - previousWordCount);
    
    const updatedData = {
      ...data,
      notebooks: data.notebooks.map(nb =>
        nb.id === notebookId
          ? { 
              ...nb, 
              content,
              lastModified: new Date().toISOString(),
              lastAccessed: new Date().toISOString(),
              wordCount,
              characterCount,
            }
          : nb
      ),
    };

    // Track words written
    if (wordsAdded > 0) {
      trackActivity(updatedData, 'wordsWritten', wordsAdded);
    }

    updatedData.analytics = calculateAnalytics(updatedData);
    setData(updatedData);
    saveData(updatedData);
  };

  const handleUpdateTodos = (todoSystem) => {
    // Count newly completed todos by comparing with previous state
    let newlyCompletedCount = 0;
    
    if (data.todoSystem) {
      // Count total completed in new state
      let newCompletedTotal = 0;
      let oldCompletedTotal = 0;
      
      todoSystem.forEach(yearData => {
        yearData.months.forEach(monthData => {
          if (monthData.days) {
            monthData.days.forEach(dayData => {
              if (dayData.hours) {
                dayData.hours.forEach(hour => {
                  if (hour.completed) newCompletedTotal++;
                });
              }
            });
          }
        });
      });
      
      data.todoSystem.forEach(yearData => {
        yearData.months.forEach(monthData => {
          if (monthData.days) {
            monthData.days.forEach(dayData => {
              if (dayData.hours) {
                dayData.hours.forEach(hour => {
                  if (hour.completed) oldCompletedTotal++;
                });
              }
            });
          }
        });
      });
      
      newlyCompletedCount = Math.max(0, newCompletedTotal - oldCompletedTotal);
    }
    
    const updatedData = {
      ...data,
      todoSystem,
    };

    // Track newly completed todos - trackActivity mutates the data
    if (newlyCompletedCount > 0) {
      trackActivity(updatedData, 'todoCompleted', newlyCompletedCount);
    }

    // Recalculate analytics to update streak and stats
    updatedData.analytics = calculateAnalytics(updatedData);
    
    setData(updatedData);
    saveData(updatedData);
  };

  const handleBackToNotebooks = () => {
    setCurrentView('notebooks');
    setSelectedNotebook(null);
  };

  // Tab management functions
  const openTab = (tabId) => {
    if (!openTabs.includes(tabId)) {
      setOpenTabs([...openTabs, tabId]);
    }
    setCurrentView(tabId);
  };

  const closeTab = (tabId, e) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== tabId);
    setOpenTabs(newTabs);
    
    if (currentView === tabId) {
      setCurrentView(newTabs[newTabs.length - 1] || 'notebooks');
    }
  };

  const handleDragStart = (e, tabId) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetTabId) => {
    e.preventDefault();
    if (!draggedTab || draggedTab === targetTabId) return;

    const draggedIndex = openTabs.indexOf(draggedTab);
    const targetIndex = openTabs.indexOf(targetTabId);
    
    const newTabs = [...openTabs];
    newTabs.splice(draggedIndex, 1);
    newTabs.splice(targetIndex, 0, draggedTab);
    
    setOpenTabs(newTabs);
    setDraggedTab(null);
  };

  const getTabInfo = (tabId) => {
    const tabs = {
      notebooks: { label: 'Notebooks', icon: null },
      learning: { label: 'Learning', icon: BookOpen },
      todos: { label: 'Todo System', icon: CheckSquare },
      scheduler: { label: 'Task Scheduler', icon: Calendar },
    };
    return tabs[tabId] || { label: tabId, icon: null };
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <TaskProvider>
      <LenisWrapper>
        <div id="app-surface-root" className="min-h-screen interactive-dark app-enter">
        {/* Top Navigation Bar */}
        <div className={`fixed top-0 right-0 h-12 bg-transparent border-b border-transparent flex items-center justify-between px-6 z-40 transition-all duration-300 slide-up-1 ${
          showSidebar ? 'left-80' : 'left-0'
        }`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-all"
            >
              {showSidebar ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
            </button>
            <h1 className="text-white font-bold text-lg">SynkUp</h1>
          </div>
        </div>

        {/* Floating Navigation Pills - Draggable & Collapsible */}
        <div 
          key={`floating-${currentView}`}
          ref={navRef}
          className={`fixed z-50 slide-up-2 ${navCollapsed ? '' : (showSidebar ? 'left-[calc(320px+(100vw-320px)/2-300px)]' : 'left-[calc(50%-300px)]')} ${navCollapsed ? '' : 'transform -translate-x-1/2'}`}
          style={navCollapsed ? {
            left: `${ballPosition.x}%`,
            top: `${ballPosition.y}px`,
            transform: 'none', // use top/left anchoring to avoid jitter
            transition: (isBallMoving || snapNoTransition) ? 'none' : 'left 0.45s cubic-bezier(0.22, 1, 0.36, 1), top 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
          } : {
            top: '64px',
            transition: 'all 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        >
          <div 
            className={`bg-[#1C1C1E]/95 backdrop-blur-xl rounded-full border border-[rgba(255,255,255,0.15)] shadow-2xl transition-all duration-500 ease-out ${
              navCollapsed 
                ? 'w-14 h-14 bg-white hover:scale-110 cursor-move' 
                : 'px-4 py-2.5'
            }`}
            onClick={() => navCollapsed && !isDraggingBall && setNavCollapsed(false)}
            onMouseDown={handleBallMouseDown}
          >
            {navCollapsed ? (
              <div className="flex items-center justify-center h-full select-none">
                <Zap className="w-6 h-6 text-black animate-pulse pointer-events-none" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Collapse Button - Cool Arrow (Left Side) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    collapseNavAtCurrentSpot();
                  }}
                  className="mr-2 p-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all hover:scale-110 shadow-lg"
                  title="Collapse Navigation"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white" />
                </button>

                {/* Notebooks Button */}
              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'notebooks')}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'notebooks')}
                onClick={() => setCurrentView('notebooks')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-move select-none ${
                  currentView === 'notebooks'
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-transparent text-gray-400 hover:text-white hover:bg-[#262626]'
                } ${draggedTab === 'notebooks' ? 'opacity-50 scale-95' : ''}`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Notebooks</span>
              </button>

              {/* Todo System Button */}
              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'todos')}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'todos')}
                onClick={() => openTab('todos')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-move select-none ${
                  currentView === 'todos'
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-transparent text-gray-400 hover:text-white hover:bg-[#262626]'
                } ${draggedTab === 'todos' ? 'opacity-50 scale-95' : ''}`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Todo</span>
              </button>

              {/* Task Scheduler Button */}
              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'scheduler')}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'scheduler')}
                onClick={() => openTab('scheduler')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-move select-none ${
                  currentView === 'scheduler'
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-transparent text-gray-400 hover:text-white hover:bg-[#262626]'
                } ${draggedTab === 'scheduler' ? 'opacity-50 scale-95' : ''}`}
              >
                <Calendar className="w-4 h-4" />
                <span>Scheduler</span>
              </button>

              {/* Learning Portal Button */}
              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'learning')}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'learning')}
                onClick={() => openTab('learning')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-move select-none ${
                  currentView === 'learning'
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-transparent text-gray-400 hover:text-white hover:bg-[#262626]'
                } ${draggedTab === 'learning' ? 'opacity-50 scale-95' : ''}`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Learning</span>
              </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Left Side */}
        {showSidebar && (
          <div className="slide-up-3">
          <Sidebar
            analytics={data.analytics}
            notebooks={data.notebooks}
            onSearch={(query) => console.log('Search:', query)}
            onSelectNotebook={handleSelectNotebook}
            onSyncWebCaptures={() => syncWebCaptures(data)}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
          />
          </div>
        )}

        {/* Main Content */}
        <div key={currentView} id="app-surface-main" className={`main-scroll-container fixed top-12 bottom-0 right-0 overflow-y-auto transition-all duration-300 slide-up-4 ${showSidebar ? 'left-80' : 'left-0'}`}>
          {currentView === 'notebooks' && (
            <NotebookManager
              notebooks={data.notebooks}
              onCreateNotebook={handleCreateNotebook}
              onSelectNotebook={handleSelectNotebook}
              onDeleteNotebook={handleDeleteNotebook}
              onSetTarget={handleSetTarget}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {currentView === 'editor' && selectedNotebook && (
            <Dashboard
              notebook={selectedNotebook}
              onBack={handleBackToNotebooks}
              onSaveNotebook={handleSaveNotebook}
            />
          )}

          {currentView === 'learning' && (
            <LearningPortal
              onBack={handleBackToNotebooks}
            />
          )}

          {currentView === 'todos' && (
            <TodoSystem
              todoData={data.todoSystem}
              onUpdateTodos={handleUpdateTodos}
              onBack={handleBackToNotebooks}
            />
          )}

          {currentView === 'scheduler' && (
            <TaskScheduler />
          )}
        </div>
        </div>
      </LenisWrapper>
    </TaskProvider>
  );
}

export default App;
