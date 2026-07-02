import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, PenTool, FileText } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import NoteEditor from "./components/NoteEditor";
import ScribbleBoard from "./components/ScribbleBoard";

export default function Notebook() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null); // The item currently being edited
  const [editorType, setEditorType] = useState(null); // "note" or "scribble"
  const [showDropdown, setShowDropdown] = useState(false);

  const activeWorkspaceId = localStorage.getItem("activeWorkspaceId");
  const token = localStorage.getItem("token");

  const fetchItems = async () => {
    if (!activeWorkspaceId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notebooks/?workspace_id=${activeWorkspaceId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Error fetching notebook items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeWorkspaceId]);

  const handleCreate = async (type) => {
    setShowDropdown(false);
    const newItem = {
      title: type === "note" ? "New Note" : "New Scribble",
      item_type: type,
      content: "",
      workspace_id: parseInt(activeWorkspaceId)
    };
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notebooks/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        const savedItem = await res.json();
        setItems([savedItem, ...items]);
        setActiveItem(savedItem);
        setEditorType(type);
      } else {
        const errText = await res.text();
        console.error("Backend error:", errText);
        alert("Failed to create notebook item. " + errText);
      }
    } catch (err) {
      console.error("Error creating item", err);
      alert("Network error: Could not reach the server.");
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notebooks/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setItems(items.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error("Error deleting item", err);
    }
  };

  const handleOpen = (item) => {
    setActiveItem(item);
    setEditorType(item.item_type);
  };

  const handleCloseEditor = () => {
    setActiveItem(null);
    setEditorType(null);
    fetchItems(); // Refresh to get updated content/timestamps
  };

  if (activeItem && editorType === "note") {
    return <NoteEditor item={activeItem} onClose={handleCloseEditor} token={token} />;
  }

  if (activeItem && editorType === "scribble") {
    return <ScribbleBoard item={activeItem} onClose={handleCloseEditor} token={token} />;
  }

  return (
    <MainLayout>
      <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Notebook</h1>
            <p className="text-slate-400">Your personal space for notes and sketches.</p>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1e1e2d] border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
                <button 
                  onClick={() => handleCreate("note")}
                  className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center transition-colors border-b border-slate-700"
                >
                  <FileText className="w-4 h-4 mr-3 text-indigo-400" />
                  Text Note
                </button>
                <button 
                  onClick={() => handleCreate("scribble")}
                  className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center transition-colors"
                >
                  <PenTool className="w-4 h-4 mr-3 text-emerald-400" />
                  Scribble Board
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-slate-400">Loading your notebook...</div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl bg-[#13131a] bg-opacity-50">
            <Edit3 className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Your notebook is empty</h3>
            <p className="text-slate-500 max-w-md text-center">
              Click the Create button to start jotting down text notes or hand-drawn scribbles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(item => (
              <div 
                key={item.id} 
                onClick={() => handleOpen(item)}
                className="bg-[#1e1e2d] border border-slate-700 rounded-xl p-5 cursor-pointer hover:border-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-500/10 group flex flex-col h-48"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    {item.item_type === "note" ? (
                      <FileText className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <PenTool className="w-5 h-5 text-emerald-400" />
                    )}
                    <h3 className="text-lg font-semibold text-white truncate max-w-[150px]">{item.title}</h3>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(item.id, e)}
                    className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  {item.item_type === "note" ? (
                    <p className="text-slate-400 text-sm line-clamp-4">
                      {item.content ? item.content.replace(/<[^>]*>?/gm, '') : "Empty note..."}
                    </p>
                  ) : (
                    <div className="w-full h-full bg-[#13131a] rounded flex items-center justify-center overflow-hidden border border-slate-800">
                      {item.content ? (
                        <img src={item.content} alt="Scribble thumbnail" className="w-full h-full object-contain opacity-70" />
                      ) : (
                        <span className="text-slate-600 text-xs">Blank board</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500">
                    Modified: {new Date(item.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
