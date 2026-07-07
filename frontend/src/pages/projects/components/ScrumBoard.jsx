import { Trash2 } from "lucide-react";

export default function ScrumBoard({
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
    <div className="space-y-6">

      {/* Sprint Header */}
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-2xl font-bold text-white">
              Sprint 1
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Active Sprint • Dynamic Workflow
            </p>
          </div>

          <div className="rounded-full bg-cyan-500/20 px-4 py-2 text-cyan-300 text-sm font-semibold">
            Active
          </div>

        </div>
      </div>

      {/* Board goes here */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
    <p className="text-sm text-slate-400">Sprint Progress</p>
    <h3 className="text-xl font-bold text-white mt-1">
      {
        projectTasks.filter(task =>
          columns.includes(task.status)
        ).length
      } Tasks
    </h3>
  </div>

  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
    <p className="text-sm text-slate-400">Workflow Stages</p>
    <h3 className="text-xl font-bold text-white mt-1">
      {columns.length}
    </h3>
  </div>

  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
    <p className="text-sm text-slate-400">Completed</p>
    <h3 className="text-xl font-bold text-green-400 mt-1">
      {
        projectTasks.filter(task =>
          task.status === columns[columns.length - 1]
        ).length
      }
    </h3>
  </div>

</div>
{/* Sprint Board */}
<div className="flex items-center justify-between mt-8">
  <div>
    <h3 className="text-xl font-bold text-white">
      Sprint Board
    </h3>

    <p className="text-sm text-slate-400">
      Manage sprint work across workflow stages
    </p>
  </div>
</div>

<div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 mt-4">

  {columns.map((column) => {
    const colName = typeof column === 'string' ? column : (column?.name || 'Unknown');
    return (

    <div
  key={colName}
  className="flex-1 min-w-[280px] rounded-2xl border border-white/10 bg-white/5 p-4"
  onDragOver={handleDragOver}
  onDrop={(e) => handleDropOnColumn(e, colName)}
>

      <div className="flex items-center justify-between mb-4">

        <div className="flex items-center gap-2">

          {getColumnIcon(column)}

          <h3 className="text-white font-bold">
            {colName}
          </h3>

        </div>

        <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300">
          {projectTasks.filter(task => task.status === colName).length}
        </span>

      </div>

      <div className="space-y-3">
  {projectTasks
    .filter(task => task.status === colName)
    .map(task => {
      const assignee = members.find(
        m => m.id === task.assignee_id
      );

      return (
        <div
  key={task.id}
  id={`task-card-${task.id}`}
  draggable={currentUserRole !== "Client"}
  onDragStart={(e) => handleDragStart(e, task.id)}
  onDragOver={handleDragOver}
  onDrop={(e) => handleDropOnCard(e, task, column)}
  className={`rounded-xl border border-l-4 p-3 transition cursor-pointer relative group ${highlightedTaskId === task.id ? 'bg-cyan-500/10 ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0f172a] animate-[pulse_2s_ease-in-out_infinite]' : 'bg-white/10 border-white/10 hover:bg-white/15'}`}
  style={{ borderLeftColor: getColumnColor(column) }}
  onClick={() => openTask(task)}
>
          <div className="flex items-center justify-between">
            <span className="text-xs text-cyan-300 font-semibold">
              {task.ticket_id || `TSK-${task.id}`}
            </span>

            <span
              className={`text-xs px-2 py-1 rounded-full ${
                task.priority === "High"
                  ? "bg-red-500/20 text-red-300"
                  : task.priority === "Medium"
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "bg-green-500/20 text-green-300"
              }`}
            >
              {task.priority}
            </span>
          </div>

          <h4 className="mt-3 text-white font-medium">
            {task.name}
          </h4>

          <p className="mt-3 text-xs text-slate-400">
            {assignee?.full_name || assignee?.name || "Unassigned"}
          </p>
          
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
      );
    })}
</div>

    </div>
  )})}
</div>

    </div>
  );
}