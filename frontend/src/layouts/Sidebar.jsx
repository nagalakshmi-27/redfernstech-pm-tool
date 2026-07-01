import { useContext, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { LogOut, Plus, MoreVertical } from "lucide-react";
import AppContext from "../context/AppContext";

export default function Sidebar() {
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [createError, setCreateError] = useState("");
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState("");
  const [showDeleteWorkspaceModal, setShowDeleteWorkspaceModal] = useState(false);
  const [deleteWorkspaceConfirm, setDeleteWorkspaceConfirm] = useState("");
  const [deleteWorkspaceError, setDeleteWorkspaceError] = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferError, setTransferError] = useState("");

  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [actionWorkspaceId, setActionWorkspaceId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const dropdownRef = useRef(null);
  const portalRef = useRef(null);

  const currentUserId = Number(localStorage.getItem("userId"));
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, activeWorkspaceRole, members } = useContext(AppContext);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target);
      const isOutsidePortal = portalRef.current ? !portalRef.current.contains(event.target) : true;
      if (isOutsideDropdown && isOutsidePortal) {
        setShowDropdown(false);
        setWorkspaceDropdownOpen(false);
      }
    };
    const handleScroll = () => {
      setShowDropdown(false);
      setWorkspaceDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, []);

  const activeWorkspace = workspaces?.find(w => w.id === Number(activeWorkspaceId));
  const actionWorkspace = workspaces?.find(w => w.id === Number(actionWorkspaceId));
  const isOwner = activeWorkspace?.owner_id === currentUserId;
  const eligibleMembers = members?.filter(m => m.role !== "Client" && m.id !== currentUserId) || [];
  
  const handleLeaveWorkspace = async () => {
    setLeaveError("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/workspaces/${activeWorkspaceId}/leave`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        window.location.reload();
      } else {
        const errData = await response.json();
        setLeaveError(errData.detail || "Failed to leave workspace");
      }
    } catch (err) {
      setLeaveError("Failed to connect to server");
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      setCreateError("Workspace name cannot be empty");
      return;
    }
    setCreateError("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/workspaces/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ name: newWorkspaceName })
      });
      if (response.ok) {
        window.location.reload();
      } else {
        const errData = await response.json();
        setCreateError(errData.detail || "Failed to create workspace");
      }
    } catch (err) {
      setCreateError("Failed to connect to server");
    }
  };

  const handleRenameWorkspace = async () => {
    if (!renameValue.trim()) return;
    setRenameError("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/workspaces/${actionWorkspaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ name: renameValue })
      });
      if (response.ok) window.location.reload();
      else {
        const err = await response.json();
        setRenameError(err.detail || "Failed to rename");
      }
    } catch {
      setRenameError("Failed to connect");
    }
  };

  const handleTransferWorkspace = async () => {
    if (!transferTargetId) return;
    setTransferError("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/workspaces/${actionWorkspaceId}/transfer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ new_owner_id: Number(transferTargetId) })
      });
      if (response.ok) window.location.reload();
      else {
        const err = await response.json();
        setTransferError(err.detail || "Failed to transfer");
      }
    } catch {
      setTransferError("Failed to connect");
    }
  };

  const handleDeleteWorkspace = async () => {
    if (deleteWorkspaceConfirm !== actionWorkspace?.name) {
      setDeleteWorkspaceError("Name does not match");
      return;
    }
    setDeleteWorkspaceError("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/workspaces/${actionWorkspaceId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) window.location.reload();
      else {
        const err = await response.json();
        setDeleteWorkspaceError(err.detail || "Failed to delete");
      }
    } catch {
      setDeleteWorkspaceError("Failed to connect");
    }
  };

  const currentUserRole = activeWorkspaceRole;
  return (
    <div className="w-56 min-h-screen bg-white/5 backdrop-blur-lg border-r border-white/10 text-white flex flex-col">
      {/* Logo / App Name */}
      <div className="h-16 px-5 border-b border-white/10 flex items-center">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
          RedFerns PM
        </h1>
      </div>

      {/* Workspace Switcher */}
      {workspaces && workspaces.length > 0 && (
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-gray-400 uppercase tracking-wider block">
              Workspace
            </label>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                title="Create Workspace"
              >
                <Plus size={14} /> New
              </button>
              <button 
                onClick={() => setShowLeaveModal(true)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                title="Leave Workspace"
              >
                <LogOut size={14} /> Leave
              </button>
            </div>
          </div>
          <div className="relative flex-1" ref={dropdownRef}>
            <button
              onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-left text-white focus:outline-none focus:ring-1 focus:ring-purple-500 flex justify-between items-center transition hover:bg-white/10"
            >
              <span className="truncate">{activeWorkspace?.name || "Select Workspace"} {isOwner ? "(Personal)" : ""}</span>
              <span className="ml-2 text-slate-400 text-xs">▼</span>
            </button>

            {workspaceDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-slate-800 border border-white/10 shadow-xl rounded-lg py-1 z-40 max-h-60 overflow-y-auto">
                {workspaces.map((ws) => (
                  <div key={ws.id} className="flex flex-col border-b border-white/5 last:border-0">
                    <div className="group flex items-center justify-between px-3 py-2 hover:bg-white/10 cursor-pointer">
                      <div 
                        className="flex-1 truncate text-sm text-slate-200"
                        onClick={() => { setActiveWorkspaceId(ws.id); setWorkspaceDropdownOpen(false); setShowDropdown(false); }}
                      >
                        {ws.name} {ws.owner_id === currentUserId ? "(Personal)" : ""}
                      </div>
                      
                      {ws.owner_id === currentUserId && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation();
                            if (actionWorkspaceId === ws.id && showDropdown) {
                              setShowDropdown(false);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDropdownPos({ top: rect.top, left: rect.right + 8 });
                              setActionWorkspaceId(ws.id);
                              setShowDropdown(true);
                            }
                          }}
                          className="p-1 hover:bg-white/20 rounded-md transition text-slate-400 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <MoreVertical size={16} />
                        </button>
                      )}
                    </div>
                    {actionWorkspaceId === ws.id && showDropdown && ws.owner_id === currentUserId && createPortal(
                      <div 
                        ref={portalRef}
                        className="fixed z-[100] w-48 bg-slate-800 border border-white/10 shadow-2xl rounded-lg py-1 flex flex-col"
                        style={{ top: dropdownPos.top, left: dropdownPos.left }}
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowRenameModal(true); setRenameValue(ws.name || ""); setShowDropdown(false); setWorkspaceDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
                        >
                          Rename
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowTransferModal(true); setShowDropdown(false); setWorkspaceDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
                        >
                          Transfer
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowDeleteWorkspaceModal(true); setDeleteWorkspaceConfirm(""); setShowDropdown(false); setWorkspaceDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                      </div>,
                      document.body
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="p-4">
        <ul className="space-y-4">
          <li>
            <Link
              to="/dashboard"
              className="block px-4 py-3 rounded-lg hover:bg-white/10 transition"
            >
              Dashboard
            </Link>
          </li>

          <li>
            <Link
              to="/projects"
              className="block px-4 py-3 rounded-lg hover:bg-white/10 transition"
            >
              Projects
            </Link>
          </li>

          {currentUserRole !== "Client" && (
            <>
              <li>
                <Link
                  to="/tasks"
                  className="block px-4 py-3 rounded-lg hover:bg-white/10 transition"
                >
                  My Tasks
                </Link>
              </li>

              <li>
                <Link
                  to="/teams"
                  className="block px-4 py-3 rounded-lg hover:bg-white/10 transition"
                >
                  Teams
                </Link>
              </li>
            </>
          )}

          <li>
            <Link
              to="/calendar"
              className="block px-4 py-3 rounded-lg hover:bg-white/10 transition"
            >
              Calendar
            </Link>
          </li>

          <li>
            <Link
              to="/notifications"
              className="block px-4 py-3 rounded-lg hover:bg-white/10 transition"
            >
              Notifications
            </Link>
          </li>

          <li>
            <Link
              to="/settings"
              className="block px-4 py-3 rounded-lg hover:bg-white/10 transition"
            >
              Settings
            </Link>
          </li>
        </ul>
      </nav>

      {/* Leave Workspace Modal */}
      {showLeaveModal && createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#141a2d] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-3">
              Leave Workspace
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Are you sure you want to leave this workspace? You will lose access to all projects and tasks inside it.
            </p>
            {leaveError && (
              <div className="bg-red-500/20 text-red-300 border border-red-500/30 p-3 rounded-lg mb-4 text-sm">
                {leaveError}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowLeaveModal(false); setLeaveError(""); }}
                className="px-5 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveWorkspace}
                className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Leave
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#141a2d] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 mb-3">
              Create New Workspace
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Enter a name for your new workspace. You will be set as the Owner.
            </p>
            <input
              type="text"
              placeholder="Workspace Name"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 mb-4"
            />
            {createError && (
              <div className="bg-red-500/20 text-red-300 border border-red-500/30 p-3 rounded-lg mb-4 text-sm">
                {createError}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(""); setNewWorkspaceName(""); }}
                className="px-5 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkspace}
                className="px-5 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showRenameModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Rename Workspace</h2>
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">New Name</label>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
                placeholder="Workspace Name"
              />
            </div>
            {renameError && <p className="text-red-400 text-sm mb-4">{renameError}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRenameModal(false)} className="px-5 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5">Cancel</button>
              <button onClick={handleRenameWorkspace} className="px-5 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700">Save</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showTransferModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Transfer Workspace</h2>
            <p className="text-sm text-slate-400 mb-4">Transfer ownership to another Admin. You will lose owner privileges.</p>
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">Select New Owner</label>
              <select
                value={transferTargetId}
                onChange={(e) => setTransferTargetId(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="" className="text-slate-900 bg-slate-100">Select a teammate</option>
                {eligibleMembers.map(m => (
                  <option key={m.id} value={m.id} className="text-slate-900 bg-slate-100">{m.name}</option>
                ))}
              </select>
            </div>
            {transferError && <p className="text-red-400 text-sm mb-4">{transferError}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowTransferModal(false)} className="px-5 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5">Cancel</button>
              <button onClick={handleTransferWorkspace} className="px-5 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700">Transfer</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showDeleteWorkspaceModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-red-500 mb-4">Delete Workspace</h2>
            <p className="text-sm text-slate-300 mb-4">This action is permanent and will delete all projects and tasks. Type <strong>{actionWorkspace?.name}</strong> to confirm.</p>
            <div className="mb-4">
              <input
                type="text"
                value={deleteWorkspaceConfirm}
                onChange={(e) => setDeleteWorkspaceConfirm(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-red-500"
                placeholder={actionWorkspace?.name}
              />
            </div>
            {deleteWorkspaceError && <p className="text-red-400 text-sm mb-4">{deleteWorkspaceError}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteWorkspaceModal(false)} className="px-5 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5">Cancel</button>
              <button onClick={handleDeleteWorkspace} disabled={deleteWorkspaceConfirm !== actionWorkspace?.name} className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}