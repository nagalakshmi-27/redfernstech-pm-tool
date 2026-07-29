import {
  Eye,
  X,
  Users,
  UserCheck,
  ShieldCheck,
  CheckSquare,
  Square
} from "lucide-react";

export default function TaskVisibilityModal({
  open,
  onClose,
  visibility,
  setVisibility,
  taskViewers,
  setTaskViewers,
  projectMembers,
  onSave,
}) {
  if (!open) return null;

  const options = [
    {
      value: "everyone",
      title: "Everyone in Project",
      description: "All project members can view every task.",
      icon: Users,
    },
    {
      value: "assigned",
      title: "Only Assigned Members",
      description: "Users can only view tasks assigned to them. (Admins & Clients see all)",
      icon: UserCheck,
    },
    {
      value: "custom",
      title: "Select who can see all tasks",
      description: "Choose specific members to see all project tasks.",
      icon: ShieldCheck,
    },
  ];

  const toggleViewer = (userId) => {
    if (taskViewers.includes(userId)) {
      setTaskViewers(taskViewers.filter((id) => id !== userId));
    } else {
      setTaskViewers([...taskViewers, userId]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[95%] max-w-xl rounded-2xl border border-white/10 bg-[#171d33] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Eye size={22} />
            Task Visibility
          </h2>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* Description */}
        <p className="text-slate-400 mb-6">
          Choose who can view tasks inside this project.
        </p>

        {/* Visibility Options */}
        <div className="space-y-4">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = visibility === option.value;

            return (
              <div
                key={option.value}
                className={`flex flex-col gap-2 rounded-xl border p-4 cursor-pointer transition ${
                  isSelected
                    ? "border-cyan-400 bg-cyan-500/10"
                    : "border-white/10 bg-white/5 hover:border-cyan-400/40"
                }`}
                onClick={() => setVisibility(option.value)}
              >
                <div className="flex items-start gap-4">
                  <Icon size={22} className="mt-1 text-cyan-400" />
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      {option.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {option.description}
                    </p>
                  </div>
                  
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-cyan-400' : 'border-slate-500'}`}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />}
                  </div>
                </div>

                {/* Dropdown for Custom Members */}
                {isSelected && option.value === "custom" && (
                  <div 
                    className="mt-3 ml-10 border-t border-cyan-400/20 pt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Select Viewers</div>
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-2">
                      {projectMembers?.length > 0 ? (
                        projectMembers.map((member) => (
                          <div 
                            key={member.id} 
                            onClick={() => toggleViewer(member.id)}
                            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition ${
                              taskViewers.includes(member.id) ? "bg-cyan-500/20" : "hover:bg-white/10"
                            }`}
                          >
                            {taskViewers.includes(member.id) ? (
                              <CheckSquare className="text-cyan-400" size={18} />
                            ) : (
                              <Square className="text-slate-500" size={18} />
                            )}
                            <span className="text-slate-200 text-sm font-medium">{member.full_name}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 text-sm p-2">No members to select.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-5 py-2 text-slate-300 hover:bg-white/5"
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