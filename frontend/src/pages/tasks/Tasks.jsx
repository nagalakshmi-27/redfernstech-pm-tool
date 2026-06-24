import MainLayout from "../../layouts/MainLayout";
import { useState, useContext } from "react";
import { Navigate } from "react-router-dom";
import { Bug, CheckSquare, Clock3, PlayCircle, CheckCircle } from "lucide-react";
import AppContext from "../../context/AppContext";
import CreateIssueModal from "../../components/CreateIssueModal";

export default function Tasks() {
  const { tasks, setTasks, activities, setActivities, projects, members } = useContext(AppContext);
  const currentUserId = members.find(m => m.email === localStorage.getItem("userEmail"))?.id;
  const currentUserRole = localStorage.getItem("userRole");

  if (currentUserRole === "Client") {
    return <Navigate to="/dashboard" replace />;
  }

  // STEP 1: Filter to ONLY show tasks assigned to the logged-in user
  const myTasks = tasks.filter(t => t.assignee_id === currentUserId);

  const [showModal, setShowModal] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("To Do");
  const [issueType, setIssueType] = useState("Task");
  const [severity, setSeverity] = useState("Medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const updateTaskPosition = async (taskId, newStatus, newPosition) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t));
    
    const token = localStorage.getItem("token");
    try {
      const taskToUpdate = tasks.find(t => t.id === taskId);
      if (!taskToUpdate) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          ...taskToUpdate,
          status: newStatus,
          position: newPosition
        })
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

     const filteredTasks = myTasks.filter(t => t.status === columnTitle && t.id !== draggedTaskId).sort((a, b) => (a.position || 0) - (b.position || 0));
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
     
     const columnTasks = myTasks.filter(t => t.status === columnTitle).sort((a, b) => (a.position || 0) - (b.position || 0));
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

    const token = localStorage.getItem("token");
    
    const taskData = {
      name: taskName,
      description: taskDescription,
      priority: priority,
      status: status,
      due_date: dueDate,
      assignee_id: parseInt(assigneeId), 
      project_id: parseInt(selectedProject),
      issue_type: issueType,
      severity: issueType === "Bug" ? severity : null
    };

    try {
      if (editingTaskId) {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${editingTaskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(taskData)
        });
        if (response.ok) {
          const updatedTask = await response.json();
          setTasks(tasks.map((t) => t.id === editingTaskId ? updatedTask : t));
        }
      }
    } catch {
      alert("Failed to save to database.");
    }

    setTaskName("");
    setTaskDescription("");
    setPriority("Medium");
    setStatus("To Do");
    setIssueType("Task");
    setSeverity("Medium");
    setAssigneeId("");
    setSelectedProject("");
    setDueDate("");
    setEditingTaskId(null);
    setShowModal(false);
  };

  const handleDeleteTask = async (id) => {
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

  const COLUMNS = [
    { title: "To Do", icon: <Clock3 size={20} className="text-yellow-600" />, border: "border-yellow-400" },
    { title: "In Progress", icon: <PlayCircle size={20} className="text-blue-600" />, border: "border-blue-400" },
    { title: "Completed", icon: <CheckCircle size={20} className="text-green-600" />, border: "border-green-400" }
  ];

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">My Tasks</h1>
        <CreateIssueModal />
      </div>

      <div className="flex flex-col md:flex-row gap-6 mt-6 overflow-x-auto pb-6">
        {COLUMNS.map((col) => (
          <div 
            key={col.title} 
            className="flex-1 min-w-[320px] bg-slate-100 rounded-2xl p-4 shadow-inner"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnColumn(e, col.title)}
          >
            <div className="flex items-center gap-2 mb-4 px-2">
              {col.icon}
              <h2 className="text-lg font-bold text-slate-800">{col.title}</h2>
              <span className="ml-auto bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
                {myTasks.filter(t => t.status === col.title).length}
              </span>
            </div>

            <div className="flex flex-col gap-3 min-h-[500px]">
              {/* WE USE myTasks HERE TO FILTER THE BOARD! */}
              {myTasks.filter(t => t.status === col.title).sort((a, b) => (a.position || 0) - (b.position || 0)).map((task) => (
                 <div 
                   key={task.id} 
                   draggable={currentUserRole !== "Client"}
                   onDragStart={(e) => handleDragStart(e, task.id)}
                   onDragOver={handleDragOver}
                   onDrop={(e) => handleDropOnCard(e, task, col.title)}
                   onClick={() => {
                     // STEP 2: Make the entire card click to open Details / Edit Modal
                     setEditingTaskId(task.id);
                     setTaskName(task.name);
                     setTaskDescription(task.description);
                     setPriority(task.priority);
                     setStatus(task.status);
                     setIssueType(task.issue_type || "Task");
                     setSeverity(task.severity || "Medium");
                     setAssigneeId(task.assignee_id || "");
                     setSelectedProject(task.project_id);
                     setDueDate(task.due_date || "");
                     setShowModal(true);
                   }}
                   className={`bg-white rounded-xl shadow-sm border-l-4 ${col.border} p-4 cursor-pointer hover:shadow-md transition-shadow relative group`}
                 >
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                       {task.ticket_id || `TSK-${task.id}`}
                     </span>
                     
                     <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                       task.issue_type === "Bug" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                     }`}>
                       {task.issue_type === "Bug" ? <Bug size={12}/> : <CheckSquare size={12}/>}
                       {task.issue_type || "Task"}
                     </span>
                   </div>

                   <h3 className="text-md font-semibold text-slate-900 mb-1 leading-snug">{task.name}</h3>
                   
                   {task.issue_type === "Bug" && task.severity && (
                     <p className="text-xs text-red-600 font-medium mb-2">Severity: {task.severity}</p>
                   )}

                   <div className="flex justify-between items-end mt-4">
                     <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        task.priority === "High" ? "bg-red-50 text-red-600" :
                        task.priority === "Medium" ? "bg-yellow-50 text-yellow-600" :
                        "bg-green-50 text-green-600"
                      }`}>
                        {task.priority}
                      </span>
                     
                     <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold" title={members.find(m => m.id === task.assignee_id)?.full_name || "Unassigned"}>
                       {(members.find(m => m.id === task.assignee_id)?.full_name || "U")[0].toUpperCase()}
                     </div>
                   </div>

                   {/* Delete button (stop click propagation) */}
                   {projects.find((p) => p.id === task.project_id)?.created_by_id === currentUserId && (
                     <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} 
                         className="text-red-500 hover:text-red-700 p-1 bg-white rounded-full shadow-sm"
                       >
                         ×
                       </button>
                     </div>
                   )}
                 </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => { setShowModal(false); setEditingTaskId(null); }}>
          <div className="bg-white p-6 rounded-2xl w-[95%] max-w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Ticket Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-slate-700">Issue Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="Task" checked={issueType === "Task"} onChange={(e) => setIssueType(e.target.value)} className="w-4 h-4 text-slate-900" />
                    <span className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">Task</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="Bug" checked={issueType === "Bug"} onChange={(e) => setIssueType(e.target.value)} className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-700 bg-red-50 px-2 py-1 rounded">Bug</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-slate-700">Ticket Title</label>
                <input type="text" placeholder="e.g. Implement login feature" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
              </div>

              <div>
                <label className="block mb-2 font-medium text-slate-700">Description</label>
                <textarea placeholder="Steps to reproduce or acceptance criteria..." value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="w-full border p-3 rounded-lg h-24 focus:ring-2 focus:ring-slate-900 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-slate-700">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-slate-900">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                
                {issueType === "Bug" && (
                <div>
                  <label className="block mb-2 font-medium text-slate-700">Severity</label>
                  <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-slate-900">
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
                  <label className="block mb-2 font-medium text-slate-700">Project</label>
                  <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="">Select...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-slate-700">Assignee</label>
                  <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="">Select...</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>{member.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-slate-700">Due Date</label>
                <input type="date" value={dueDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setDueDate(e.target.value)} className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t mt-6">
                <button onClick={() => { setShowModal(false); setEditingTaskId(null); }} className="px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
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