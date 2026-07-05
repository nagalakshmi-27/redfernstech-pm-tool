import { useContext } from "react";
import AppContext from "../../../context/AppContext";
import {
  Sun,
  CloudSun,
  Moon,
  Flame,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

export default function WelcomeOverview() {
  const { tasks, projects, currentUser } = useContext(AppContext);

  const userName =
  `${currentUser?.first_name || ""} ${currentUser?.last_name || ""}`.trim() ||
  currentUser?.full_name ||
  "User";

  const hour = new Date().getHours();
  const currentDate = new Date();

const formattedDate = currentDate.toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

  let greeting;
let GreetingIcon;

if (hour >= 6 && hour < 12) {
  greeting = "Good Morning";
  GreetingIcon = Sun;
} else if (hour >= 12 && hour < 18) {
  greeting = "Good Afternoon";
  GreetingIcon = CloudSun;
} else {
  greeting = "Good Evening";
  GreetingIcon = Moon;
}

  const today = new Date().toISOString().split("T")[0];

  const highPriority = tasks.filter(
    (t) => t.priority === "High" && t.status !== "Completed"
  ).length;

  const assigned = tasks.length;

const completedProjects = projects.filter(
  (p) =>
    p.calculated_status === "Completed" ||
    p.status === "Completed"
).length;

  const overdue = tasks.filter(
    (t) =>
      t.due_date &&
      t.due_date < today &&
      t.status !== "Completed"
  ).length;

  const tips = [
    "Complete your highest priority task first.",
    "Break large tasks into smaller ones.",
    "Review overdue tasks before starting new work.",
    "Keep task descriptions updated.",
    "Finish one task before switching.",
    "Update task status regularly.",
    "Plan tomorrow before ending today.",
    "Avoid multitasking on critical tasks.",
    "Review completed work before closing the day.",
    "Keep your board organized."
  ];

  const tip = tips[new Date().getDate() % tips.length];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg">

      {/* Greeting */}

      <div className="flex items-center gap-3 mb-6">

        <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">

          <GreetingIcon
            size={24}
            className="text-cyan-400"
          />

        </div>

        <div>

  <h2 className="text-2xl font-bold text-white">
    Welcome Back 👋
  </h2>

  <p className="text-slate-300 font-medium">
    {greeting}, {userName}
  </p>

  <p className="text-sm text-slate-500 mt-1">
    {formattedDate}
  </p>

</div>

      </div>

      {/* Summary */}

      <div className="grid grid-cols-2 gap-4">

        <SummaryCard
          icon={<Flame size={18} />}
          title="High Priority"
          value={highPriority}
          color="text-red-400"
        />

        <SummaryCard
          icon={<ClipboardList size={18} />}
          title="Assigned"
          value={assigned}
          color="text-cyan-400"
        />

        <SummaryCard
  icon={<CheckCircle2 size={18} />}
  title="Completed Projects"
  value={completedProjects}
  color="text-green-400"
/>

        <SummaryCard
          icon={<AlertTriangle size={18} />}
          title="Overdue"
          value={overdue}
          color="text-yellow-400"
        />

      </div>

      {/* Tip */}

      <div className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">

        <div className="flex items-center gap-2 mb-2">

          <Lightbulb
            size={18}
            className="text-cyan-400"
          />

          <span className="text-cyan-300 font-semibold">
            Tip of the Day
          </span>

        </div>

        <p className="text-sm text-slate-300">
          {tip}
        </p>

      </div>

    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  color,
}) {
  return (
    <div className="rounded-xl bg-black/20 border border-white/10 px-4 py-3">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className={color}>
            {icon}
          </div>

          <span className="text-sm font-medium text-slate-300">
            {title}
          </span>

        </div>

        <span className={`text-xl font-bold text-white`}>
          {value}
        </span>

      </div>

    </div>
  );
}