import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { FileText, Plus, Save, Edit, Link, Upload, File as FileIcon, Download, ExternalLink, Trash2 } from "lucide-react";
import CreateIssueModal from "../../components/CreateIssueModal";

export default function ProjectWiki({ projectId, currentUserRole }) {
  const [wikis, setWikis] = useState([]);
  const [activeWiki, setActiveWiki] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [docType, setDocType] = useState("text"); // text, file, link
  const [fileUrl, setFileUrl] = useState("");
const [docCategory, setDocCategory] = useState("");
const [selectedFile, setSelectedFile] = useState(null);

const [search, setSearch] = useState("");
const [filterCategory, setFilterCategory] = useState("");
const [sortOrder, setSortOrder] = useState("latest");
const [showHistory, setShowHistory] = useState(false);
const [versionHistory, setVersionHistory] = useState([]);
const [selectedVersion, setSelectedVersion] = useState(null);

  const [highlightedText, setHighlightedText] = useState("");
  const [tooltipPos, setTooltipPos] = useState(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [highlightRange, setHighlightRange] = useState(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setTooltipPos(null);
      setHighlightedText("");
      setHighlightRange(null);
      return;
    }
    const text = selection.toString().trim();
    if (text) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setTooltipPos({ top: rect.top - 45, left: rect.left + (rect.width / 2) });
      setHighlightedText(text);
      setHighlightRange(range.cloneRange());
    }
  }, []);

  const handleTaskCreated = async (newTask) => {
    if (!highlightRange || !activeWiki) return;
    
    try {
      const a = document.createElement("a");
      a.href = `?tab=Wiki&wikiId=${activeWiki.id}&taskId=${newTask.id}`;
      a.className = "bg-yellow-500/30 text-yellow-200 border-b-2 border-yellow-500/50 hover:bg-yellow-500/50 transition-colors cursor-pointer no-underline px-1 rounded-sm";
      a.title = `Linked Task: ${newTask.name}`;
      
      a.appendChild(highlightRange.extractContents());
      highlightRange.insertNode(a);

      const proseDiv = document.querySelector(".prose");
      if (proseDiv) {
        const newContent = proseDiv.innerHTML;
        
        await fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/wikis/${activeWiki.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ 
             title: activeWiki.title, 
             category: activeWiki.category,
             content: newContent, 
             doc_type: activeWiki.doc_type, 
             file_url: activeWiki.file_url 
          })
        });
        
        setActiveWiki({ ...activeWiki, content: newContent });
        setContent(newContent);
      }
    } catch(err) {
      console.error("Could not apply ghost highlight:", err);
    }
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setTooltipPos(null);
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const fileInputRef = useRef(null);

  const wikiContentDiv = useMemo(() => {
    if (!activeWiki || activeWiki.doc_type !== "text") return null;
    return (
      <div 
        className="prose prose-invert !max-w-full w-full min-w-0 text-slate-300 relative !break-words overflow-x-hidden !whitespace-pre-wrap" 
        dangerouslySetInnerHTML={{ __html: activeWiki.content }} 
        onMouseUp={handleMouseUp}
      />
    );
  }, [activeWiki?.content, activeWiki?.doc_type, handleMouseUp]);

  const selectWiki = (wiki) => {
    setActiveWiki(wiki);
    setTitle(wiki.title);
    setContent(wiki.content || "");
    setDocType(wiki.doc_type || "text");
    setFileUrl(wiki.file_url || "");
    setDocCategory(wiki.category || "");
    setSelectedFile(null);
    setIsEditing(false);
  };


  const fetchWikis = async () => {
    try {
      const params = new URLSearchParams();

if (search)
    params.append("search", search);

if (filterCategory)
    params.append("category", filterCategory);

params.append("sort", sortOrder);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/wikis${queryStr}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWikis(data);
        if (data.length > 0 && !activeWiki) {
          const urlParams = new URLSearchParams(window.location.search);
          const wikiId = urlParams.get("wikiId");
          if (wikiId) {
             const targetWiki = data.find(w => w.id === parseInt(wikiId));
             if (targetWiki) selectWiki(targetWiki);
             else selectWiki(data[0]);
          } else {
             selectWiki(data[0]);
          }
        }
      }
    } catch {
      console.error("Failed to load wikis");
    }
  };
  
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
        fetchWikis();
    },300);

    return ()=>clearTimeout(delayDebounceFn);

},[
    projectId,
    search,
    filterCategory,
    sortOrder
]);

  const handleCreateNew = () => {
    setActiveWiki(null);
    setTitle("");
    setContent("");
    setDocType("text");
    setFileUrl("");
    setDocCategory("");
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
        formData.append("category", docCategory);
        
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
            category: docCategory,
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
  const fetchVersionHistory = async () => {
  if (!activeWiki) return;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/projects/${projectId}/wikis/${activeWiki.id}/history`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      setVersionHistory(data);
    } else {
      alert("Failed to load version history");
    }
  } catch {
    alert("Error loading version history");
  }
};

  const handleRestoreVersion = async (versionId) => {
    if (!confirm("Are you sure you want to restore this version? Your current document will be overwritten (but a snapshot of it will be saved).")) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/projects/${projectId}/wikis/${activeWiki.id}/restore/${versionId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const restoredWiki = await response.json();
        setWikis(wikis.map(w => w.id === restoredWiki.id ? restoredWiki : w));
        selectWiki(restoredWiki);
        setShowHistory(false);
      } else {
        alert("Failed to restore version");
      }
    } catch {
      alert("Error restoring version");
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
    <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 h-[80vh] md:h-[600px] min-h-[500px] md:min-h-[600px] flex flex-col md:flex-row overflow-hidden w-full max-w-full">
      
      {/* LEFT SIDEBAR */}
      <div className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-black/20 flex flex-col max-w-full md:max-w-[256px] max-h-[35vh] md:max-h-full">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 text-slate-200">
          <h3 className="font-bold flex items-center gap-2"><FileText size={18}/> Docs</h3>
          {currentUserRole !== "Client" && (
            <button onClick={handleCreateNew} className="text-cyan-400 hover:bg-cyan-500/20 p-1 rounded transition">
              <Plus size={18} />
            </button>
          )}
        </div>
        <div className="p-3 border-b border-white/10 space-y-3">
  <input
    type="text"
    placeholder="Search documents..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
  />

  <select
  value={filterCategory}
  onChange={(e) => setFilterCategory(e.target.value)}
  className="w-full bg-slate-900/70 border border-white/10 text-slate-200 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
>
  <option className="bg-slate-900 text-white" value="">
  All Categories
</option>

<option className="bg-slate-900 text-white" value="Technical">
  Technical
</option>

<option className="bg-slate-900 text-white" value="Meeting Notes">
  Meeting Notes
</option>

<option className="bg-slate-900 text-white" value="Design">
  Design
</option>

<option className="bg-slate-900 text-white" value="Others">
  Others
</option>
</select>
<select
  value={sortOrder}
  onChange={(e) => setSortOrder(e.target.value)}
  className="w-full bg-slate-900/70 border border-white/10 text-slate-200 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
>
  <option className="bg-slate-900 text-white" value="latest">
    Latest First
  </option>

  <option className="bg-slate-900 text-white" value="oldest">
    Latest Last
  </option>
</select>
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
      <div className="flex-1 flex flex-col relative min-w-0 max-w-full overflow-hidden bg-transparent text-slate-200">
        {isEditing ? (
          <div className="h-full flex flex-col p-6">
            <input 
              type="text" 
              placeholder="Document Title..." 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-2xl font-bold bg-transparent text-white border-b border-transparent hover:border-white/20 focus:border-cyan-500 focus:outline-none mb-4 pb-2 transition"
            />
            <div className="mb-4">
  <label className="block text-sm font-medium text-slate-300 mb-2">
    Category
  </label>

  <select
  value={docCategory}
  onChange={(e) => setDocCategory(e.target.value)}
  className="w-full bg-slate-900/70 border border-white/10 text-slate-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none"
>
  <option value="">Select Category</option>

<option value="Technical">
Technical
</option>

<option value="Meeting Notes">
Meeting Notes
</option>

<option value="Design">
Design
</option>

<option value="Others">
Others
</option>
</select>
</div>
            
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
          <div className="p-8 h-full overflow-y-auto overflow-x-hidden flex flex-col min-w-0 max-w-full">
            <div className="flex flex-wrap justify-between items-start mb-6 shrink-0 gap-4 w-full">
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3 break-words w-full sm:flex-1 min-w-0">
                {activeWiki.doc_type === "file" ? <FileIcon className="text-cyan-400"/> : activeWiki.doc_type === "link" ? <Link className="text-cyan-400"/> : <FileText className="text-cyan-400"/>}
                {activeWiki.title}
              </h1>
              {currentUserRole !== "Client" && (
                <div className="flex gap-2">
                  <button
  onClick={() => {
    fetchVersionHistory();
    setShowHistory(true);
  }}
  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition"
>
  Version History
</button>
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
            
            {activeWiki.doc_type === "text" && wikiContentDiv}

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

      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
          <div className="w-[400px] h-full bg-slate-900 border-l border-white/10 p-6 overflow-y-auto">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                Version History
              </h2>

              <button
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            {versionHistory.length === 0 ? (
              <p className="text-slate-400">
                No version history available.
              </p>
            ) : (
              versionHistory.map((version) => (
                <div
                  key={version.id}
                  className={`border border-white/10 rounded-lg p-4 mb-3 cursor-pointer transition ${selectedVersion?.id === version.id ? 'bg-white/10 border-cyan-500' : 'hover:bg-white/5'}`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <p className="text-white font-semibold flex justify-between">
                    <span>Version #{version.id}</span>
                    <span className="text-xs text-slate-400">{new Date(version.created_at).toLocaleString()}</span>
                  </p>
                  
                  {selectedVersion?.id === version.id && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="text-sm text-slate-300 mb-4 line-clamp-3 bg-black/30 p-2 rounded">
                         <div dangerouslySetInnerHTML={{ __html: version.content }} />
                      </div>
                      <button 
                        onClick={() => handleRestoreVersion(version.id)}
                        className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium text-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition"
                      >
                        Restore this Version
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}

          </div>
        </div>
      )}
      {tooltipPos && highlightedText && !showCreateTaskModal && (
        <div style={{ top: tooltipPos.top, left: tooltipPos.left, transform: 'translateX(-50%)' }} className="fixed z-50 animate-in fade-in zoom-in duration-200">
          <button 
             onMouseDown={(e) => { 
                e.preventDefault(); 
                setShowCreateTaskModal(true); 
                setTooltipPos(null); 
             }}
             className="bg-cyan-500 text-white px-3 py-1.5 rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex items-center gap-2 text-sm hover:bg-cyan-400 border border-cyan-300 font-medium"
          >
             <Plus size={14} /> Create Task
          </button>
        </div>
      )}

      {showCreateTaskModal && (() => {
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);
        return (
          <CreateIssueModal
             defaultProjectId={projectId}
             defaultTaskName={activeWiki?.title || ""}
             defaultTaskDescription={`${highlightedText}\n\nCreated from document: ${activeWiki?.title}`}
             defaultSourceLink={`${window.location.origin}/projects/${projectId}?tab=Wiki&wikiId=${activeWiki?.id}`}
             defaultAssigneeId={localStorage.getItem("userId")}
             defaultDueDate={nextDay.toISOString().split("T")[0]}
             isOpen={true}
             onClose={() => setShowCreateTaskModal(false)}
             hideTrigger={true}
             onSuccess={handleTaskCreated}
          />
        );
      })()}
    </div>
  );
}