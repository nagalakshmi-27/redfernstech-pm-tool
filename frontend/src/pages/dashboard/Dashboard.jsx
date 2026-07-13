import MainLayout from "../../layouts/MainLayout";
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  Briefcase,
  ListTodo,
  CheckCircle,
  CalendarClock,
  StickyNote,
  Plus,
  X,
  Clock3,
  Circle,
} from "lucide-react";
import AppContext from "../../context/AppContext";
import WelcomeOverview from "./components/WelcomeOverview";

export default function Dashboard() {
  const { projects, tasks } = useContext(AppContext);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState([]);

  // Sticky Notes State
  const [stickyNotes, setStickyNotes] = useState(() => {
    const saved = localStorage.getItem("dashboardStickyNotes");
    if (saved) return JSON.parse(saved);
    return [];
  });

  useEffect(() => {
    localStorage.setItem("dashboardStickyNotes", JSON.stringify(stickyNotes));
  }, [stickyNotes]);

  const addStickyNote = () => {
    const newNote = {
      id: Date.now(),
      text: "",
      color: ["bg-yellow-200", "bg-pink-200", "bg-blue-200", "bg-green-200"][Math.floor(Math.random() * 4)],
      rotation: Math.floor(Math.random() * 6) - 3
    };
    setStickyNotes([newNote, ...stickyNotes]);
  };

  const updateStickyNote = (id, text) => {
    setStickyNotes(notes => notes.map(n => n.id === id ? { ...n, text } : n));
  };

  const deleteStickyNote = (id) => {
    setStickyNotes(notes => notes.filter(n => n.id !== id));
  };

  // Helper to dynamically calculate project status based on tasks!
  const getDynamicStatus = (project) => {
    const projectTasks = tasks.filter((task) => task.project_id === project.id);
    if (projectTasks.length === 0) return "Planning";
    
    const completedTasks = projectTasks.filter((task) => task.status === "Completed");
    if (completedTasks.length === projectTasks.length) return "Completed";
    
    return "In Progress";
  };

  const workspaceTasks = tasks.filter(t => projects.some(p => p.id === t.project_id));

  const upcomingTasks = [...workspaceTasks]
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date)) 
    .slice(0, 3);

  const activeProjectsCount = projects.filter((project) => getDynamicStatus(project) === "In Progress").length;
  const pendingTasksCount = workspaceTasks.filter((task) => task.status === "To Do").length;
  const completedTasksCount = workspaceTasks.filter((task) => task.status === "Completed").length;
  const getDaysRemaining = (dueDate) => {
  if (!dueDate) return "No due date";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diff < 0) return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) > 1 ? "s" : ""}`;
  if (diff === 0) return "Due Today";
  if (diff === 1) return "Due Tomorrow";

  return `Due in ${diff} days`;
};

const handleDeadlineClick = (task) => {
  navigate(`/projects/${task.project_id}?taskId=${task.id}`);
};
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
  const pendingTasks = workspaceTasks.filter(
    (task) => task.status === "To Do"
  );

  setModalTitle("Pending Tasks");
  setModalData(pendingTasks);
  setShowModal(true);
};

const openCompletedTasksModal = () => {
  const completedTasks = workspaceTasks.filter(
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <WelcomeOverview />

        {/* Upcoming Deadlines */}
<div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 md:p-6 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] h-[295px] flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
  <CalendarClock size={20} className="text-purple-400" />
  Upcoming Deadlines
</h2>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
  <ul className="space-y-4">
            {upcomingTasks.map((task) => (
              <li
  key={task.id}
  onClick={() => handleDeadlineClick(task)}
  className="relative flex gap-4 pb-5 last:pb-0 cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-all"
>
  {/* Timeline */}
  <div className="flex flex-col items-center">
    <div className="w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-cyan-400/10"></div>

    {upcomingTasks[upcomingTasks.length - 1].id !== task.id && (
      <div className="w-px flex-1 bg-gradient-to-b from-cyan-400/30 to-transparent mt-2"></div>
    )}
  </div>

  {/* Content */}
<div className="flex-1">
  <p className="text-xs uppercase tracking-wide text-purple-300">
    {new Date(task.due_date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    })}
  </p>

  <p className="text-white font-semibold mt-1 leading-5">
    {task.name}
  </p>

  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">

    <div className="flex items-center gap-1">
      <Clock3 size={13} />
      <span>{getDaysRemaining(task.due_date)}</span>
    </div>

    <div
      className={`flex items-center gap-1 ${
        task.priority === "High"
          ? "text-red-400"
          : task.priority === "Medium"
          ? "text-yellow-400"
          : "text-green-400"
      }`}
    >
      <Circle
        size={8}
        fill="currentColor"
      />

      <span>{task.priority}</span>
    </div>

  </div>
</div>
</li>

            ))}
          </ul>
          </div>
        </div>
      </div>

      {/* Quick Notes Section */}
      <div className="mb-8 relative z-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
  <StickyNote size={20} className="text-yellow-400" />
  Quick Notes
</h2>
          <button
  onClick={addStickyNote}
  className="flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors border border-white/10"
>
  <Plus size={16} />
  Add Note
</button>
        </div>
        
        {stickyNotes.length === 0 ? (
          <div className="text-slate-400 text-sm italic bg-white/5 p-6 rounded-xl border border-white/10 border-dashed text-center">
            You don't have any sticky notes. Click "Add Note" to jot something down!
          </div>
        ) : (
          <div className="flex flex-wrap gap-6 items-start pb-4">
            {stickyNotes.map((note) => {
              const bgClass = note.color.startsWith("bg-") ? note.color : `bg-${note.color}-200`;
              return (
                <div 
                  key={note.id} 
                  className={`relative w-48 h-48 md:w-56 md:h-56 p-4 shadow-[3px_5px_15px_rgba(0,0,0,0.4)] hover:shadow-[5px_10px_20px_rgba(0,0,0,0.5)] transition-shadow duration-300 flex flex-col ${bgClass} text-slate-800 shrink-0 group rounded-sm`}
                  style={{
                    transform: `rotate(${note.rotation}deg)`,
                    fontFamily: "'Comic Sans MS', 'Caveat', 'Kalam', cursive, sans-serif"
                  }}
                >
                  {/* Tape effect */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-6 bg-white/50 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.1)] transform rotate-2 z-10 rounded-sm"></div>
                  
                  <button
  onClick={() => deleteStickyNote(note.id)}
  className="absolute top-2 right-2 text-black/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-20"
  title="Discard Note"
>
  <X size={18} />
</button>
                  <textarea 
                    value={note.text}
                    onChange={(e) => updateStickyNote(note.id, e.target.value)}
                    placeholder="Type a quick note..."
                    className="w-full flex-1 bg-transparent border-none outline-none resize-none placeholder-black/30 mt-4 leading-relaxed font-medium text-sm md:text-base scrollbar-hide z-10"
                    spellCheck="false"
                  />
                  
                  {/* Folded corner effect */}
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-black/10" style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }}></div>
                  <div className={`absolute bottom-0 right-0 w-6 h-6 ${bgClass} brightness-90`} style={{ clipPath: "polygon(100% 0, 0 100%, 0 0)" }}></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showModal && (
  <div 
    onClick={() => setShowModal(false)} 
    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  >
    <div 
      onClick={(e) => e.stopPropagation()} 
      className="relative bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 md:p-6 w-[95%] max-w-[700px] max-h-[80vh] overflow-y-auto shadow-2xl"
    >
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