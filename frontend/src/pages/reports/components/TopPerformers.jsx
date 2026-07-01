import { Trophy, TrendingUp } from "lucide-react";

export default function TopPerformers({ members, tasks }) {
  // Calculate completed task count for each member
  const leaderboard = members
    .map((member) => {
      const completedTasks = tasks.filter(
        (task) =>
          task.assignee_id === member.id &&
          task.status === "Completed"
      ).length;

      return {
        id: member.id,
        name: member.full_name || member.name || member.email,
        completedTasks,
      };
    })
    .sort((a, b) => b.completedTasks - a.completedTasks)
    .slice(0, 5);

  return (
  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-6 mb-8">

    <div className="flex items-center gap-2 mb-5">
      <Trophy
        className="text-yellow-400"
        size={22}
      />

      <h2 className="text-lg sm:text-xl font-semibold text-white">
        Top Performers
      </h2>
    </div>

    {leaderboard.length > 0 ? (
      <div className="space-y-4">

        {leaderboard.map((member, index) => {
          const percentage =
            tasks.length > 0
              ? Math.round(
                  (member.completedTasks / tasks.length) * 100
                )
              : 0;

          const rankColors = [
            "bg-yellow-500",
            "bg-slate-400",
            "bg-orange-500",
            "bg-cyan-500",
            "bg-purple-500",
          ];

          return (
            <div
              key={member.id}
              className="bg-slate-900/40 border border-white/5 rounded-xl p-4 hover:bg-slate-900/60 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">

                <div className="flex items-center gap-3 min-w-0">

                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${rankColors[index]}`}
                  >
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-white font-semibold truncate">
                      {member.name}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-400">
                      {member.completedTasks} Completed Tasks
                    </p>
                  </div>

                </div>

                <div className="flex items-center gap-2 text-green-400 font-semibold">
                  <TrendingUp size={18} />
                  {percentage}%
                </div>

              </div>

              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">

                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                  }}
                />

              </div>

            </div>
          );
        })}

      </div>
    ) : (
      <div className="py-10 text-center text-slate-400">
        No performance data available.
      </div>
    )}

  </div>
);
}