import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  ChevronLeft,
  Save,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Highlighter,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Palette,
  Trash2,
  Plus,
  Minus,
  Rows,
  Columns,
  Download,
} from 'lucide-react';

export default function Dashboard({ notebook, onBack, onSaveNotebook }) {
  const [isSaving, setIsSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState('3');
  const [tableCols, setTableCols] = useState('3');
  const [wordCount, setWordCount] = useState(notebook?.wordCount || 0);
  const [characterCount, setCharacterCount] = useState(notebook?.characterCount || 0);
  

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'table-auto border-collapse border border-gray-700 w-full',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-700 bg-gray-800 px-4 py-2 font-bold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-700 px-4 py-2',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-400 underline cursor-pointer',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: notebook?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] px-8 py-6',
      },
    },
  });

  // Auto-save on content change
  useEffect(() => {
    if (!editor) return;

    const saveTimer = setTimeout(() => {
      if (editor.getHTML() !== notebook?.content) {
        handleSave();
      }
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(saveTimer);
  }, [editor?.getHTML()]);

  // Update word and character count in real-time
  useEffect(() => {
    if (!editor) return;

    const updateCounts = () => {
      const text = editor.getText();
      const words = text.split(/\s+/).filter(Boolean).length;
      const characters = text.length;
      setWordCount(words);
      setCharacterCount(characters);
    };

    // Update immediately
    updateCounts();

    // Listen for editor updates
    editor.on('update', updateCounts);

    return () => {
      editor.off('update', updateCounts);
    };
  }, [editor]);

  const handleSave = () => {
    if (!editor) return;

    setIsSaving(true);
    const content = editor.getHTML();
    const text = editor.getText();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const characterCount = text.length;

    onSaveNotebook(notebook.id, content, wordCount, characterCount);

    setTimeout(() => setIsSaving(false), 500);
  };

  const addTableDialog = () => {
    const rows = parseInt(tableRows) || 3;
    const cols = parseInt(tableCols) || 3;

    if (rows < 1 || rows > 20 || cols < 1 || cols > 10) {
      alert('Rows must be 1-20 and columns must be 1-10');
      return;
    }

    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();

    setShowTableModal(false);
    setTableRows('3');
    setTableCols('3');
  };

  const addLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };


  const colors = [
    '#FFFFFF',
    '#EF4444',
    '#F59E0B',
    '#10B981',
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
  ];

  const highlightColors = [
    '#FEE2E2',
    '#FEF3C7',
    '#D1FAE5',
    '#DBEAFE',
    '#EDE9FE',
    '#FCE7F3',
  ];

  if (!editor) {
    return null;
  }

  return (
    <div className="flex-1 bg-black">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.1)] px-6 py-4 bg-black">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-[#1C1C1E] hover:bg-[#262626] transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white font-semibold text-xl">{notebook.name}</h1>
            <p className="text-gray-400 text-sm">
              {wordCount.toLocaleString()} words · {characterCount.toLocaleString()} characters
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full hover:scale-105 transition-all font-medium disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => window.print()}
          className="ml-3 flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full hover:scale-105 transition-all font-medium"
          title="Download as PDF"
        >
          <Download className="w-4 h-4" />
          PDF
        </button>
      </div>

      {/* Editor Toolbar */}
      <div className="border-b border-[rgba(255,255,255,0.1)] bg-black px-6 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Text Formatting */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded-lg transition-all ${
              editor.isActive('bold')
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-lg transition-all ${
              editor.isActive('italic')
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded-lg transition-all ${
              editor.isActive('underline')
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded-lg transition-all ${
              editor.isActive('strike')
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-[rgba(255,255,255,0.1)]" />

          {/* Headings */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded-lg transition-all ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded-lg transition-all ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded-lg transition-all ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-[rgba(255,255,255,0.1)]" />

          {/* Lists */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-lg transition-all ${
              editor.isActive('bulletList')
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded-lg transition-all ${
              editor.isActive('orderedList')
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-2 rounded-lg transition-all ${
              editor.isActive('taskList')
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-[rgba(255,255,255,0.1)]" />

          {/* Code & Quote */}
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded-lg transition-all ${
              editor.isActive('codeBlock')
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded-lg transition-all ${
              editor.isActive('blockquote')
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <Quote className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-[rgba(255,255,255,0.1)]" />

          {/* Alignment */}
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded-lg transition-all ${
              editor.isActive({ textAlign: 'left' })
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded-lg transition-all ${
              editor.isActive({ textAlign: 'center' })
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded-lg transition-all ${
              editor.isActive({ textAlign: 'right' })
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-[rgba(255,255,255,0.1)]" />

          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1C1C1E] transition-all"
            >
              <Palette className="w-4 h-4" />
            </button>
            {showColorPicker && (
              <div className="absolute top-12 left-0 bg-[#1C1C1E] border border-[rgba(255,255,255,0.1)] rounded-lg p-2 flex gap-2 z-10">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setShowColorPicker(false);
                    }}
                    className="w-6 h-6 rounded-full border-2 border-white/20 hover:scale-110 transition-all"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Highlight Picker */}
          <div className="relative">
            <button
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1C1C1E] transition-all"
            >
              <Highlighter className="w-4 h-4" />
            </button>
            {showHighlightPicker && (
              <div className="absolute top-12 left-0 bg-[#1C1C1E] border border-[rgba(255,255,255,0.1)] rounded-lg p-2 flex gap-2 z-10">
                {highlightColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      editor.chain().focus().setHighlight({ color }).run();
                      setShowHighlightPicker(false);
                    }}
                    className="w-6 h-6 rounded-full border-2 border-white/20 hover:scale-110 transition-all"
                    style={{ backgroundColor: color }}
                  />
                ))}
                <button
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setShowHighlightPicker(false);
                  }}
                  className="w-6 h-6 rounded-full border-2 border-white/20 hover:scale-110 transition-all bg-transparent flex items-center justify-center text-white text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-[rgba(255,255,255,0.1)]" />

          {/* Link & Table */}
          <button
            onClick={addLink}
            className={`p-2 rounded-lg transition-all ${
              editor.isActive('link')
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowTableModal(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1C1C1E] transition-all"
            title="Insert table"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          

          {/* Table Controls - Show when cursor is in a table */}
          {editor.isActive('table') && (
            <>
              <div className="w-px h-6 bg-[rgba(255,255,255,0.1)]" />
              
              {/* Row Controls Group */}
              <div className="flex items-center gap-1 px-2 bg-[#0A0A0A] rounded-lg">
                <span className="text-xs text-gray-500 mr-1">Rows:</span>
                <button
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                  className="p-1.5 rounded hover:bg-[#1C1C1E] text-green-400 hover:text-green-300 transition-all"
                  title="Add row above"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="p-1.5 rounded hover:bg-[#1C1C1E] text-green-400 hover:text-green-300 transition-all"
                  title="Add row below"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  className="p-1.5 rounded hover:bg-[#1C1C1E] text-red-400 hover:text-red-300 transition-all"
                  title="Delete row"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Column Controls Group */}
              <div className="flex items-center gap-1 px-2 bg-[#0A0A0A] rounded-lg">
                <span className="text-xs text-gray-500 mr-1">Cols:</span>
                <button
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                  className="p-1.5 rounded hover:bg-[#1C1C1E] text-green-400 hover:text-green-300 transition-all"
                  title="Add column before"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="p-1.5 rounded hover:bg-[#1C1C1E] text-green-400 hover:text-green-300 transition-all"
                  title="Add column after"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  className="p-1.5 rounded hover:bg-[#1C1C1E] text-red-400 hover:text-red-300 transition-all"
                  title="Delete column"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Delete Table */}
              <button
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="p-2 rounded-lg bg-red-900/20 text-red-500 hover:text-red-400 hover:bg-red-900/30 transition-all"
                title="Delete entire table"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          

          <div className="w-px h-6 bg-[rgba(255,255,255,0.1)]" />

          {/* Undo/Redo */}
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1C1C1E] transition-all disabled:opacity-30"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1C1C1E] transition-all disabled:opacity-30"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-6 max-w-5xl mx-auto relative">
        <div className="editor-container relative print-target bg-black">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-md border border-[rgba(255,255,255,0.1)]">
            <h3 className="text-white text-lg font-semibold mb-4">Insert Table</h3>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Rows (1-20)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tableRows}
                  onChange={(e) => setTableRows(e.target.value)}
                  className="w-full bg-[#0A0A0A] text-white px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)] focus:border-white focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addTableDialog();
                  }}
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Columns (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tableCols}
                  onChange={(e) => setTableCols(e.target.value)}
                  className="w-full bg-[#0A0A0A] text-white px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)] focus:border-white focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addTableDialog();
                  }}
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={addTableDialog}
                  className="flex-1 bg-white text-black px-4 py-2 rounded-full hover:scale-105 transition-all font-medium"
                >
                  Insert
                </button>
                <button
                  onClick={() => {
                    setShowTableModal(false);
                    setTableRows('3');
                    setTableCols('3');
                  }}
                  className="flex-1 bg-[#262626] text-white px-4 py-2 rounded-full hover:bg-[#333333] transition-all font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
