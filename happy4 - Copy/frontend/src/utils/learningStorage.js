// Learning Journal Storage Utilities
const STORAGE_KEYS = {
  ENTRIES: 'learning-journal-entries-2025',
  ANALYTICS: 'learning-journal-analytics-2025',
  SETTINGS: 'learning-journal-settings-2025'
};

// Save entries to localStorage
export const saveLearningEntries = (entries) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Error saving learning entries:', error);
    return false;
  }
};

// Load entries from localStorage
export const loadLearningEntries = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading learning entries:', error);
    return [];
  }
};

// Save analytics data
export const saveLearningAnalytics = (analytics) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify({
      ...analytics,
      lastUpdated: new Date().toISOString()
    }));
    return true;
  } catch (error) {
    console.error('Error saving analytics:', error);
    return false;
  }
};

// Load analytics data
export const loadLearningAnalytics = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error loading analytics:', error);
    return null;
  }
};

// Export all data for backup
export const exportLearningData = () => {
  try {
    const entries = loadLearningEntries();
    const analytics = loadLearningAnalytics();
    
    const exportData = {
      entries,
      analytics,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `learning-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error exporting data:', error);
    return false;
  }
};

// Import data from backup
export const importLearningData = (jsonData) => {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.entries) {
      saveLearningEntries(data.entries);
    }
    
    if (data.analytics) {
      saveLearningAnalytics(data.analytics);
    }
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

// Clear all data
export const clearLearningData = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.ANALYTICS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

// Get data size in localStorage
export const getStorageSize = () => {
  try {
    const entries = localStorage.getItem(STORAGE_KEYS.ENTRIES) || '';
    const analytics = localStorage.getItem(STORAGE_KEYS.ANALYTICS) || '';
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS) || '';
    
    const totalSize = entries.length + analytics.length + settings.length;
    return {
      totalSize,
      entriesSize: entries.length,
      analyticsSize: analytics.length,
      settingsSize: settings.length,
      formattedSize: `${(totalSize / 1024).toFixed(2)} KB`
    };
  } catch (error) {
    console.error('Error calculating storage size:', error);
    return null;
  }
};
