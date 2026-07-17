import {
  Eye,
  X,
  Users,
  UserCheck,
  ShieldCheck,
} from "lucide-react";

export default function TaskVisibilityModal({
  open,
  onClose,
  visibility,
  setVisibility,
  onSave,
}) {
  if (!open) return null;

  const options = [
  {
    value: "everyone",
    title: "Everyone in Workspace",
    description: "All project members can view every task.",
    icon: Users,
  },
  {
    value: "assigned",
    title: "Only Assigned Members",
    description: "Users can only view tasks assigned to them.",
    icon: UserCheck,
  },
  {
    value: "admins",
    title: "Admins Only",
    description: "Only admins can view all project tasks.",
    icon: ShieldCheck,
  },
];

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

    return (
      <label
        key={option.value}
        className={`flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition ${
          visibility === option.value
            ? "border-cyan-400 bg-cyan-500/10"
            : "border-white/10 bg-white/5 hover:border-cyan-400/40"
        }`}
      >
        <Icon size={22} className="mt-1 text-cyan-400" />

        <div className="flex-1">
          <h3 className="font-semibold text-white">
            {option.title}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {option.description}
          </p>
        </div>

        <input
          type="radio"
          name="taskVisibility"
          checked={visibility === option.value}
          onChange={() => setVisibility(option.value)}
        />
      </label>
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