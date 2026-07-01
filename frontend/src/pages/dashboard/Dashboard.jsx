import MainLayout from "../../layouts/MainLayout";
import { useContext, useState } from "react";
import { FolderKanban, Briefcase, ListTodo, CheckCircle } from "lucide-react";
import AppContext from "../../context/AppContext";

export default function Dashboard() {
  const { projects, tasks, activities } = useContext(AppContext);
  console.log("Projects:", projects);
console.log("Tasks:", tasks);
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
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white">
  Dashboard
</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div
  onClick={openProjectsModal}
  className="bg-white/5 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 border-l-4 border-l-cyan-500 cursor-pointer hover:bg-white/10 transition-all"
>
          <div className="flex justify-between items-center text-slate-200">
            <div>
              <p className="text-slate-400 text-base font-medium">Total Projects</p>
              <p className="text-2xl md:text-3xl font-bold mt-2 text-white">{projects.length}</p>
            </div>
            <FolderKanban size={22} className="text-cyan-400" />
          </div>
        </div>

        <div
  onClick={openActiveProjectsModal}
  className="bg-white/5 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 border-l-4 border-l-green-400 cursor-pointer hover:bg-white/10 transition-all"
>
          <div className="flex justify-between items-center text-slate-200">
            <div>
              <p className="text-slate-400 text-base font-medium">Active Projects</p>
              <p className="text-2xl md:text-3xl font-bold mt-2 text-white">{activeProjectsCount}</p>
            </div>
            <Briefcase size={22} className="text-green-400" />
          </div>
        </div>

        <div
  onClick={openPendingTasksModal}
  className="bg-white/5 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 border-l-4 border-l-yellow-400 cursor-pointer hover:bg-white/10 transition-all"
>
          <div className="flex justify-between items-center text-slate-200">
            <div>
              <p className="text-slate-400 text-base font-medium">Pending Tasks</p>
              <p className="text-2xl md:text-3xl font-bold mt-2 text-white">{pendingTasksCount}</p>
            </div>
            <ListTodo size={22} className="text-yellow-400" />
          </div>
        </div>

        <div
  onClick={openCompletedTasksModal}
  className="bg-white/5 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 border-l-4 border-l-purple-400 cursor-pointer hover:bg-white/10 transition-all"
>
          <div className="flex justify-between items-center text-slate-200">
            <div>
              <p className="text-slate-400 text-base font-medium">Completed Tasks</p>
              <p className="text-2xl md:text-3xl font-bold mt-2 text-white">{completedTasksCount}</p>
            </div>
            <CheckCircle size={22} className="text-purple-400" />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 md:p-6 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          <h2 className="text-xl font-semibold mb-4 text-white">Recent Activities</h2>
          <ul className="space-y-3">
            {activities.length > 0 ? (
              activities.map((activity, index) => <li key={index} className="text-slate-300">{activity}</li>)
            ) : (
              <li className="text-slate-400">No recent activities</li>
            )}
          </ul>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 md:p-6 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
          <h2 className="text-xl font-semibold mb-4 text-white">Upcoming Deadlines</h2>
          <ul className="space-y-3">
            {upcomingTasks.map((task) => (
              <li
  key={task.id}
  className="text-sm md:text-base break-words text-slate-300"
>
  📅 {task.name} - {task.due_date}
</li>
            ))}
          </ul>
        </div>
      </div>
      {showModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 md:p-6 w-[95%] max-w-[700px] max-h-[80vh] overflow-y-auto shadow-2xl">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-white">
        {modalTitle}
      </h2>

      {modalData.length > 0 ? (
        <div className="space-y-4">
          {modalData.map((item) => (
            <div
              key={item.id}
              className="border border-white/10 bg-white/5 rounded-xl p-3 md:p-4"
            >
              <h3 className="font-semibold text-lg text-white">
                {item.name}
              </h3>

              {item.description && (
                <p className="text-slate-400 mt-1">
                  {item.description}
                </p>
              )}

              {item.status && (
                <p className="text-sm text-cyan-400 mt-2">
                  Status: {item.status}
                </p>
              )}

              {item.due_date && (
                <p className="text-sm text-slate-500 mt-2">
                  Due: {item.due_date}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400">No records found.</p>
      )}

      <div className="mt-6 text-right">
        <button
          onClick={() => setShowModal(false)}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all"
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