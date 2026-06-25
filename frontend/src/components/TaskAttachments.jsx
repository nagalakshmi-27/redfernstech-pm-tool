import { useState, useEffect, useRef } from "react";
import { Paperclip, Upload, File as FileIcon, Download, Trash2 } from "lucide-react";

export default function TaskAttachments({ taskId }) {
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (taskId) {
      fetchAttachments();
    }
  }, [taskId]);

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}/attachments`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        setAttachments(await response.json());
      }
    } catch {
      console.error("Error fetching attachments");
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}/attachments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
      });

      if (response.ok) {
        const newAttachment = await response.json();
        setAttachments([...attachments, newAttachment]);
      } else {
        alert("Error uploading file");
      }
    } catch {
      alert("Error uploading file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (attachmentId) => {
    if (!confirm("Are you sure you want to remove this attachment?")) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}/attachments/${attachmentId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });

      if (response.ok) {
        setAttachments(attachments.filter(a => a.id !== attachmentId));
      }
    } catch {
      alert("Error deleting attachment");
    }
  };

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Paperclip size={18} className="text-cyan-400" />
          Attachments
        </h3>
        
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current.click()} 
            disabled={isUploading}
            className="flex items-center gap-2 text-sm bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-lg hover:bg-cyan-500/30 transition disabled:opacity-50"
          >
            <Upload size={14} /> 
            {isUploading ? "Uploading..." : "Add File"}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
        {attachments.length === 0 ? (
          <p className="text-sm text-slate-400 col-span-2">No attachments yet.</p>
        ) : (
          attachments.map(attachment => (
            <div key={attachment.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10 group hover:border-cyan-500/30 transition">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  <FileIcon size={20} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-slate-200 truncate" title={attachment.file_name}>
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(attachment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <a 
                  href={`${import.meta.env.VITE_API_URL}${attachment.file_url}`} 
                  download 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-white/10 rounded-md transition"
                  title="Download"
                >
                  <Download size={14} />
                </a>
                <button 
                  onClick={() => handleDelete(attachment.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-md transition"
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
