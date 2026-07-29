export default function ChangePriorityModal({
  open,
  selectedPriority,
  setSelectedPriority,
  onClose,
  onUpdate,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[420px] rounded-2xl bg-[#1e293b] border border-white/10 p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-white mb-5">
          Change Priority
        </h2>

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-white/10 text-white px-3 py-2"
        >
          <option value="">Select Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
          >
            Cancel
          </button>

          <button
            onClick={onUpdate}
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}