import { useState } from "react";
import { iconLibrary } from "../../../utils/iconLibrary";
import {
  Settings2,
  GripVertical,
  Trash2,
  X,
  Search,
} from "lucide-react";
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


const popularIcons = [
  "Clock3",
  "PlayCircle",
  "CheckCircle2",
  "Eye",
  "Flag",
  "ClipboardList",
  "Package",
  "Wrench",
  "Star",
  "MessageSquare",
  "Calendar",
  "CalendarDays",
  "Folder",
  "FolderKanban",
  "Bug",
  "Rocket",
  "Target",
  "Users",
  "User",
  "Settings",
];

const colors = ["#facc15", "#22d3ee", "#4ade80", "#f87171", "#a78bfa", "#f472b6", "#fb923c"];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];
const getRandomIcon = () => popularIcons[Math.floor(Math.random() * popularIcons.length)];

const getColId = (col) => {
  const name = typeof col === 'string' ? col : col?.name;
  return name?.trim() ? name : 'Unknown';
};

function SortableColumn({
  id,
  column,
  index,
  tempBoardColumns,
  setTempBoardColumns,
}) {
  const isCompleted = getColId(column) === "Completed";
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
  id: id,
  disabled: isCompleted
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
        {...(!isCompleted ? attributes : {})}
        {...(!isCompleted ? listeners : {})}
        className={isCompleted ? "text-slate-700 cursor-not-allowed opacity-50" : "cursor-grab text-slate-500"}
      >
        <GripVertical size={18} />
      </div>

      <input
  value={typeof column === 'string' ? column : (column?.name || "")}
  disabled={isCompleted}
  onChange={(e) => {
    const updated = [...tempBoardColumns];
    if (typeof updated[index] === 'string') {
      updated[index] = e.target.value;
    } else {
      updated[index] = { ...updated[index], name: e.target.value };
    }
    setTempBoardColumns(updated);
  }}
  className={`flex-1 bg-transparent outline-none text-white ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
/>

      {!isCompleted && (
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
      )}
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

  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [selectedColor, setSelectedColor] = useState(getRandomColor());
  const [iconSearch, setIconSearch] = useState("");
const [visibleCount, setVisibleCount] = useState(5);
const search = iconSearch.trim().toLowerCase();

const matchedIcons =
  search === ""
    ? iconLibrary.filter((icon) =>
        popularIcons.includes(icon.name)
      )
    : iconLibrary.filter((icon) => {
        const text = [
          icon.name,
          ...icon.keywords,
        ]
          .join(" ")
          .toLowerCase();

        return text.includes(search);
      });

const filteredIcons =
  search === ""
    ? matchedIcons
    : matchedIcons.slice(0, visibleCount);

  if (!open) return null;

const handleDragEnd = (event) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  setTempBoardColumns((items) => {
    const oldIndex = items.findIndex(item => getColId(item) === active.id);
    const newIndex = items.findIndex(item => getColId(item) === over.id);
    
    let result = arrayMove(items, oldIndex, newIndex);
    
    // Enforce Completed stays at the very end
    const completedIdx = result.findIndex(item => getColId(item) === "Completed");
    if (completedIdx !== -1 && completedIdx !== result.length - 1) {
        const completedCol = result.splice(completedIdx, 1)[0];
        result.push(completedCol);
    }
    
    return result;
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
    items={tempBoardColumns.map(getColId)}
    strategy={verticalListSortingStrategy}
  >
    <div className="space-y-3">
      {tempBoardColumns.map((column, index) => {
        const colName = getColId(column);
        return (
        <SortableColumn
          key={colName}
          id={colName}
          column={column}
          index={index}
          tempBoardColumns={tempBoardColumns}
          setTempBoardColumns={setTempBoardColumns}
        />
      )})}
    </div>
  </SortableContext>
</DndContext>
        {/* Add Column */}
<div className="mt-6 flex justify-center">
  <button
    onClick={() => setShowAddColumnModal(true)}
    className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-6 py-3 text-white font-medium transition"
  >
    + Add Column
  </button>
</div>

        {/* Footer */}
        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">

          <button
            onClick={onClose}
            className="w-full sm:w-auto rounded-lg border border-white/10 px-5 py-2 text-slate-300"
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

      {showAddColumnModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/70 backdrop-blur-sm p-4">
  <div className="min-h-full flex items-center justify-center">

          <div
  className="
    w-[95vw]
    sm:w-[90vw]
    md:w-full
    md:max-w-md
    max-h-[90vh]
    overflow-y-auto
    rounded-2xl
    border
    border-white/10
    bg-[#171d33]
    p-4
    sm:p-5
    md:p-6
  "
>

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-xl font-bold text-white">
                Add New Column
              </h2>

              <button
                onClick={() => setShowAddColumnModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>

  
            </div>

            <div className="space-y-6">

  {/* Column Name */}
  <div>

    <label className="block text-sm text-slate-300 mb-2">
      Column Name
    </label>

    <input
      value={newColumnName}
      onChange={(e) => setNewColumnName(e.target.value)}
      placeholder="Enter column name"
      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white"
    />

  </div>

  {/* Search Icon */}
  <div>

    <label className="block text-sm text-slate-300 mb-2">
      Column Icon
    </label>

    <div className="relative">

      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        value={iconSearch}
        onChange={(e) => {
  setIconSearch(e.target.value);
  setVisibleCount(5);
}}
        placeholder="Search icons..."
        className="w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 py-3 text-white"
      />

    </div>

  </div>
  {/* Popular Icons */}

<div>

  <label className="block text-sm text-slate-300 mb-3">
  {iconSearch.trim() ? "Search Results" : "Popular Icons"}
</label>

  <div className="max-h-56 sm:max-h-72 overflow-y-auto">
  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">

    {filteredIcons.map(({ name, component: Icon }) => (

      <button
        key={name}
        onClick={() =>
  setSelectedIcon({
    name,
    component: Icon,
  })
}
        className={`flex flex-col items-center justify-center rounded-xl border p-3 transition

        ${
          selectedIcon?.name === name
            ? "border-cyan-400 bg-cyan-500/20"
            : "border-white/10 bg-black/20 hover:border-cyan-400"
        }`}
      >

        <Icon
          size={22}
          className="text-cyan-400"
        />

        <span
  title={name}
  className="mt-2 w-full truncate text-center text-[10px] text-slate-300"
>
  {name}
</span>

      </button>

    ))}
</div>
  </div>

  {search !== "" &&
 matchedIcons.length > visibleCount &&
 visibleCount < 15 && (
  <div className="mt-4 text-center">
    <button
      onClick={() =>
  setVisibleCount((prev) =>
    Math.min(prev + 5, 15)
  )
}
      className="text-cyan-400 hover:text-cyan-300 text-sm"
    >
      Show 5 More
    </button>
  </div>
)}

{search !== "" &&
 visibleCount > 5 && (
  <div className="mt-2 text-center">
    <button
      onClick={() => setVisibleCount(5)}
      className="text-slate-400 hover:text-white text-sm"
    >
      Show Less
    </button>
  </div>
)}
  {filteredIcons.length === 0 && (
  <div className="text-center py-4 text-slate-400">
    No matching icons found.
  </div>
)}

</div>
{/* Column Color */}

<label className="flex items-center gap-4 cursor-pointer">
  <div
    className="relative h-12 w-12 rounded-full border-2 border-white/10 overflow-hidden"
    style={{ backgroundColor: selectedColor }}
  >
    <input
      type="color"
      value={selectedColor}
      onChange={(e) => setSelectedColor(e.target.value)}
      className="absolute inset-0 opacity-0 cursor-pointer"
    />
  </div>

  <span className="text-sm text-slate-300">
    Click to choose any color
  </span>
</label>

{/* Preview */}

<div>

  <label className="block text-sm text-slate-300 mb-3">
    Preview
  </label>

  {(() => {
    const SelectedIcon = selectedIcon?.component;

    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3 sm:px-4 sm:py-4">

        <div className="flex items-center justify-center">
  {SelectedIcon ? (
    <SelectedIcon
      size={24}
      style={{ color: selectedColor }}
    />
  ) : (
    <span
      className="text-xl font-bold"
      style={{ color: selectedColor }}
    >
      ?
    </span>
  )}
</div>

        <span className="text-white font-medium">
          {newColumnName || "Column Name"}
        </span>

      </div>
    );
  })()}

</div>
{/* Bottom Buttons */}

<div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">

  <button
    onClick={() => setShowAddColumnModal(false)}
    className="w-full sm:w-auto rounded-lg border border-white/10 px-5 py-2 text-slate-300 hover:bg-white/5 transition"
  >
    Cancel
  </button>

  <button
    onClick={() => {
      if (!newColumnName.trim()) return;

      const newCol = {
        name: newColumnName,
        icon: selectedIcon?.name || getRandomIcon(),
        color: selectedColor || getRandomColor()
      };

      const completedIndex = tempBoardColumns.findIndex(c => getColId(c) === "Completed");
      
      if (completedIndex !== -1) {
        const newCols = [...tempBoardColumns];
        newCols.splice(completedIndex, 0, newCol);
        setTempBoardColumns(newCols);
      } else {
        setTempBoardColumns([...tempBoardColumns, newCol]);
      }

      setNewColumnName("");
      setSelectedIcon(null);
      setSelectedColor(getRandomColor());
      setIconSearch("");
      setVisibleCount(5);

      setShowAddColumnModal(false);
    }}
    className="w-full sm:w-auto rounded-lg bg-cyan-500 hover:bg-cyan-400 px-5 py-2 text-white transition"
  >
    Add Column
  </button>

</div>

</div>
</div>

          </div>

        </div>
      )}

    </div>
  );
}