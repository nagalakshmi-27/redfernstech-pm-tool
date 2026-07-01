import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORS = ["#22c55e", "#facc15", "#38bdf8"];

export default function AnalyticsCharts({ projects, tasks }) {
  // -------------------------
  // Pie Chart Data
  // -------------------------

  const completed = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const pending = tasks.filter(
    (task) => task.status === "To Do"
  ).length;

  const inProgress = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const pieData = [
    { name: "Completed", value: completed },
    { name: "Pending", value: pending },
    { name: "In Progress", value: inProgress },
  ];

  // -------------------------
// Priority Distribution
// -------------------------

const highPriority = tasks.filter(
  (task) => task.priority === "High"
).length;

const mediumPriority = tasks.filter(
  (task) => task.priority === "Medium"
).length;

const lowPriority = tasks.filter(
  (task) => task.priority === "Low"
).length;

const priorityData = [
  { name: "High", value: highPriority },
  { name: "Medium", value: mediumPriority },
  { name: "Low", value: lowPriority },
];

const PRIORITY_COLORS = [
  "#ef4444", // Red
  "#facc15", // Yellow
  "#22c55e", // Green
];

  // -------------------------
  // Bar Chart Data
  // -------------------------

  const barData = projects.map((project) => ({
  fullName: project.name,
  project:
    project.name.length > 15
      ? project.name.substring(0, 15) + "..."
      : project.name,
  tasks: tasks.filter(
    (task) => task.project_id === project.id
  ).length,
}));

// -------------------------
// Weekly Productivity (Live)
// -------------------------

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const weeklyData = {
  Sun: 0,
  Mon: 0,
  Tue: 0,
  Wed: 0,
  Thu: 0,
  Fri: 0,
  Sat: 0,
};

tasks.forEach((task) => {
  if (!task.created_at) return;

  const day = weekDays[new Date(task.created_at).getDay()];
  weeklyData[day]++;
});

const lineData = Object.keys(weeklyData).map((day) => ({
  day,
  productivity: weeklyData[day],
}));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

      {/* Pie Chart */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
          Task Status Distribution
        </h2>

        <div className="h-[280px] sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                outerRadius={90}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
<Tooltip
  formatter={(value) => [`${value} Tasks`, "Tasks"]}
  cursor={{
    fill: "rgba(56,189,248,0.12)",
  }}
  contentStyle={{
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "12px",
    color: "#ffffff",
  }}
  itemStyle={{
    color: "#38bdf8",
    fontWeight: 500,
  }}
  labelStyle={{
    color: "#ffffff",
    fontWeight: 600,
  }}
/>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
          Tasks by Project
        </h2>

        <div className="h-[320px] sm:h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
  dataKey="project"
  stroke="#CBD5E1"
  interval={0}
  angle={-20}
  textAnchor="end"
  height={70}
  tick={{ fontSize: 12 }}
/>
              <YAxis stroke="#CBD5E1" />
              <Tooltip
  formatter={(value) => [`${value} Tasks`, "Tasks"]}
  labelFormatter={(label, payload) =>
    payload?.[0]?.payload?.fullName || label
  }
  cursor={{
    fill: "rgba(56,189,248,0.12)",
  }}
  contentStyle={{
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "12px",
    color: "#ffffff",
  }}
  itemStyle={{
    color: "#38bdf8",
    fontWeight: 500,
  }}
  labelStyle={{
    color: "#ffffff",
    fontWeight: 600,
  }}
/>
              <Bar
  dataKey="tasks"
  fill="#38bdf8"
  radius={[8, 8, 0, 0]}
  activeBar={{
    fill: "#0ea5e9",
    stroke: "#ffffff",
    strokeWidth: 1,
  }}
/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Distribution */}
<div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-5">
  <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
    Priority Distribution
  </h2>

  <div className="h-[280px] sm:h-[320px]">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={priorityData}
          dataKey="value"
          outerRadius={90}
          label
        >
          {priorityData.map((entry, index) => (
            <Cell
              key={index}
              fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]}
            />
          ))}
        </Pie>

        <Tooltip
  formatter={(value) => [`${value} Tasks`, "Tasks"]}
  cursor={{
    fill: "rgba(56,189,248,0.12)",
  }}
  contentStyle={{
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "12px",
    color: "#ffffff",
  }}
  itemStyle={{
    color: "#38bdf8",
    fontWeight: 500,
  }}
  labelStyle={{
    color: "#ffffff",
    fontWeight: 600,
  }}
/>
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </div>
</div>

      {/* Line Chart */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-4">
          Weekly Productivity
        </h2>

        <div className="h-[320px] sm:h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#CBD5E1" />
              <YAxis stroke="#CBD5E1" />
              <Tooltip
  formatter={(value) => [`${value} Tasks`, "Created"]}
  cursor={{
    stroke: "#8b5cf6",
    strokeWidth: 2,
  }}
  contentStyle={{
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "12px",
    color: "#ffffff",
  }}
  itemStyle={{
    color: "#8b5cf6",
    fontWeight: 500,
  }}
  labelStyle={{
    color: "#ffffff",
    fontWeight: 600,
  }}
/>
              <Legend />

              <Line
                type="monotone"
                dataKey="productivity"
                stroke="#8b5cf6"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}