import {
  Users,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
export default function EditProjectModal({
  open,
  onClose,
  projectName,
  setProjectName,
  projectDescription,
  setProjectDescription,
  boardType,
  setBoardType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  members,
  selectedMembers,
  setSelectedMembers,
  memberSearch,
  setMemberSearch,
  showAllMembers,
  setShowAllMembers,
  onUpdate,
}) {
    const filteredMembers = members.filter((member) =>
  (member.full_name || "")
    .toLowerCase()
    .includes(memberSearch.toLowerCase())
);

const displayedMembers = showAllMembers
  ? filteredMembers
  : filteredMembers.slice(0, 5);
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 p-4 md:p-6 rounded-2xl w-[95%] max-w-[500px] max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.5)]">

        <h2 className="text-2xl font-bold mb-4 text-white">
          Edit Project
        </h2>

        <div className="space-y-4">
  {/* Project Name */}
  <div>
    <label className="block mb-2 font-medium text-slate-300">
      Project Name
    </label>

    <input
      type="text"
      value={projectName}
      onChange={(e) => setProjectName(e.target.value)}
      className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
    />
  </div>

  {/* Project Description */}
  <div>
    <label className="block mb-2 font-medium text-slate-300">
      Project Description
    </label>

    <textarea
      value={projectDescription}
      onChange={(e) => setProjectDescription(e.target.value)}
      className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
    />
  </div>



  {/* Team Members */}
  <div>
    <label className="flex items-center gap-2 mb-2 font-medium text-slate-300">
      <Users size={18} className="text-cyan-400" />
      Assign Team Members
    </label>

    <div className="border border-white/10 bg-black/20 rounded-lg p-3">

      <div className="relative mb-3">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          placeholder="Search team members..."
          value={memberSearch}
          onChange={(e) => {
            setMemberSearch(e.target.value);
            setShowAllMembers(false);
          }}
          className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
      </div>

      <div className="space-y-2 text-slate-300 max-h-56 overflow-y-auto pr-1">

        {displayedMembers.map((member) => (
          <label
            key={member.id}
            className="flex items-center gap-2"
          >
            <input
              type="checkbox"
              checked={selectedMembers.includes(member.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedMembers([...selectedMembers, member.id]);
                } else {
                  setSelectedMembers(
                    selectedMembers.filter((id) => id !== member.id)
                  );
                }
              }}
            />

            {member.full_name}
          </label>
        ))}

        {filteredMembers.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAllMembers(!showAllMembers)}
            className="flex items-center gap-2 mt-3 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition"
          >
            {showAllMembers ? (
              <>
                <ChevronUp size={16} />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Show More
              </>
            )}
          </button>
        )}

      </div>

    </div>
  </div>

  {/* Start Date */}
  <div>
    <label className="block mb-2 font-medium text-slate-300">
      Start Date
    </label>

    <input
      type="date"
      value={startDate}
      min={new Date().toISOString().split("T")[0]}
      max="9999-12-31"
      onChange={(e) => setStartDate(e.target.value)}
      className="w-full bg-black/20 border border-white/10 text-slate-200 p-3 rounded-lg focus:outline-none focus:border-cyan-500 [color-scheme:dark]"
    />
  </div>

  {/* End Date */}
  <div>
    <label className="block mb-2 font-medium text-slate-300">
      End Date
    </label>

    <input
      type="date"
      value={endDate}
      min={startDate || new Date().toISOString().split("T")[0]}
      max="9999-12-31"
      onChange={(e) => setEndDate(e.target.value)}
      className="w-full bg-black/20 border border-white/10 text-slate-200 p-3 rounded-lg focus:outline-none focus:border-cyan-500 [color-scheme:dark]"
    />
  </div>
</div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-white/20 text-slate-300 rounded-lg hover:bg-white/5"
          >
            Cancel
          </button>

          <button
  onClick={onUpdate}
  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all"
>
  Update Project
</button>
        </div>

      </div>
    </div>
  );
}