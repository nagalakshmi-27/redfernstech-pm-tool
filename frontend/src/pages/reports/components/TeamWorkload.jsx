import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function TeamWorkload({ members, tasks }) {
  const workloadData = members
  .filter((member) => member.role !== "Client")
  .map((member) => {
    const assignedTasks = tasks.filter(
      (task) => task.assignee_id === member.id
    ).length;

    return {
      name: member.full_name || member.name || member.email,
      tasks: assignedTasks,
    };
  });

  return (
  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-6 h-full">

    <h2 className="text-lg sm:text-xl font-semibold text-white mb-5">
      Team Workload
    </h2>

    <div className="h-[320px] sm:h-[380px]">

      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={workloadData}
          layout="vertical"
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#334155"
          />

          <XAxis
            type="number"
            stroke="#CBD5E1"
            tick={{ fontSize: 12 }}
          />

          <YAxis
            type="category"
            dataKey="name"
            stroke="#CBD5E1"
            width={120}
            tick={{
              fontSize: 12,
            }}
            tickFormatter={(value) =>
              value.length > 12
                ? value.substring(0, 12) + "..."
                : value
            }
          />

          <Tooltip
            formatter={(value) => [`${value} Tasks`, "Assigned"]}
            cursor={{
              fill: "rgba(6,182,212,0.12)",
            }}
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "12px",
              color: "#ffffff",
            }}
            itemStyle={{
              color: "#06b6d4",
              fontWeight: 500,
            }}
            labelStyle={{
              color: "#ffffff",
              fontWeight: 600,
            }}
          />

          <Bar
            dataKey="tasks"
            fill="#06b6d4"
            radius={[0, 8, 8, 0]}
            activeBar={{
              fill: "#0891b2",
              stroke: "#ffffff",
              strokeWidth: 1,
            }}
          />
        </BarChart>
      </ResponsiveContainer>

    </div>

  </div>
);
}