import { CopyDockData } from '../types';

export const getMockData = (): CopyDockData => {
  const now = new Date();
  const today = now.toISOString();
  
  return {
    notebooks: [
      {
        id: 'nb1',
        name: 'Work Notes',
        itemCount: 12,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        isTarget: true,
      },
      {
        id: 'nb2',
        name: 'Personal',
        itemCount: 8,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        isTarget: false,
      },
      {
        id: 'nb3',
        name: 'Research',
        itemCount: 5,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        isTarget: false,
      },
      {
        id: 'nb4',
        name: 'Ideas',
        itemCount: 15,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        isTarget: false,
      },
      {
        id: 'nb5',
        name: 'Meeting Minutes',
        itemCount: 3,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isTarget: false,
      },
    ],
    notes: [],
    analytics: {
      notebookCount: 5,
      streak: 12,
      totalNotes: 43,
      storageMb: 2.3,
      storageTotalMb: 10,
      activity: [
        { date: '2025-01-15', notes: 2, todos: 5, captures: 1 },
        { date: '2025-01-16', notes: 4, todos: 3, captures: 2 },
        { date: '2025-01-17', notes: 1, todos: 7, captures: 0 },
        { date: '2025-01-18', notes: 3, todos: 4, captures: 1 },
        { date: '2025-01-19', notes: 5, todos: 8, captures: 3 },
        { date: '2025-01-20', notes: 2, todos: 6, captures: 1 },
        { date: '2025-01-21', notes: 3, todos: 5, captures: 2 },
      ],
      today: {
        notes: 3,
        todos: 7,
        templates: 2,
        captures: 5,
      },
      content: {
        totalWords: 5348,
        avgWordsPerNote: 124,
        breakdown: [
          { name: 'Work', value: 45 },
          { name: 'Personal', value: 30 },
          { name: 'Research', value: 15 },
          { name: 'Ideas', value: 10 },
        ],
      },
      goals: {
        currentStreak: 12,
        bestStreak: 28,
        monthlyProgress: 58,
      },
      storageBreakdown: [
        { name: 'Notes', value: 1.8 },
        { name: 'Images', value: 0.4 },
        { name: 'Templates', value: 0.1 },
      ],
      templates: [
        { id: 't1', name: 'Meeting Notes', content: '', useCount: 12 },
        { id: 't2', name: 'Daily Journal', content: '', useCount: 8 },
        { id: 't3', name: 'Research', content: '', useCount: 5 },
      ],
      recentActivity: [
        { id: 'r1', notebookName: 'Work Notes', timestamp: '2 min ago', type: 'note' },
        { id: 'r2', notebookName: 'Personal', timestamp: '1h ago', type: 'edit' },
        { id: 'r3', notebookName: 'Ideas', timestamp: '3h ago', type: 'capture' },
      ],
      favorites: [
        { id: 'f1', notebookId: 'nb1', name: 'Important Project', lastAccessed: today },
        { id: 'f2', notebookId: 'nb5', name: 'Meeting Minutes', lastAccessed: today },
      ],
      weeklyInsights: {
        mostProductiveDay: 'Friday',
        totalWords: 1247,
        notesCreated: 18,
        todosCompleted: 34,
      },
    },
    todoSystem: [],
  };
};
