import {
  Bug,
  CheckSquare,
  Trash2,
  User,
  Flag,
  Hash,
} from "lucide-react";
export default function KanbanBoard({
  columns,
  projectTasks,
  members,
  currentUserRole,
  handleDragStart,
  handleDragOver,
  handleDropOnColumn,
  handleDropOnCard,
  getColumnIcon,
  getColumnColor,
  handleDeleteTask,
  openTask,
  highlightedTaskId,
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const colName = typeof column === 'string' ? column : (column?.name || 'Unknown');
        return (
        <div
          key={colName}
          className="flex-1 min-w-[280px] bg-white/5 backdrop-blur-md rounded-2xl p-4 shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropOnColumn(e, colName)}
        >
          {/* Column Header */}
          <div className="flex items-center gap-2 mb-4 px-2">
            {getColumnIcon(column)}

            <h2 className="text-lg font-bold text-white">
              {colName}
            </h2>

            <span className="ml-auto bg-white/10 text-slate-300 px-2 py-0.5 rounded-full text-xs font-bold border border-white/10">
              {projectTasks.filter((t) => t.status === colName).length}
            </span>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-3 min-h-[500px]">
            {projectTasks
              .filter((t) => t.status === colName)
              .sort((a, b) => (a.position || 0) - (b.position || 0))
              .map((task) => (
                <div
                  key={task.id}
                  id={`task-card-${task.id}`}
                  draggable={currentUserRole !== "Client"}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnCard(e, task, column)}
                  onClick={() => openTask(task)}
                  className={`backdrop-blur-sm border border-l-4 p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] cursor-pointer hover:bg-white/20 transition-all relative group ${highlightedTaskId === task.id ? 'bg-cyan-500/10 ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0f172a] animate-[pulse_2s_ease-in-out_infinite]' : 'bg-white/10 border-white/10'}`}
                  style={{ borderLeftColor: getColumnColor(column) }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-300 bg-black/30 px-2 py-1 rounded border border-white/5">
  <Hash size={11} />
  {task.ticket_id || `TSK-${task.id}`}
</span>

                    <span
                      className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                        task.issue_type === "Bug"
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      }`}
                    >
                      {task.issue_type === "Bug" ? (
                        <Bug size={12} />
                      ) : (
                        <CheckSquare size={12} />
                      )}

                      {task.issue_type || "Task"}
                    </span>
                  </div>

                  <h3 className="text-md font-semibold text-white mb-1">
                    {task.name}
                  </h3>

                  {task.issue_type === "Bug" && task.severity && (
                    <p className="text-xs text-red-400 mb-2">
                      Severity: {task.severity}
                    </p>
                  )}

                  <div className="flex justify-between items-end mt-4">
                    <div className="flex gap-2 items-center">
                      <span
                        className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border ${
                          task.priority === "High"
                            ? "bg-red-500/20 text-red-300 border-red-500/30"
                            : task.priority === "Medium"
                            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                            : "bg-green-500/20 text-green-300 border-green-500/30"
                        }`}
                      >
                        <Flag size={11} />
                        {task.priority}
                      </span>
                      {task.subtasks && task.subtasks.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5" title="Subtasks">
                          <CheckSquare size={10} />
                          {task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length}
                        </span>
                      )}
                      {task.work_logs && task.work_logs.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20" title="Time Logged">
                          <Clock size={10} />
                          {task.work_logs.reduce((acc, log) => acc + log.hours_spent, 0)}h
                        </span>
                      )}
                    </div>

                    {(() => {
                      const assignee = members.find(
                        (m) => m.id === task.assignee_id
                      );

                      if (assignee?.profile_image) {
                        return (
                          <img
                            src={
                              assignee.profile_image.startsWith("http")
                                ? assignee.profile_image
                                : `${import.meta.env.VITE_API_URL}${assignee.profile_image}`
                            }
                            alt="avatar"
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        );
                      }

                      return (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center justify-center">
  <User size={14} />
</div>
                      );
                    })()}
                  </div>

                  {currentUserRole !== "Client" && (
                    <button
  onClick={(e) => {
    e.stopPropagation();
    handleDeleteTask(task.id);
  }}
  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition"
>
  <Trash2 size={16} />
</button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )})}
    </div>
  );
}