import MainLayout from "../../layouts/MainLayout";
import { useContext, useState } from "react";
import { FolderKanban, Briefcase, ListTodo, CheckCircle } from "lucide-react";
import AppContext from "../../context/AppContext";

export default function Dashboard() {
  const { projects, tasks, activities } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
const [modalTitle, setModalTitle] = useState("");
const [modalData, setModalData] = useState([]);

  // Helper to dynamically calculate project status based on tasks!
  const getDynamicStatus = (project) => {
    const projectTasks = tasks.filter((task) => task.project_id === project.id);
    if (projectTasks.length === 0) return "Planning";
    
    const completedTasks = projectTasks.filter((task) => task.status === "Completed");
    if (completedTasks.length === projectTasks.length) return "Completed";
    
    return "In Progress";
  };

  const upcomingTasks = [...tasks]
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date)) 
    .slice(0, 3);

  const activeProjectsCount = projects.filter((project) => getDynamicStatus(project) === "In Progress").length;
  const pendingTasksCount = tasks.filter((task) => task.status === "To Do").length;
  const completedTasksCount = tasks.filter((task) => task.status === "Completed").length;
  const openProjectsModal = () => {
  setModalTitle("Total Projects");
  setModalData(projects);
  setShowModal(true);
};

const openActiveProjectsModal = () => {
  const activeProjects = projects.filter(
    (project) => getDynamicStatus(project) === "In Progress"
  );

  setModalTitle("Active Projects");
  setModalData(activeProjects);
  setShowModal(true);
};

const openPendingTasksModal = () => {
  const pendingTasks = tasks.filter(
    (task) => task.status === "To Do"
  );

  setModalTitle("Pending Tasks");
  setModalData(pendingTasks);
  setShowModal(true);
};

const openCompletedTasksModal = () => {
  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  );

  setModalTitle("Completed Tasks");
  setModalData(completedTasks);
  setShowModal(true);
};

  return (
    <MainLayout>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">
  Dashboard
</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div
  onClick={openProjectsModal}
  className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500 cursor-pointer hover:shadow-lg"
>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-base font-medium">Total Projects</p>
              <p className="text-2xl md:text-3xl font-bold mt-2">{projects.length}</p>
            </div>
            <FolderKanban size={22} />
          </div>
        </div>

        <div
  onClick={openActiveProjectsModal}
  className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500 cursor-pointer hover:shadow-lg"
>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-base font-medium">Active Projects</p>
              <p className="text-2xl md:text-3xl font-bold mt-2">{activeProjectsCount}</p>
            </div>
            <Briefcase size={22} />
          </div>
        </div>

        <div
  onClick={openPendingTasksModal}
  className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500 cursor-pointer hover:shadow-lg"
>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-base font-medium">Pending Tasks</p>
              <p className="text-2xl md:text-3xl font-bold mt-2">{pendingTasksCount}</p>
            </div>
            <ListTodo size={22} />
          </div>
        </div>

        <div
  onClick={openCompletedTasksModal}
  className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500 cursor-pointer hover:shadow-lg"
>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-base font-medium">Completed Tasks</p>
              <p className="text-2xl md:text-3xl font-bold mt-2">{completedTasksCount}</p>
            </div>
            <CheckCircle size={22} />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
          <ul className="space-y-3">
            {activities.length > 0 ? (
              activities.map((activity, index) => <li key={index}>{activity}</li>)
            ) : (
              <li>No recent activities</li>
            )}
          </ul>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Upcoming Deadlines</h2>
          <ul className="space-y-3">
            {upcomingTasks.map((task) => (
              <li
  key={task.id}
  className="text-sm md:text-base break-words"
>
  📅 {task.name} - {task.due_date}
</li>
            ))}
          </ul>
        </div>
      </div>
      {showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-4 md:p-6 w-[95%] max-w-[700px] max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl md:text-2xl font-bold mb-4">
        {modalTitle}
      </h2>

      {modalData.length > 0 ? (
        <div className="space-y-4">
          {modalData.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-3 md:p-4"
            >
              <h3 className="font-semibold text-lg">
                {item.name}
              </h3>

              {item.description && (
                <p className="text-gray-600 mt-1">
                  {item.description}
                </p>
              )}

              {item.status && (
                <p className="text-sm text-blue-600 mt-2">
                  Status: {item.status}
                </p>
              )}

              {item.due_date && (
                <p className="text-sm text-gray-500 mt-2">
                  Due: {item.due_date}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No records found.</p>
      )}

      <div className="mt-6 text-right">
        <button
          onClick={() => setShowModal(false)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </MainLayout>
  );
}