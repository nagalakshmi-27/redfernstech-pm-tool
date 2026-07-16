import AppContext from "../context/AppContext";
import { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function CreateWorkspaceModal({
  open,
  onClose,
  onSuccess,
}) {
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState("");
  const { fetchWorkspaces } = useContext(AppContext);
  const inputRef = useRef(null);

useEffect(() => {
  if (open) {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }
}, [open]);
  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      setError("Workspace name cannot be empty");
      return;
    }

    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/workspaces/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            name: workspaceName,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to create workspace");
      }

      setWorkspaceName("");
setError("");

// Refresh workspace list
await fetchWorkspaces();

onClose();

if (onSuccess) {
  onSuccess();
}

    } catch (err) {
      setError(err.message);
    }
  };

  if (!open) return null;

  

  return createPortal(
    <div
  className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
  onClick={onClose}
>
      <div
  onClick={(e) => e.stopPropagation()}
  className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141a2d] p-6 shadow-2xl"
>

        <h2 className="mb-2 text-2xl font-bold text-cyan-400">
          Create Workspace
        </h2>

        <p className="mb-5 text-slate-400">
          Enter a name for your workspace.
        </p>

        <input
  ref={inputRef}
  type="text"
  placeholder="Workspace Name"
  value={workspaceName}
  onChange={(e) => setWorkspaceName(e.target.value)}
  className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
/>

        {error && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/20 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end">

          

          <button
            onClick={handleCreateWorkspace}
            className="rounded-lg bg-cyan-600 px-5 py-2 text-white transition hover:bg-cyan-700"
          >
            Create
          </button>

        </div>

      </div>
    </div>,
    document.body
  );
}