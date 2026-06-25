import { useState, useEffect, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { FileText, Plus, Save, Edit, Link, Upload, File as FileIcon, Download, ExternalLink, Trash2 } from "lucide-react";

export default function ProjectWiki({ projectId, currentUserRole }) {
  const [wikis, setWikis] = useState([]);
  const [activeWiki, setActiveWiki] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [docType, setDocType] = useState("text"); // text, file, link
  const [fileUrl, setFileUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchWikis();
  }, [projectId]);

  const fetchWikis = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/wikis`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWikis(data);
        if (data.length > 0 && !activeWiki) {
          selectWiki(data[0]);
        }
      }
    } catch {
      console.error("Failed to load wikis");
    }
  };

  const selectWiki = (wiki) => {
    setActiveWiki(wiki);
    setTitle(wiki.title);
    setContent(wiki.content || "");
    setDocType(wiki.doc_type || "text");
    setFileUrl(wiki.file_url || "");
    setSelectedFile(null);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    setActiveWiki(null);
    setTitle("");
    setContent("");
    setDocType("text");
    setFileUrl("");
    setSelectedFile(null);
    setIsEditing(true);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Title is required.");
      return;
    }

    try {
      let url = activeWiki 
        ? `${import.meta.env.VITE_API_URL}/projects/${projectId}/wikis/${activeWiki.id}`
        : `${import.meta.env.VITE_API_URL}/projects/${projectId}/wikis`;
      let method = activeWiki ? "PUT" : "POST";
      let response;

      if (docType === "file" && selectedFile && !activeWiki) {
        url = `${import.meta.env.VITE_API_URL}/projects/${projectId}/wikis/upload`;
        const formData = new FormData();
        formData.append("title", title);
        formData.append("file", selectedFile);
        
        response = await fetch(url, {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${localStorage.getItem("token")}` 
          },
          body: formData
        });
      } else {
        response = await fetch(url, {
          method: method,
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}` 
          },
          body: JSON.stringify({ 
            title, 
            content: docType === "text" ? content : null,
            doc_type: docType,
            file_url: docType === "link" ? fileUrl : (activeWiki ? activeWiki.file_url : null)
          })
        });
      }
      
      if (response.ok) {
        const savedWiki = await response.json();
        if (activeWiki) {
           setWikis(wikis.map(w => w.id === savedWiki.id ? savedWiki : w));
        } else {
           setWikis([...wikis, savedWiki]);
        }
        selectWiki(savedWiki);
      } else {
        alert("Not authorized or error saving wiki");
      }
    } catch {
      alert("Error saving wiki");
    }
  };

  const handleDelete = async () => {
    if (!activeWiki) return;
    if (!confirm(`Are you sure you want to delete "${activeWiki.title}"?`)) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/wikis/${activeWiki.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        setWikis(wikis.filter(w => w.id !== activeWiki.id));
        setActiveWiki(null);
        setIsEditing(false);
      } else {
        alert("Failed to delete document");
      }
    } catch {
      alert("Error deleting document");
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 h-[600px] flex overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <div className="w-64 border-r border-white/10 bg-black/20 flex flex-col">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 text-slate-200">
          <h3 className="font-bold flex items-center gap-2"><FileText size={18}/> Docs</h3>
          {currentUserRole !== "Client" && (
            <button onClick={handleCreateNew} className="text-cyan-400 hover:bg-cyan-500/20 p-1 rounded transition">
              <Plus size={18} />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {wikis.length === 0 ? (
            <p className="text-xs text-slate-400 p-2 text-center mt-4">No docs yet.</p>
          ) : (
            wikis.map(w => (
              <button
                key={w.id}
                onClick={() => selectWiki(w)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition flex items-center gap-2 ${
                  activeWiki?.id === w.id ? "bg-cyan-500/20 text-cyan-300 font-semibold" : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
                }`}
              >
                {w.doc_type === "file" ? <FileIcon size={14} /> : w.doc_type === "link" ? <Link size={14} /> : <FileText size={14} />}
                <span className="truncate">{w.title}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Editor / Viewer */}
      <div className="flex-1 flex flex-col bg-transparent text-slate-200">
        {isEditing ? (
          <div className="h-full flex flex-col p-6">
            <input 
              type="text" 
              placeholder="Document Title..." 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-2xl font-bold bg-transparent text-white border-b border-transparent hover:border-white/20 focus:border-cyan-500 focus:outline-none mb-4 pb-2 transition"
            />
            
            {!activeWiki && (
              <div className="flex gap-4 mb-4 text-slate-300">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={docType === "text"} onChange={() => setDocType("text")} className="accent-cyan-500" />
                  Rich Text
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={docType === "file"} onChange={() => setDocType("file")} className="accent-cyan-500" />
                  Upload File
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={docType === "link"} onChange={() => setDocType("link")} className="accent-cyan-500" />
                  External Link
                </label>
              </div>
            )}

            <div className="flex-1 overflow-hidden flex flex-col">
              {docType === "text" && (
                <div className="bg-white/90 text-black rounded-xl overflow-hidden h-[80%]">
                  <ReactQuill 
                    theme="snow" 
                    value={content} 
                    onChange={setContent} 
                    className="h-full custom-quill-editor" 
                  />
                </div>
              )}

              {docType === "file" && (
                <div className="flex-1 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center bg-black/20">
                  <Upload size={48} className="text-slate-400 mb-4" />
                  <p className="text-slate-300 mb-2">Upload a document (PDF, Word, etc.)</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current.click()} 
                    className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition"
                  >
                    Select File
                  </button>
                  {selectedFile && <p className="mt-4 text-sm font-semibold text-cyan-400">{selectedFile.name}</p>}
                </div>
              )}

              {docType === "link" && (
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-slate-300">Document URL (e.g., Google Docs)</label>
                  <input 
                    type="url" 
                    placeholder="https://docs.google.com/..." 
                    value={fileUrl}
                    onChange={e => setFileUrl(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-3 border-t border-white/10 pt-4">
              <button onClick={() => activeWiki ? selectWiki(activeWiki) : setIsEditing(false)} className="px-4 py-2 text-slate-400 hover:bg-white/10 hover:text-slate-200 rounded-lg transition">Cancel</button>
              <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition">
                <Save size={16} /> Save Document
              </button>
            </div>
          </div>
        ) : activeWiki ? (
          <div className="p-8 h-full overflow-y-auto flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                {activeWiki.doc_type === "file" ? <FileIcon className="text-cyan-400"/> : activeWiki.doc_type === "link" ? <Link className="text-cyan-400"/> : <FileText className="text-cyan-400"/>}
                {activeWiki.title}
              </h1>
              {currentUserRole !== "Client" && (
                <div className="flex gap-2">
                  {activeWiki.doc_type === "text" && (
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition"
                    >
                      <Edit size={14} /> Edit
                    </button>
                  )}
                  <button 
                    onClick={handleDelete} 
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
            
            {activeWiki.doc_type === "text" && (
              <div className="prose prose-invert max-w-none text-slate-300" dangerouslySetInnerHTML={{ __html: activeWiki.content }} />
            )}

            {activeWiki.doc_type === "file" && activeWiki.file_url && (
              <div className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-xl border border-white/10 p-8">
                {activeWiki.file_url.endsWith(".pdf") ? (
                  <iframe src={`${import.meta.env.VITE_API_URL}${activeWiki.file_url}`} className="w-full h-full rounded-lg" title="PDF Document" />
                ) : (
                  <>
                    <FileIcon size={64} className="text-cyan-400 mb-4" />
                    <p className="text-slate-400 mb-6 text-center max-w-md">This file type cannot be previewed directly in the browser.</p>
                    <a 
                      href={`${import.meta.env.VITE_API_URL}${activeWiki.file_url}`} 
                      download 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition"
                    >
                      <Download size={18} /> Download {activeWiki.title}
                    </a>
                  </>
                )}
              </div>
            )}

            {activeWiki.doc_type === "link" && activeWiki.file_url && (
              <div className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-xl border border-white/10 p-8">
                <Link size={64} className="text-cyan-400 mb-4" />
                <p className="text-slate-400 mb-6 text-center">This is an external document link.</p>
                <a 
                  href={activeWiki.file_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition"
                >
                  <ExternalLink size={18} /> Open External Link
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            Select a document to view, or click + to create one.
          </div>
        )}
      </div>
    </div>
  );
}