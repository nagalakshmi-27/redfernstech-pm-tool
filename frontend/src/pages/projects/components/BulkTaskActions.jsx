import { MoreVertical } from "lucide-react";
import AssignMemberModal from "./AssignMemberModal";

export default function BulkTaskActions({
  column,
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
  showDeleteModal,
setShowDeleteModal,
bulkActionTaskIds,
setBulkActionTaskIds,

  
}) {
  const handleMenuToggle = () => {
  if (activeColumn === column && showBulkMenu) {
    setShowBulkMenu(false);
    return;
  }

  setActiveColumn(column);
  setShowBulkMenu(true);
};
  const selectedTasksInColumn = projectTasks.filter(
  (task) =>
    (task.status || "").toLowerCase() ===
      (column || "").toLowerCase() &&
    (selectedTasks[column] || []).includes(task.id)
);

const selectedTaskIdsInColumn = selectedTasksInColumn.map(
  (task) => task.id
);

  const handleSelectAll = () => {
  const columnTasks = projectTasks
    .filter(
      (task) =>
        (task.status || "").toLowerCase() ===
        (column || "").toLowerCase()
    )
    .map((task) => task.id);

  const allSelected = columnTasks.every((id) =>
  (selectedTasks[column] || []).includes(id)
);

  if (allSelected) {
  setSelectedTasks((prev) => ({
    ...prev,
    [column]: [],
  }));

  setActiveColumn(null);
}else {
  setSelectedTasks((prev) => ({
    ...prev,
    [column]: columnTasks,
  }));
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
  {(() => {
  const columnTasks = projectTasks.filter(
    (task) =>
      (task.status || "").toLowerCase() ===
      (column || "").toLowerCase()
  );

  const allSelected =
  columnTasks.length > 0 &&
  columnTasks.every((task) =>
    (selectedTasks[column] || []).includes(task.id)
  );

  return allSelected ? "Deselect All" : "Select All";
})()}
</button>

            {selectedTasksInColumn.length > 0 && (
  <>
    <button
      onClick={() => {
  setBulkActionTaskIds(selectedTaskIdsInColumn);
  setShowDeleteModal(true);
  setShowBulkMenu(false);
}}
      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
    >
      Delete Selected ({selectedTasksInColumn.length})
    </button>

    <button
      onClick={() => {
        setBulkActionTaskIds(selectedTaskIdsInColumn);
setShowAssignMemberModal(true);
        setShowBulkMenu(false);
      }}
      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
    >
      Assign Member
    </button>

    <button
  onClick={() => {
    setBulkActionTaskIds(selectedTaskIdsInColumn);
setShowChangePriorityModal(true);
    setShowBulkMenu(false);
  }}
  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
>
  Change Priority
</button>

    <button
  onClick={() => {
    setBulkActionTaskIds(selectedTaskIdsInColumn);
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