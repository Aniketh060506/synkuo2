import json
import os
from pathlib import Path
from typing import Any, Dict, Optional, List
import shutil
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class StorageService:
    """
    File-based storage service for CopyDock.
    Stores all data in a single JSON file for simplicity.
    """
    
    def __init__(self, storage_path: Optional[str] = None):
        if storage_path:
            self.storage_dir = Path(storage_path)
        else:
            # Default to user data directory
            if os.name == 'nt':  # Windows
                base = Path(os.environ.get('APPDATA', ''))
            else:  # macOS / Linux
                base = Path.home()
            self.storage_dir = base / '.copydock'
        
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.storage_file = self.storage_dir / 'storage.json'
        self.backup_file = self.storage_dir / 'storage.backup.json'
        
        logger.info(f"Storage initialized at: {self.storage_file}")
        self._ensure_storage_exists()
    
    def _ensure_storage_exists(self):
        """Create storage file with default structure if it doesn't exist."""
        if not self.storage_file.exists():
            logger.info("Creating new storage file...")
            self._write_data({
                'notebooks': [],
                'todos': {},
                'web_captures': [],
                'status_checks': [],
                'settings': {
                    'target_notebook_id': 'default',
                    'target_notebook_name': 'Web Captures'
                },
                'metadata': {
                    'created_at': datetime.now().isoformat(),
                    'version': '1.0.0'
                }
            })
    
    def _read_data(self) -> Dict[str, Any]:
        """Read data from storage file."""
        try:
            with open(self.storage_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading storage file: {e}")
            # Try to restore from backup
            if self.backup_file.exists():
                logger.info("Restoring from backup...")
                shutil.copy(self.backup_file, self.storage_file)
                with open(self.storage_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            raise
    
    def _write_data(self, data: Dict[str, Any]):
        """Write data to storage file with backup."""
        try:
            # Create backup of existing file
            if self.storage_file.exists():
                shutil.copy(self.storage_file, self.backup_file)
            
            # Write new data
            with open(self.storage_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            logger.debug("Storage file updated successfully")
        except Exception as e:
            logger.error(f"Error writing storage file: {e}")
            raise
    
    # ============= GENERIC DATA ACCESS =============
    
    def get_all_data(self) -> Dict[str, Any]:
        """Get all data from storage."""
        return self._read_data()
    
    def update_data(self, key: str, value: Any):
        """Update a specific key in storage."""
        data = self._read_data()
        data[key] = value
        self._write_data(data)
    
    # ============= SETTINGS =============
    
    def get_settings(self) -> Dict[str, Any]:
        """Get settings from storage."""
        data = self._read_data()
        return data.get('settings', {})
    
    def update_settings(self, settings: Dict[str, Any]):
        """Update settings in storage."""
        data = self._read_data()
        data['settings'] = {**data.get('settings', {}), **settings}
        self._write_data(data)
        logger.info(f"Settings updated: {settings}")
    
    # ============= WEB CAPTURES =============
    
    def add_web_capture(self, capture: Dict[str, Any]) -> bool:
        """Add a web capture to storage."""
        try:
            data = self._read_data()
            data['web_captures'].append(capture)
            self._write_data(data)
            logger.info(f"Web capture added: {capture.get('sourceDomain', 'unknown')}")
            return True
        except Exception as e:
            logger.error(f"Error adding web capture: {e}")
            return False
    
    def get_web_captures(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent web captures from storage."""
        data = self._read_data()
        captures = data.get('web_captures', [])
        # Return most recent captures (last N items)
        return captures[-limit:] if len(captures) > limit else captures
    
    def get_all_web_captures(self) -> List[Dict[str, Any]]:
        """Get all web captures from storage."""
        data = self._read_data()
        return data.get('web_captures', [])
    
    # ============= STATUS CHECKS =============
    
    def add_status_check(self, status_check: Dict[str, Any]) -> bool:
        """Add a status check to storage."""
        try:
            data = self._read_data()
            data['status_checks'].append(status_check)
            self._write_data(data)
            logger.info(f"Status check added: {status_check.get('client_name', 'unknown')}")
            return True
        except Exception as e:
            logger.error(f"Error adding status check: {e}")
            return False
    
    def get_status_checks(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get status checks from storage."""
        data = self._read_data()
        checks = data.get('status_checks', [])
        return checks[-limit:] if len(checks) > limit else checks
    
    # ============= NOTEBOOKS =============
    
    def get_notebooks(self) -> List[Dict[str, Any]]:
        """Get all notebooks from storage."""
        data = self._read_data()
        return data.get('notebooks', [])
    
    def add_notebook(self, notebook: Dict[str, Any]) -> bool:
        """Add a notebook to storage."""
        try:
            data = self._read_data()
            data['notebooks'].append(notebook)
            self._write_data(data)
            logger.info(f"Notebook added: {notebook.get('name', 'unknown')}")
            return True
        except Exception as e:
            logger.error(f"Error adding notebook: {e}")
            return False
    
    # ============= TODOS =============
    
    def get_todos(self) -> Dict[str, Any]:
        """Get todos from storage."""
        data = self._read_data()
        return data.get('todos', {})
    
    def update_todos(self, todos: Dict[str, Any]):
        """Update todos in storage."""
        data = self._read_data()
        data['todos'] = todos
        self._write_data(data)
        logger.info("Todos updated")
    
    # ============= UTILITY METHODS =============
    
    def clear_all_data(self):
        """Clear all data (for testing purposes)."""
        logger.warning("Clearing all data!")
        self._ensure_storage_exists()
    
    def export_data(self, export_path: str) -> bool:
        """Export data to a specific path."""
        try:
            data = self._read_data()
            with open(export_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"Data exported to: {export_path}")
            return True
        except Exception as e:
            logger.error(f"Error exporting data: {e}")
            return False
    
    def import_data(self, import_path: str) -> bool:
        """Import data from a specific path."""
        try:
            with open(import_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self._write_data(data)
            logger.info(f"Data imported from: {import_path}")
            return True
        except Exception as e:
            logger.error(f"Error importing data: {e}")
            return False


# Global instance
storage = StorageService()
