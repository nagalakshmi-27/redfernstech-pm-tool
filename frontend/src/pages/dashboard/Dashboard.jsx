import MainLayout from "../../layouts/MainLayout";
import { useContext } from "react";
import AppContext from "../../context/AppContext";
export default function Dashboard() {
  const {
    projects,
    tasks,
    activities,
  } = useContext(AppContext);

  const upcomingTasks = [...tasks]
  .sort(
    (a, b) =>
      new Date(a.dueDate) - new Date(b.dueDate)
  )
  .slice(0, 3);

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">

        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500">
            Total Projects
          </h3>
          <p className="text-3xl font-bold mt-2">
  {projects.length}
</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
          <h3 className="text-gray-500">
            Active Projects
          </h3>
          <p className="text-3xl font-bold mt-2">
            {projects.filter((project) => project.status === "Active").length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-yellow-500">
          <h3 className="text-gray-500">
            Pending Tasks
          </h3>
          <p className="text-3xl font-bold mt-2">
            {tasks.filter((task) => task.status === "To Do").length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500">
            Completed Tasks
          </h3>
          <p className="text-3xl font-bold mt-2">
            {tasks.filter((task) => task.status === "Completed").length}
          </p>
        </div>

      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">
            Recent Activities
          </h2>

          <ul className="space-y-3">
  {activities.length > 0 ? (
    activities.map((activity, index) => (
      <li key={index}>{activity}</li>
    ))
  ) : (
    <li>No recent activities</li>
  )}
</ul>

          
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">
            Upcoming Deadlines
          </h2>

          <ul className="space-y-3">
  {upcomingTasks.map((task) => (
    <li key={task.id}>
      📅 {task.name} - {task.dueDate}
    </li>
  ))}
</ul>
        </div>

      </div>
    </MainLayout>
  );
}