import { MoreVertical } from "lucide-react";
import { useState } from "react";
import DeleteProjectModal from "../../projects/components/DeleteProjectModal";
export default function MyTasksBulkActions({
  displayTasks,
  selectedTasks,
  setSelectedTasks,
  showBulkMenu,
  setShowBulkMenu,
  bulkMenuRef,
  tasks,
  setTasks,
  isSelectMode,
  setIsSelectMode,
}) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const handleSelectAll = () => {
  if (selectedTasks.length === displayTasks.length) {
    setSelectedTasks([]);
  } else {
    setSelectedTasks(displayTasks.map((task) => task.id));
  }

  setShowBulkMenu(false);
};

const handleDeleteSelected = async () => {

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/bulk/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ task_ids: selectedTasks }),
    });

    if (!response.ok) {
      throw new Error("Bulk delete failed");
    }

    setTasks(tasks.filter(task => !selectedTasks.includes(task.id)));
    setSelectedTasks([]);
    setShowBulkMenu(false);
  } catch (error) {
    alert("Failed to delete selected tasks.");
  }
};
  return (
    <div className="relative" ref={bulkMenuRef}>
      <button
        onClick={() => setShowBulkMenu(!showBulkMenu)}
        className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
      >
        <MoreVertical size={18} />
      </button>

      {showBulkMenu && (
  <div className="absolute right-0 mt-2 w-52 bg-[#1E293B] border border-white/10 rounded-lg shadow-lg z-50">

    <button
      onClick={handleSelectAll}
      className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm text-white"
    >
      {selectedTasks.length === displayTasks.length
        ? "Deselect All"
        : "Select All"}
    </button>
    <button
      onClick={() => {
        if (isSelectMode) {
          setIsSelectMode(false);
          setSelectedTasks([]);
        } else {
          setIsSelectMode(true);
        }
        setShowBulkMenu(false);
      }}
      className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm text-white"
    >
      {isSelectMode ? "Cancel Selection" : "Select"}
    </button>

    {selectedTasks.length > 0 && (
      <button
        onClick={() => setShowDeleteModal(true)}
        className="w-full text-left px-4 py-2 hover:bg-red-500/10 text-sm text-red-400"
      >
        Delete Selected ({selectedTasks.length})
      </button>
    )}

  </div>
)}
<DeleteProjectModal
  open={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  onDelete={() => {
    handleDeleteSelected();
    setShowDeleteModal(false);
  }}
  title="Delete Selected Tasks"
  description="Are you sure you want to delete"
  itemName={`${selectedTasks.length} selected task(s)`}
  confirmButtonText="Delete Selected Tasks"
/>
    </div>
  );
}