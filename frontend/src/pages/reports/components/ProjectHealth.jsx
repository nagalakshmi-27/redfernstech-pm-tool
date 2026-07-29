export default function ProjectHealth({ projects, tasks }) {
  return (
  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-6 h-full">
    <h2 className="text-lg sm:text-xl font-semibold text-white mb-5">
      Project Health
    </h2>

    <div className="space-y-6">
      {projects.map((project) => {
        const projectTasks = tasks.filter(
          (task) => task.project_id === project.id
        );

        const completedTasks = projectTasks.filter(
          (task) => task.status === "Completed"
        ).length;

        const percentage =
          projectTasks.length > 0
            ? Math.round(
                (completedTasks / projectTasks.length) * 100
              )
            : 0;

        let progressColor =
          "from-red-500 to-red-400";
        let status = "At Risk";
        let statusColor = "text-red-400";

        if (percentage > 30) {
          progressColor =
            "from-yellow-500 to-yellow-400";
          status = "Needs Attention";
          statusColor = "text-yellow-400";
        }

        if (percentage > 60) {
          progressColor =
            "from-cyan-500 to-blue-500";
          status = "On Track";
          statusColor = "text-cyan-400";
        }

        if (percentage >= 90) {
          progressColor =
            "from-green-500 to-green-400";
          status = "Healthy";
          statusColor = "text-green-400";
        }

        return (
          <div key={project.id}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">

              <div className="min-w-0">
                <h3 className="text-white font-medium truncate">
                  {project.name}
                </h3>

                <p className="text-xs sm:text-sm text-slate-400">
                  {completedTasks} / {projectTasks.length} Tasks Completed
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="font-semibold text-white">
                  {percentage}%
                </p>

                <p
                  className={`text-xs ${statusColor}`}
                >
                  {status}
                </p>
              </div>

            </div>

            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${progressColor} transition-all duration-500`}
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
}