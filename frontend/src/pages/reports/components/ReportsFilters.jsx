import {
  CalendarDays,
  FolderKanban,
  Users,
  Filter,
} from "lucide-react";

export default function ReportsFilters({
  projects,
  members,
  selectedProject,
  setSelectedProject,
  selectedStatus,
  setSelectedStatus,
  selectedMember,
  setSelectedMember,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
}) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={18} className="text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">
          Filter Reports
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        <div>
  <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
    <CalendarDays size={16} />
    From Date
  </label>

  <input
    type="date"
    value={fromDate}
    onChange={(e) => setFromDate(e.target.value)}
    className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
  />
</div>

<div>
  <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
    <CalendarDays size={16} />
    To Date
  </label>

  <input
    type="date"
    value={toDate}
    onChange={(e) => setToDate(e.target.value)}
    className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
  />
</div>

        {/* Project */}
        <div>
          <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
            <FolderKanban size={16} />
            Project
          </label>

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
          >
            <option value="All">All Projects</option>

            {projects.map((project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Team */}
        <div>
          <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
            <Users size={16} />
            Team
          </label>

          <select
  value={selectedMember}
  onChange={(e) => setSelectedMember(e.target.value)}
  className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
>
  <option value="All">All Members</option>

  {members.map((member) => (
    <option
      key={member.id}
      value={member.id}
    >
      {member.full_name || member.name || member.email}
    </option>
  ))}
</select>
        </div>

        {/* Status */}
        <div>
          <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
            <Filter size={16} />
            Status
          </label>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
          >
            <option value="All">All Status</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="To Do">To Do</option>
          </select>
        </div>

      </div>
    </div>
  );
}