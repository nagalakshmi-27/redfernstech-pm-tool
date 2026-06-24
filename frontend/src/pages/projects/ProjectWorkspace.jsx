import { useContext, useState } from "react";
import { useParams, Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import AppContext from "../../context/AppContext";
import CreateIssueModal from "../../components/CreateIssueModal";
import { Bug, CheckSquare, Clock3, PlayCircle, CheckCircle, ArrowLeft } from "lucide-react";

export default function ProjectWorkspace() {
  const { id } = useParams();
  const { projects, tasks, setTasks, members } = useContext(AppContext);
  const currentUserRole = localStorage.getItem("userRole");
  const currentUserId = Number(localStorage.getItem("userId"));

  const project = projects.find(p => p.id === parseInt(id));
  const projectTasks = tasks.filter(t => t.project_id === parseInt(id));

  // Edit Task State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("To Do");
  const [issueType, setIssueType] = useState("Task");
  const [severity, setSeverity] = useState("Medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [selectedProject, setSelectedProject] = useState(id);
  const [dueDate, setDueDate] = useState("");

  if (!project) {
    return (
      <MainLayout>
        <div className="p-8 text-center text-slate-500 font-medium">Project not found or you don't have access.</div>
      </MainLayout>
    );
  }

  // Kanban logic
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const updateTaskPosition = async (taskId, newStatus, newPosition) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t));
    
    try {
      const taskToUpdate = tasks.find(t => t.id === taskId);
      if (!taskToUpdate) return;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ ...taskToUpdate, status: newStatus, position: newPosition })
      });
      if (!response.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: taskToUpdate.status, position: taskToUpdate.position } : t));
        alert("Not authorized to move this task.");
      }
    } catch {
      alert("Error updating status.");
    }
  };

  const handleDropOnCard = (e, targetTask, columnTitle) => {
     e.preventDefault();
     e.stopPropagation();
     if (currentUserRole === "Client") return; 

     const draggedTaskId = parseInt(e.dataTransfer.getData("taskId"));
     if (!draggedTaskId || draggedTaskId === targetTask.id) return;
     
     const rect = e.currentTarget.getBoundingClientRect();
     const dropY = e.clientY - rect.top;
     const isBottomHalf = dropY > rect.height / 2;

     const filteredTasks = projectTasks.filter(t => t.status === columnTitle && t.id !== draggedTaskId).sort((a, b) => (a.position || 0) - (b.position || 0));
     const targetIndex = filteredTasks.findIndex(t => t.id === targetTask.id);
     
     let newPosition = 0;
     
     if (isBottomHalf) {
        if (targetIndex === filteredTasks.length - 1) {
           newPosition = (targetTask.position || 0) + 1000;
        } else {
           const nextTask = filteredTasks[targetIndex + 1];
           newPosition = ((targetTask.position || 0) + (nextTask.position || 0)) / 2;
        }
     } else {
        if (targetIndex === 0) {
           newPosition = (targetTask.position || 0) - 1000;
        } else {
           const prevTask = filteredTasks[targetIndex - 1];
           newPosition = ((prevTask.position || 0) + (targetTask.position || 0)) / 2;
        }
     }

     updateTaskPosition(draggedTaskId, columnTitle, newPosition);
  };

  const handleDropOnColumn = (e, columnTitle) => {
     e.preventDefault();
     if (currentUserRole === "Client") return; 

     const draggedTaskId = parseInt(e.dataTransfer.getData("taskId"));
     if (!draggedTaskId) return;
     
     const columnTasks = projectTasks.filter(t => t.status === columnTitle).sort((a, b) => (a.position || 0) - (b.position || 0));
     let newPosition = 0;
     if (columnTasks.length > 0) {
       newPosition = (columnTasks[columnTasks.length - 1].position || 0) + 1000;
     }
     
     updateTaskPosition(draggedTaskId, columnTitle, newPosition);
  };

  const handleUpdateTask = async () => {
    if (!taskName.trim()) { alert("Name is required"); return; }
    if (!taskDescription.trim()) { alert("Description is required"); return; }
    if (!assigneeId) { alert("Assignee is required"); return; }
    if (!dueDate) { alert("Due Date is required"); return; }
    if (!selectedProject) { alert("Please select a project"); return; }

    const taskData = {
      name: taskName, description: taskDescription, priority, status, due_date: dueDate,
      assignee_id: parseInt(assigneeId), project_id: parseInt(selectedProject),
      issue_type: issueType, severity: issueType === "Bug" ? severity : null
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${editingTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(taskData)
      });
      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map(t => t.id === editingTaskId ? updatedTask : t));
        setShowEditModal(false);
      }
    } catch {
      alert("Error updating task.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        setTasks(tasks.filter(t => t.id !== taskId));
      } else {
        alert("Not authorized to delete this task.");
      }
    } catch { 
      alert("Error deleting task"); 
    }
  };

  const COLUMNS = [
    { title: "To Do", icon: <Clock3 size={20} className="text-yellow-600" />, border: "border-yellow-400" },
    { title: "In Progress", icon: <PlayCircle size={20} className="text-blue-600" />, border: "border-blue-400" },
    { title: "Completed", icon: <CheckCircle size={20} className="text-green-600" />, border: "border-green-400" }
  ];

  return (
    <MainLayout>
      <div className="mb-6">
        <Link to="/projects" className="text-slate-500 hover:text-slate-800 flex items-center gap-2 mb-4 w-fit transition">
          <ArrowLeft size={16} /> Back to Projects
        </Link>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              {project.name}
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                project.calculated_status === "Completed" ? "bg-green-100 text-green-700" :
                project.calculated_status === "In Progress" ? "bg-blue-100 text-blue-700" :
                "bg-slate-100 text-slate-700"
              }`}>
                {project.calculated_status}
              </span>
            </h1>
            <p className="text-slate-600 mt-2 max-w-2xl">{project.description}</p>
          </div>
          {currentUserRole !== "Client" && (
             <CreateIssueModal defaultProjectId={project.id} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Kanban Board */}
        <div className="lg:col-span-3">
          <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <div 
                key={col.title} 
                className="flex-1 min-w-[280px] bg-slate-100/80 rounded-2xl p-4 shadow-inner border border-slate-200/60"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnColumn(e, col.title)}
              >
                <div className="flex items-center gap-2 mb-4 px-2">
                  {col.icon}
                  <h2 className="text-lg font-bold text-slate-800">{col.title}</h2>
                  <span className="ml-auto bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {projectTasks.filter(t => t.status === col.title).length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 min-h-[500px]">
                  {projectTasks.filter(t => t.status === col.title).sort((a, b) => (a.position || 0) - (b.position || 0)).map((task) => (
                     <div 
                       key={task.id} 
                       draggable={currentUserRole !== "Client"}
                       onDragStart={(e) => handleDragStart(e, task.id)}
                       onDragOver={handleDragOver}
                       onDrop={(e) => handleDropOnCard(e, task, col.title)}
                       onClick={() => {
                         setEditingTaskId(task.id); setTaskName(task.name); setTaskDescription(task.description);
                         setPriority(task.priority); setStatus(task.status); setIssueType(task.issue_type || "Task");
                         setSeverity(task.severity || "Medium"); setAssigneeId(task.assignee_id || "");
                         setSelectedProject(task.project_id); setDueDate(task.due_date || "");
                         setShowEditModal(true);
                       }}
                       className={`bg-white rounded-xl shadow-sm border-l-4 ${col.border} p-4 cursor-pointer hover:shadow-md transition-shadow relative group`}
                     >
                       <div className="flex justify-between items-start mb-2">
                         <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                           {task.ticket_id || `TSK-${task.id}`}
                         </span>
                         <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${task.issue_type === "Bug" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                           {task.issue_type === "Bug" ? <Bug size={12}/> : <CheckSquare size={12}/>}
                           {task.issue_type || "Task"}
                         </span>
                       </div>

                       <h3 className="text-md font-semibold text-slate-900 mb-1 leading-snug">{task.name}</h3>
                       {task.issue_type === "Bug" && task.severity && <p className="text-xs text-red-600 font-medium mb-2">Severity: {task.severity}</p>}

                       <div className="flex justify-between items-end mt-4">
                         <span className={`text-xs font-bold px-2 py-1 rounded-full ${task.priority === "High" ? "bg-red-50 text-red-600" : task.priority === "Medium" ? "bg-yellow-50 text-yellow-600" : "bg-green-50 text-green-600"}`}>
                            {task.priority}
                         </span>
                         <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold" title={members.find(m => m.id === task.assignee_id)?.full_name || "Unassigned"}>
                           {(members.find(m => m.id === task.assignee_id)?.full_name || "U")[0].toUpperCase()}
                         </div>
                       </div>
                       
                       {/* Delete button */}
                       {project.created_by_id === currentUserId && (
                         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-red-500 hover:text-red-700 p-1 bg-white rounded-full shadow-sm">×</button>
                         </div>
                       )}
                     </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Panel for Team Roster */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit">
          <h2 className="text-lg font-bold mb-4 text-slate-800">Project Team</h2>
          <div className="space-y-4">
            {members.filter(m => project.members?.some(mem => mem.id === m.id) || project.created_by_id === m.id).map(member => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold">
                  {(member.full_name || member.name || member.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{member.full_name || member.name || member.email}</p>
                  <p className="text-xs text-slate-500 font-medium">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Edit Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 text-left" onClick={() => setShowEditModal(false)}>
          <div className="bg-white p-6 md:p-8 rounded-2xl w-[95%] max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl text-slate-800" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Edit Ticket</h2>

            <div className="space-y-5">
              <div>
                <label className="block mb-2 font-semibold text-slate-700">Issue Type</label>
                <div className="flex gap-4 p-1 bg-slate-100 rounded-lg w-fit">
                  <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-md transition ${issueType === "Task" ? "bg-white shadow-sm font-bold text-blue-700" : "text-slate-600 hover:bg-slate-200"}`}>
                    <input type="radio" value="Task" checked={issueType === "Task"} onChange={(e) => setIssueType(e.target.value)} className="hidden" />
                    Task
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-md transition ${issueType === "Bug" ? "bg-white shadow-sm font-bold text-red-600" : "text-slate-600 hover:bg-slate-200"}`}>
                    <input type="radio" value="Bug" checked={issueType === "Bug"} onChange={(e) => setIssueType(e.target.value)} className="hidden" />
                    Bug
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-slate-700">Ticket Title</label>
                <input type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-slate-700">Description</label>
                <textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg h-24 focus:ring-2 focus:ring-slate-900 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-slate-900">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                
                {issueType === "Bug" && (
                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Severity</label>
                  <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-slate-900">
                    <option>Critical</option>
                    <option>Major</option>
                    <option>Medium</option>
                    <option>Minor</option>
                  </select>
                </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Project</label>
                  <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="">Select...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Assignee</label>
                  <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="">Select...</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>{member.full_name || member.name || member.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-slate-700">Due Date</label>
                <input type="date" value={dueDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setDueDate(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t mt-6">
                <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button onClick={handleUpdateTask} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg transition">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
