// Web Capture Service - Syncs captures from backend to frontend

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export class WebCaptureService {
  /**
   * Fetch all web captures from backend
   */
  static async fetchCaptures(limit = 100) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/web-captures?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch captures: ${response.status}`);
      }
      
      const data = await response.json();
      return data.captures || [];
    } catch (error) {
      console.error('Error fetching web captures:', error);
      return [];
    }
  }

  /**
   * Get capture count from backend
   */
  static async getCaptureCount() {
    try {
      const captures = await this.fetchCaptures(1000); // Get all
      return captures.length;
    } catch (error) {
      console.error('Error getting capture count:', error);
      return 0;
    }
  }

  /**
   * Import captures from backend into localStorage
   * Creates a special "Web Captures" notebook if it doesn't exist
   */
  static async syncCapturesWithLocalStorage(currentData) {
    try {
      const backendCaptures = await this.fetchCaptures();
      
      if (backendCaptures.length === 0) {
        return currentData;
      }

      // Get existing Web Captures notebook or create new one
      let webCapturesNotebook = currentData.notebooks.find(
        nb => nb.name === 'Web Captures' || nb.id === 'web-captures-auto'
      );

      if (!webCapturesNotebook) {
        webCapturesNotebook = {
          id: 'web-captures-auto',
          name: 'Web Captures',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          lastAccessed: new Date().toISOString(),
          isTarget: false,
          isFavorite: false,
          content: '# Web Captures\n\nAll content captured from the Chrome extension.\n\n',
          wordCount: 0,
          characterCount: 0,
          color: '#3B82F6',
        };
      }

      // Get IDs of already imported captures (stored in localStorage)
      const importedIds = JSON.parse(
        localStorage.getItem('importedCaptureIds') || '[]'
      );

      // Filter new captures
      const newCaptures = backendCaptures.filter(
        capture => !importedIds.includes(capture.id)
      );

      if (newCaptures.length === 0) {
        return currentData;
      }

      // Format captures as markdown
      let captureContent = '';
      newCaptures.forEach(capture => {
        const date = new Date(capture.createdAt || capture.timestamp);
        captureContent += `\n\n---\n\n`;
        captureContent += `### 📋 Captured from ${capture.sourceDomain}\n\n`;
        captureContent += `**Source:** [${capture.sourceUrl}](${capture.sourceUrl})\n`;
        captureContent += `**Date:** ${date.toLocaleString()}\n\n`;
        captureContent += `${capture.selectedText}\n\n`;
        
        if (capture.selectedHTML && capture.selectedHTML !== capture.selectedText) {
          captureContent += `<details>\n<summary>View HTML</summary>\n\n${capture.selectedHTML}\n\n</details>\n\n`;
        }
      });

      // Update notebook content
      const updatedContent = webCapturesNotebook.content + captureContent;
      const wordCount = updatedContent.split(/\s+/).filter(Boolean).length;
      const characterCount = updatedContent.length;

      webCapturesNotebook = {
        ...webCapturesNotebook,
        content: updatedContent,
        wordCount,
        characterCount,
        lastModified: new Date().toISOString(),
      };

      // Update notebooks array
      let updatedNotebooks;
      if (currentData.notebooks.find(nb => nb.id === webCapturesNotebook.id)) {
        updatedNotebooks = currentData.notebooks.map(nb =>
          nb.id === webCapturesNotebook.id ? webCapturesNotebook : nb
        );
      } else {
        updatedNotebooks = [...currentData.notebooks, webCapturesNotebook];
      }

      // Mark captures as imported
      const newImportedIds = [...importedIds, ...newCaptures.map(c => c.id)];
      localStorage.setItem('importedCaptureIds', JSON.stringify(newImportedIds));

      // Update analytics
      const updatedData = {
        ...currentData,
        notebooks: updatedNotebooks,
      };

      updatedData.analytics = {
        ...currentData.analytics,
        webCaptures: backendCaptures.length,
      };

      console.log(`✅ Synced ${newCaptures.length} new web captures`);
      
      return updatedData;
    } catch (error) {
      console.error('Error syncing captures:', error);
      return currentData;
    }
  }

  /**
   * Get latest capture count from backend for real-time updates
   */
  static async updateCaptureCount(currentData) {
    try {
      const count = await this.getCaptureCount();
      
      return {
        ...currentData,
        analytics: {
          ...currentData.analytics,
          webCaptures: count,
        },
      };
    } catch (error) {
      console.error('Error updating capture count:', error);
      return currentData;
    }
  }

  /**
   * Start auto-sync polling
   * Checks for new captures every N seconds
   */
  static startAutoSync(updateCallback, intervalSeconds = 30) {
    const syncInterval = setInterval(async () => {
      try {
        console.log('🔄 Auto-syncing web captures...');
        const currentData = JSON.parse(localStorage.getItem('synkUpData') || localStorage.getItem('copyDockData') || '{}');
        const updatedData = await this.syncCapturesWithLocalStorage(currentData);
        
        if (updatedData !== currentData) {
          localStorage.setItem('synkUpData', JSON.stringify(updatedData));
          updateCallback(updatedData);
        }
      } catch (error) {
        console.error('Auto-sync error:', error);
      }
    }, intervalSeconds * 1000);

    return () => clearInterval(syncInterval);
  }
}

export default WebCaptureService;
