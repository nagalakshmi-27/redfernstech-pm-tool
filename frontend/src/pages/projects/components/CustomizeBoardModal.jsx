import { Settings2, GripVertical, Trash2, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

function SortableColumn({
  id,
  column,
  index,
  tempBoardColumns,
  setTempBoardColumns,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
  id: id,
});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-slate-500"
      >
        <GripVertical size={18} />
      </div>

      <input
        value={column}
        onChange={(e) => {
          const updated = [...tempBoardColumns];
          updated[index] = e.target.value;
          setTempBoardColumns(updated);
        }}
        className="flex-1 bg-transparent outline-none text-white"
      />

      <button
  onClick={() => {
    if (tempBoardColumns.length === 1) {
      alert("A board must have at least one column.");
      return;
    }

    setTempBoardColumns(
      tempBoardColumns.filter((_, i) => i !== index)
    );
  }}
        className="text-red-400 hover:text-red-300"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export default function CustomizeBoardModal({
  open,
  onClose,
  tempBoardColumns,
  setTempBoardColumns,
  newColumnName,
  setNewColumnName,
  onSave,
}) {
  if (!open) return null;

const handleDragEnd = (event) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  setTempBoardColumns((items) => {
    const oldIndex = items.indexOf(active.id);
    const newIndex = items.indexOf(over.id);
    return arrayMove(items, oldIndex, newIndex);
  });
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#171d33] p-6 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings2 size={22} />
            Customize Board
          </h2>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* Column List */}
        <DndContext
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={tempBoardColumns}
    strategy={verticalListSortingStrategy}
  >
    <div className="space-y-3">
      {tempBoardColumns.map((column, index) => (
        <SortableColumn
          key={column}
          id={column}
          column={column}
          index={index}
          tempBoardColumns={tempBoardColumns}
          setTempBoardColumns={setTempBoardColumns}
        />
      ))}
    </div>
  </SortableContext>
</DndContext>
        {/* Add Column */}
        <div className="mt-5 flex gap-2">

          <input
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            placeholder="New workflow stage"
            className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          />

          <button
            onClick={() => {
  const name = newColumnName.trim();

  if (!name) {
    alert("Column name cannot be empty.");
    return;
  }

  if (name.length > 50) {
    alert("Column name cannot exceed 50 characters.");
    return;
  }

  if (
    tempBoardColumns.some(
      (column) => column.toLowerCase() === name.toLowerCase()
    )
  ) {
    alert("A column with this name already exists.");
    return;
  }

  setTempBoardColumns([...tempBoardColumns, name]);
  setNewColumnName("");
}}
            className="rounded-xl bg-cyan-500 px-5 text-white hover:bg-cyan-400"
          >
            Add
          </button>

        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-5 py-2 text-slate-300"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            className="rounded-lg bg-cyan-500 px-5 py-2 text-white hover:bg-cyan-400"
          >
            Save Changes
          </button>

        </div>

      </div>
    </div>
  );
}