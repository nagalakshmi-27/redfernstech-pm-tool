import { MoreVertical } from "lucide-react";
import AssignMemberModal from "./AssignMemberModal";

export default function BulkTaskActions({
  column,
  selectionMode,
  setSelectionMode,
  selectedTasks,
  setSelectedTasks,
  projectTasks,

  activeColumn,
  setActiveColumn,

  showBulkMenu,
  setShowBulkMenu,

  handleDeleteSelectedTasks,
  handleAssignSelectedTasks,

  members,

  showAssignMemberModal,
  setShowAssignMemberModal,

  selectedMemberId,
  setSelectedMemberId,

  showChangePriorityModal, setShowChangePriorityModal, selectedPriority, setSelectedPriority, showMoveSelectedModal, setShowMoveSelectedModal, selectedStatus, setSelectedStatus,

  bulkMenuRef,

  
}) {
  const handleMenuToggle = () => {
    if (activeColumn === column && showBulkMenu) {
      setShowBulkMenu(false);
      setActiveColumn(null);
    } else {
      setActiveColumn(column);
      setShowBulkMenu(true);
    }
  };

  const handleSelectAll = () => {
  const columnTasks = projectTasks
    .filter(
      (task) =>
        (task.status || "").toLowerCase() ===
        (column || "").toLowerCase()
    )
    .map((task) => task.id);

  const allSelected = columnTasks.every((id) =>
    selectedTasks.includes(id)
  );

  if (allSelected) {
    setSelectedTasks([]);
    setSelectionMode(false);
  } else {
    setSelectedTasks(columnTasks);
    setSelectionMode(true);
  }

  setShowBulkMenu(false);
};

  return (
    <>
      <div
  ref={showBulkMenu && activeColumn === column ? bulkMenuRef : null}
  className="relative"
>
        <button
          onClick={handleMenuToggle}
          className="p-1 rounded-md hover:bg-white/10 transition"
        >
          <MoreVertical size={18} className="text-slate-300" />
        </button>

        {showBulkMenu && activeColumn === column && (
          <div className="absolute right-0 mt-2 w-44 rounded-xl bg-[#1e293b] border border-white/10 shadow-lg z-50">
            <button
  onClick={handleSelectAll}
  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
>
  {projectTasks
    .filter(
      (task) =>
        (task.status || "").toLowerCase() ===
        (column || "").toLowerCase()
    )
    .every((task) => selectedTasks.includes(task.id))
    ? "Deselect All"
    : "Select All"}
</button>

            {selectedTasks.length > 0 && (
  <>
    <button
      onClick={() => handleDeleteSelectedTasks(selectedTasks)}
      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
    >
      Delete Selected ({selectedTasks.length})
    </button>

    <button
      onClick={() => {
        setShowAssignMemberModal(true);
        setShowBulkMenu(false);
      }}
      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
    >
      Assign Member
    </button>

    <button
  onClick={() => {
    setShowChangePriorityModal(true);
    setShowBulkMenu(false);
  }}
  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
>
  Change Priority
</button>

    <button
  onClick={() => {
    setShowMoveSelectedModal(true);
    setShowBulkMenu(false);
  }}
  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
>
  Move Selected
</button>
  </>
)}
          </div>
        )}
      </div>
    </>
  );
}