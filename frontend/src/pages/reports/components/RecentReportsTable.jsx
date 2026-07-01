import { FileText } from "lucide-react";

export default function RecentReportsTable({ tasks, projects }) {
  // Sort tasks by latest created
  const recentTasks = [...tasks]
    .sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )
    .slice(0, 5);

  return (
  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-6 mb-8">

    <div className="flex items-center gap-2 mb-5">
      <FileText
        className="text-cyan-400"
        size={20}
      />

      <h2 className="text-lg sm:text-xl font-semibold text-white">
        Recent Tasks
      </h2>
    </div>

    <div className="overflow-x-auto rounded-lg">
      <table className="min-w-[700px] w-full text-left">

        <thead className="border-b border-white/10">
          <tr className="text-slate-400 text-sm">
            <th className="py-3 px-2">Ticket</th>
            <th className="px-2">Task</th>
            <th className="px-2">Project</th>
            <th className="px-2">Due Date</th>
            <th className="px-2">Status</th>
          </tr>
        </thead>

        <tbody>
          {recentTasks.length > 0 ? (
            recentTasks.map((task) => {
              const project = projects.find(
                (p) => p.id === task.project_id
              );

              return (
                <tr
                  key={task.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-all duration-300"
                >
                  <td className="py-4 px-2 text-cyan-400 font-medium whitespace-nowrap">
                    {task.ticket_id}
                  </td>

                  <td className="px-2 text-white max-w-[220px] truncate">
                    {task.name}
                  </td>

                  <td className="px-2 text-slate-300 whitespace-nowrap">
                    {project?.name || "-"}
                  </td>

                  <td className="px-2 text-slate-300 whitespace-nowrap">
                    {task.due_date || "-"}
                  </td>

                  <td className="px-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        task.status === "Completed"
                          ? "bg-green-500/20 text-green-400"
                          : task.status === "In Progress"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={5}
                className="py-8 text-center text-slate-400"
              >
                No tasks found for the selected filters.
              </td>
            </tr>
          )}
        </tbody>

      </table>
    </div>

  </div>
);
}