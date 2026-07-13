import MainLayout from "../../layouts/MainLayout";
import { useState, useContext } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Bug, CheckSquare, Clock, Trash2 } from "lucide-react";
import AppContext from "../../context/AppContext";
import CreateIssueModal from "../../components/CreateIssueModal";

export default function Tasks() {
  const { tasks, setTasks, projects, members, activeWorkspaceRole } = useContext(AppContext);
  const currentUserId = members.find(m => m.email === localStorage.getItem("userEmail"))?.id;
  const currentUserRole = activeWorkspaceRole;
  const navigate = useNavigate();
  
  const [activeView, setActiveView] = useState("Tasks"); // "Tasks" or "Backlog"

  if (currentUserRole === "Client") {
    return <Navigate to="/dashboard" replace />;
  }

  const myTasks = tasks.filter(t => t.assignee_id === currentUserId && projects.some(p => p.id === t.project_id));

  const isTaskCompleted = (task) => {
    const project = projects.find(p => p.id === task.project_id);
    if (!project || !project.board_columns) {
      return task.status === "Completed";
    }
    const columns = typeof project.board_columns === 'string' 
      ? project.board_columns.split(',').map(c => c.trim())
      : project.board_columns;
      
    if (columns.length === 0) return task.status === "Completed" || task.status?.toLowerCase() === "done";
    
    const lastCol = columns[columns.length - 1];
    const lastColName = typeof lastCol === 'string' ? lastCol : lastCol.name;
    
    return task.status === lastColName;
  };

  const hasMissedDeadline = (task) => {
    if (!task.due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  // Filter tasks based on view
  const displayTasks = myTasks.filter(task => {
    const completed = isTaskCompleted(task);
    if (completed) return false; // Never show completed tasks

    const missed = hasMissedDeadline(task);
    
    if (activeView === "Tasks") {
      return !missed;
    } else {
      return missed;
    }
  });

  const handleTaskClick = (task) => {
    navigate(`/projects/${task.project_id}?taskId=${task.id}`);
  };

  const handleDeleteTask = async (e, id) => {
    e.stopPropagation(); // Prevent row click from navigating
    const confirmDelete = window.confirm("Are you sure you want to delete this ticket?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        setTasks(tasks.filter((task) => task.id !== id));
      } else {
        alert("Not authorized to delete this task.");
      }
    } catch {
      alert("Error deleting task.");
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white">My Tasks</h1>
          
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 sm:ml-4">
            <button
              onClick={() => setActiveView("Tasks")}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                activeView === "Tasks"
                  ? "bg-cyan-500/20 text-cyan-300 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveView("Backlog")}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeView === "Backlog"
                  ? "bg-red-500/20 text-red-400 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Backlog
              {myTasks.filter(t => !isTaskCompleted(t) && hasMissedDeadline(t)).length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                  {myTasks.filter(t => !isTaskCompleted(t) && hasMissedDeadline(t)).length}
                </span>
              )}
            </button>
          </div>
        </div>
        <CreateIssueModal />
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/20 text-xs uppercase text-slate-400">
                <th className="p-4 font-semibold whitespace-nowrap">Ticket ID</th>
                <th className="p-4 font-semibold whitespace-nowrap">Title</th>
                <th className="p-4 font-semibold whitespace-nowrap">Project</th>
                <th className="p-4 font-semibold whitespace-nowrap">Status</th>
                <th className="p-4 font-semibold whitespace-nowrap">Priority</th>
                <th className="p-4 font-semibold whitespace-nowrap">Due Date</th>
                <th className="p-4 font-semibold w-10"></th>
              </tr>
            </thead>
            <tbody>
              {displayTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    {activeView === "Tasks" ? "You have no active tasks. Great job!" : "You have no overdue tasks in your backlog!"}
                  </td>
                </tr>
              ) : (
                displayTasks.sort((a, b) => {
                  if (!a.due_date && !b.due_date) return 0;
                  if (!a.due_date) return 1;
                  if (!b.due_date) return -1;
                  return new Date(a.due_date) - new Date(b.due_date);
                }).map((task) => (
                  <tr 
                    key={task.id} 
                    onClick={() => handleTaskClick(task)}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    <td className="p-4 align-middle">
                      <span className="text-xs font-bold text-slate-300 bg-black/30 px-2 py-1 rounded border border-white/5">
                        {task.ticket_id || `TSK-${task.id}`}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          task.issue_type === "Bug" ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        }`}>
                          {task.issue_type === "Bug" ? <Bug size={10}/> : <CheckSquare size={10}/>}
                        </span>
                        <span className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                          {task.name}
                        </span>
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 ml-2" title="Subtasks">
                            <CheckSquare size={10} />
                            {task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length}
                          </span>
                        )}
                        {task.work_logs && task.work_logs.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20" title="Time Logged">
                            <Clock size={10} />
                            {task.work_logs.reduce((acc, log) => acc + log.hours_spent, 0)}h
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className="text-sm text-slate-300">
                        {projects.find(p => p.id === task.project_id)?.name || "Unknown Project"}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-slate-300 font-medium whitespace-nowrap">
                        {task.status}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border whitespace-nowrap ${
                        task.priority === "High" ? "bg-red-500/20 text-red-300 border-red-500/30" :
                        task.priority === "Medium" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                        "bg-green-500/20 text-green-300 border-green-500/30"
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      {task.due_date ? (
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Clock size={14} className={hasMissedDeadline(task) ? "text-red-400" : "text-slate-400"} />
                          <span className={`text-sm font-medium ${hasMissedDeadline(task) ? "text-red-400" : "text-slate-300"}`}>
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      {projects.find((p) => p.id === task.project_id)?.created_by_id === currentUserId && (
                        <button 
                          onClick={(e) => handleDeleteTask(e, task.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                          title="Delete Task"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}