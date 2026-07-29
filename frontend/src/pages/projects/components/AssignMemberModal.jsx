export default function AssignMemberModal({
  open,
  members,
  selectedMemberId,
  setSelectedMemberId,
  onClose,
  onAssign,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[400px] rounded-2xl bg-[#1e293b] border border-white/10 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4">
          Assign Member
        </h2>

        <select
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-white/10 text-white px-3 py-2"
        >
          <option value="">Select Member</option>

          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name || member.full_name || member.email}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
          >
            Cancel
          </button>

          <button
            onClick={onAssign}
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}