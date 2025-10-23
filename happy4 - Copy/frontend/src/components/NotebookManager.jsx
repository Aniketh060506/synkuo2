import { useState } from 'react';
import {
  Plus,
  BookOpen,
  MoreVertical,
  Grid3x3,
  List,
  Target,
  Trash2,
  Edit2,
  Star,
} from 'lucide-react';

export default function NotebookManager({ notebooks, onCreateNotebook, onSelectNotebook, onDeleteNotebook, onSetTarget, onToggleFavorite }) {
  const [viewMode, setViewMode] = useState('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [hoveredNotebook, setHoveredNotebook] = useState(null);

  const handleCreate = () => {
    if (newNotebookName.trim()) {
      onCreateNotebook(newNotebookName.trim());
      setNewNotebookName('');
      setShowCreateModal(false);
    }
  };

  return (
    <div className="flex-1 p-8 flex justify-center">
      <div className="w-full max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">SynkUp</h1>
            <p className="text-gray-400 text-base">Your productivity workspace</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#1C1C1E] rounded-full p-1 border border-[rgba(255,255,255,0.1)]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'grid' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'list' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full hover:scale-105 transition-all font-medium"
            >
              <Plus className="w-4 h-4" />
              New Notebook
            </button>
          </div>
        </div>
      </div>

      {/* Notebooks Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notebooks.map((notebook) => (
            <div
              key={notebook.id}
              onMouseEnter={() => setHoveredNotebook(notebook.id)}
              onMouseLeave={() => setHoveredNotebook(null)}
              className="relative bg-[#1C1C1E] rounded-3xl p-6 border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all cursor-pointer group"
              onClick={() => onSelectNotebook(notebook)}
            >
              {notebook.isTarget && (
                <div className="absolute top-4 right-4 bg-white text-black px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Target
                </div>
              )}
              {notebook.isFavorite && (
                <div className={`absolute ${notebook.isTarget ? 'top-12' : 'top-4'} right-4`}>
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </div>
              )}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#262626] flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-1">{notebook.name}</h3>
                  <p className="text-gray-400 text-sm">{notebook.wordCount.toLocaleString()} words</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-gray-600">
                  {new Date(notebook.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(notebook.id);
                    }}
                    className="p-2 bg-[#262626] rounded-full hover:bg-[#333333] transition-all"
                    title={notebook.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star className={`w-3 h-3 ${notebook.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-white'}`} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetTarget(notebook.id);
                    }}
                    className="p-2 bg-[#262626] rounded-full hover:bg-[#333333] transition-all"
                  >
                    <Target className="w-3 h-3 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNotebook(notebook.id);
                    }}
                    className="p-2 bg-[#262626] rounded-full hover:bg-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {notebooks.map((notebook) => (
            <div
              key={notebook.id}
              onClick={() => onSelectNotebook(notebook)}
              className="bg-[#1C1C1E] rounded-2xl p-4 border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-base">{notebook.name}</h3>
                  <p className="text-gray-400 text-sm">{notebook.wordCount.toLocaleString()} words</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {notebook.isTarget && (
                  <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Target
                  </span>
                )}
                <span className="text-xs text-gray-600">
                  {new Date(notebook.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(notebook.id);
                    }}
                    className="p-2 bg-[#262626] rounded-full hover:bg-[#333333] transition-all"
                    title={notebook.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star className={`w-3 h-3 ${notebook.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-white'}`} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetTarget(notebook.id);
                    }}
                    className="p-2 bg-[#262626] rounded-full hover:bg-[#333333] transition-all"
                  >
                    <Target className="w-3 h-3 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNotebook(notebook.id);
                    }}
                    className="p-2 bg-[#262626] rounded-full hover:bg-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {notebooks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-[#1C1C1E] flex items-center justify-center mb-4">
            <BookOpen className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">No notebooks yet</h3>
          <p className="text-gray-400 text-center mb-6">Create your first notebook to start writing</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full hover:scale-105 transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Notebook
          </button>
        </div>
      )}

      {/* Create Notebook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-[#1C1C1E] rounded-3xl p-8 w-full max-w-md border border-[rgba(255,255,255,0.1)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white text-2xl font-bold mb-4">Create New Notebook</h2>
            <input
              type="text"
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Enter notebook name..."
              className="w-full px-4 py-3 bg-[#0A0A0A] border border-[rgba(255,255,255,0.1)] rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-[rgba(255,255,255,0.3)] mb-6"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 bg-[#262626] text-white rounded-full hover:bg-[#333333] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2.5 bg-white text-black rounded-full hover:scale-105 transition-all font-medium"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
