import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Save, Download, Sparkles, RotateCcw } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export default function NoteEditor({ item, onClose, token }) {
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content || "");
  const [saving, setSaving] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false); // <--- AI Loading state
  const [originalContent, setOriginalContent] = useState(item.original_content || null);
  const saveTimeoutRef = useRef(null);

  const modules = {
    toolbar: [
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
      ['clean']
    ],
  };

  const formats = [
    'size', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list'];

  const saveToBackend = async (newTitle, newContent, newOriginalContent = originalContent, isClosing = false) => {
    setSaving(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/notebooks/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: newTitle, 
          content: newContent,
          original_content: newOriginalContent // <--- Sends the backup to the DB
        })
      });
      if (isClosing) onClose();
    } catch (err) {
      console.error("Failed to save note", err);
    } finally {
      setSaving(false);
    }
  };

  // --- NEW AI CLEANUP FUNCTION ---
  const handleAiCleanup = async () => {
    if (!content.trim() || content === '<p><br></p>') return; 
    
    setIsCleaning(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl.replace('/api/v1', '')}/api/ai/notes/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ raw_note: content }),
      });
      if (!response.ok) throw new Error('Failed to clean up note.');
      
      const data = await response.json();
      
      // Update state
      setOriginalContent(content);
      setContent(data.cleaned_note);
      
      // Instantly save BOTH the new AI text and the original backup to the DB
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveToBackend(title, data.cleaned_note, content), 500);
    } catch (err) {
      console.error(err);
      alert('AI Cleanup failed: ' + err.message);
    } finally {
      setIsCleaning(false);
    }
  };
  const handleRevert = () => {
    if (originalContent !== null) {
      setContent(originalContent);
      setOriginalContent(null);
      
      // Instantly save the reverted text and delete the backup from the DB
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveToBackend(title, originalContent, null), 500);
    }
  };

  const handleExport = () => {
    const plainText = content.replace(/<[^>]*>?/gm, ''); 
    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'Note'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveToBackend(newTitle, content), 1000);
  };

  const handleContentChange = (value) => {
    setContent(value);
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveToBackend(title, value), 1000);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0b0b12] z-50 flex flex-col note-editor-container">
      {/* GLOBAL OVERRIDES FOR QUILL TO MATCH DARK THEME */}
      <style dangerouslySetInnerHTML={{__html: `
        .note-editor-container .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid #1e293b;
          background-color: #1e1e2d;
          padding: 8px 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        @media (min-width: 640px) {
          .note-editor-container .ql-toolbar.ql-snow {
            padding: 12px 24px;
          }
        }
        .note-editor-container .ql-container.ql-snow {
          border: none;
          font-family: inherit;
          font-size: 1.125rem;
          color: #cbd5e1;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
        }
        .note-editor-container .ql-editor {
          padding: 24px;
          min-height: 100%;
        }
        .note-editor-container .ql-editor.ql-blank::before {
          color: #475569;
          font-style: normal;
        }
        .note-editor-container .ql-snow .ql-stroke { stroke: #94a3b8; }
        .note-editor-container .ql-snow .ql-fill { fill: #94a3b8; }
        .note-editor-container .ql-snow .ql-picker { color: #94a3b8; }
        .note-editor-container .ql-snow .ql-picker-options {
          background-color: #1e1e2d;
          border-color: #334155;
        }
        .note-editor-container .ql-snow.ql-toolbar button:hover .ql-stroke, 
        .note-editor-container .ql-snow .ql-toolbar button:hover .ql-stroke, 
        .note-editor-container .ql-snow.ql-toolbar button:focus .ql-stroke, 
        .note-editor-container .ql-snow .ql-toolbar button:focus .ql-stroke, 
        .note-editor-container .ql-snow.ql-toolbar button.ql-active .ql-stroke, 
        .note-editor-container .ql-snow .ql-toolbar button.ql-active .ql-stroke, 
        .note-editor-container .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke, 
        .note-editor-container .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke, 
        .note-editor-container .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke, 
        .note-editor-container .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke, 
        .note-editor-container .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke, 
        .note-editor-container .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke, 
        .note-editor-container .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke, 
        .note-editor-container .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke, 
        .note-editor-container .ql-snow.ql-toolbar button:hover .ql-stroke-miter, 
        .note-editor-container .ql-snow .ql-toolbar button:hover .ql-stroke-miter, 
        .note-editor-container .ql-snow.ql-toolbar button:focus .ql-stroke-miter, 
        .note-editor-container .ql-snow .ql-toolbar button:focus .ql-stroke-miter, 
        .note-editor-container .ql-snow.ql-toolbar button.ql-active .ql-stroke-miter, 
        .note-editor-container .ql-snow .ql-toolbar button.ql-active .ql-stroke-miter, 
        .note-editor-container .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke-miter, 
        .note-editor-container .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke-miter, 
        .note-editor-container .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke-miter, 
        .note-editor-container .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke-miter, 
        .note-editor-container .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke-miter, 
        .note-editor-container .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke-miter, 
        .note-editor-container .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke-miter, 
        .note-editor-container .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke-miter {
          stroke: #818cf8;
        }
        .note-editor-container .ql-snow.ql-toolbar button:hover .ql-fill, 
        .note-editor-container .ql-snow .ql-toolbar button:hover .ql-fill, 
        .note-editor-container .ql-snow.ql-toolbar button:focus .ql-fill, 
        .note-editor-container .ql-snow .ql-toolbar button:focus .ql-fill, 
        .note-editor-container .ql-snow.ql-toolbar button.ql-active .ql-fill, 
        .note-editor-container .ql-snow .ql-toolbar button.ql-active .ql-fill, 
        .note-editor-container .ql-snow.ql-toolbar .ql-picker-label:hover .ql-fill, 
        .note-editor-container .ql-snow .ql-toolbar .ql-picker-label:hover .ql-fill, 
        .note-editor-container .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-fill, 
        .note-editor-container .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-fill, 
        .note-editor-container .ql-snow.ql-toolbar .ql-picker-item:hover .ql-fill, 
        .note-editor-container .ql-snow .ql-toolbar .ql-picker-item:hover .ql-fill, 
        .note-editor-container .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-fill, 
        .note-editor-container .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-fill {
          fill: #818cf8;
        }
      `}} />

      <div className="min-h-[4rem] py-2 sm:py-0 bg-[#13131a] border-b border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between px-2 sm:px-6 z-10 gap-2">
        <div className="flex items-center flex-1 min-w-[150px]">
          <button 
            onClick={() => saveToBackend(title, content, originalContent, true)}
            className="text-slate-400 hover:text-white mr-2 sm:mr-4 p-2 rounded-full hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={title}
            onChange={handleTitleChange}
            placeholder="Note Title..."
            className="bg-transparent border-none outline-none text-lg sm:text-xl font-semibold text-white w-24 sm:w-auto sm:flex-1 placeholder-slate-600 truncate"
          />
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden sm:block text-sm text-slate-500">
            {saving ? (
              <span className="flex items-center text-indigo-400"><Save className="w-4 h-4 mr-1 animate-pulse" /> Saving...</span>
            ) : (
              <span className="flex items-center"><Save className="w-4 h-4 mr-1" /> Auto-saved</span>
            )}
          </div>
           {/* REVERT BUTTON (Only shows if there is a backup) */}
          {originalContent && (
            <button 
              onClick={handleRevert}
              className="flex items-center p-2 sm:px-3 sm:py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-lg shadow-orange-500/20"
              title="Revert AI Cleanup"
            >
              <RotateCcw className="w-5 h-5" /> 
            </button>
          )}
          {/* NEW AI BUTTON */}
          <button 
            onClick={handleAiCleanup}
            disabled={isCleaning}
            className="flex items-center p-2 sm:px-4 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50"
            title="AI Cleanup"
          >
            <Sparkles className={`w-4 h-4 sm:mr-2 ${isCleaning ? 'animate-pulse' : ''}`} /> 
            <span className="hidden sm:inline">{isCleaning ? 'Cleaning...' : 'AI Cleanup ✨'}</span>
          </button>

          <button 
            onClick={handleExport}
            className="flex items-center p-2 sm:px-4 sm:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors border border-slate-600"
            title="Download as TXT"
          >
            <Download className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Export</span>
          </button>
          
          <button 
            onClick={() => saveToBackend(title, content, originalContent, true)}
            className="flex items-center p-2 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
            title="Save & Close"
          >
            <Save className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Save & Close</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col bg-[#13131a] border-x border-slate-800 min-h-0">
        <ReactQuill 
          theme="snow"
          value={content}
          onChange={handleContentChange}
          modules={modules}
          formats={formats}
          placeholder="Start typing your note here..."
          className="flex-1 flex flex-col h-full min-h-0"
        />
      </div>
    </div>
  );
}