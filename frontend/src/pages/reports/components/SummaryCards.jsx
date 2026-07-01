import {
  FolderKanban,
  CheckCircle,
  Clock3,
  TrendingUp,
} from "lucide-react";

export default function SummaryCards({ projects, tasks }) {

  // Calculate values dynamically
  const totalProjects = projects.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status === "To Do"
  ).length;

  const productivity =
    tasks.length > 0
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0;

  return (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">

    {/* Total Projects */}
    <div className="bg-white/5 backdrop-blur-md border border-white/10 border-l-4 border-l-cyan-500 rounded-xl p-4 sm:p-5 min-h-[130px] flex items-center justify-between hover:bg-white/10 hover:scale-[1.02] transition-all duration-300">
      <div>
        <p className="text-slate-400 text-xs sm:text-sm">
          Total Projects
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
          {totalProjects}
        </h2>
      </div>

      <div className="bg-cyan-500/15 p-3 rounded-xl">
        <FolderKanban
          size={26}
          className="text-cyan-400"
        />
      </div>
    </div>

    {/* Completed Tasks */}
    <div className="bg-white/5 backdrop-blur-md border border-white/10 border-l-4 border-l-green-500 rounded-xl p-4 sm:p-5 min-h-[130px] flex items-center justify-between hover:bg-white/10 hover:scale-[1.02] transition-all duration-300">
      <div>
        <p className="text-slate-400 text-xs sm:text-sm">
          Completed Tasks
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
          {completedTasks}
        </h2>
      </div>

      <div className="bg-green-500/15 p-3 rounded-xl">
        <CheckCircle
          size={26}
          className="text-green-400"
        />
      </div>
    </div>

    {/* Pending Tasks */}
    <div className="bg-white/5 backdrop-blur-md border border-white/10 border-l-4 border-l-yellow-500 rounded-xl p-4 sm:p-5 min-h-[130px] flex items-center justify-between hover:bg-white/10 hover:scale-[1.02] transition-all duration-300">
      <div>
        <p className="text-slate-400 text-xs sm:text-sm">
          Pending Tasks
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
          {pendingTasks}
        </h2>
      </div>

      <div className="bg-yellow-500/15 p-3 rounded-xl">
        <Clock3
          size={26}
          className="text-yellow-400"
        />
      </div>
    </div>

    {/* Productivity */}
    <div className="bg-white/5 backdrop-blur-md border border-white/10 border-l-4 border-l-purple-500 rounded-xl p-4 sm:p-5 min-h-[130px] flex items-center justify-between hover:bg-white/10 hover:scale-[1.02] transition-all duration-300">
      <div>
        <p className="text-slate-400 text-xs sm:text-sm">
          Productivity
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
          {productivity}%
        </h2>
      </div>

      <div className="bg-purple-500/15 p-3 rounded-xl">
        <TrendingUp
          size={26}
          className="text-purple-400"
        />
      </div>
    </div>

  </div>
);
}