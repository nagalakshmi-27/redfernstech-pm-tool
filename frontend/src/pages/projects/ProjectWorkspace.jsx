import { useContext, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import AppContext from "../../context/AppContext";
import CreateIssueModal from "../../components/CreateIssueModal";
import { Bug, CheckSquare, Clock3, PlayCircle, CheckCircle, ArrowLeft, ExternalLink } from "lucide-react";
import ProjectChat from "./ProjectChat";
import ProjectWiki from "./ProjectWiki";
import ProjectComments from "./ProjectComments";
import TaskComments from "../../components/TaskComments";
import TaskAttachments from "../../components/TaskAttachments";

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
  const [sourceLink, setSourceLink] = useState("");
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || localStorage.getItem(`activeTab_${id}`) || "Board";
  });

  useEffect(() => {
    localStorage.setItem(`activeTab_${id}`, activeTab);
  }, [activeTab, id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTaskId = params.get("taskId");
    if (urlTaskId && projectTasks.length > 0 && !showEditModal) {
      const task = projectTasks.find(t => t.id === parseInt(urlTaskId));
      if (task) {
        setEditingTaskId(task.id);
        setTaskName(task.name);
        setTaskDescription(task.description || "");
        setPriority(task.priority || "Medium");
        setStatus(task.status || "To Do");
        setIssueType(task.issue_type || "Task");
        setSeverity(task.severity || "Medium");
        setAssigneeId(task.assignee_id || "");
        setSelectedProject(task.project_id || id);
        setDueDate(task.due_date || "");
        setSourceLink(task.source_link || "");
        setShowEditModal(true);
        
        // Clean up URL
        const newUrl = window.location.pathname + window.location.search.replace(`&taskId=${urlTaskId}`, '').replace(`?taskId=${urlTaskId}`, '');
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [projectTasks, showEditModal, id]);

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
      issue_type: issueType, severity: issueType === "Bug" ? severity : null,
      source_link: sourceLink
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
    { title: "To Do", icon: <Clock3 size={20} className="text-yellow-400" />, border: "border-yellow-400" },
    { title: "In Progress", icon: <PlayCircle size={20} className="text-cyan-400" />, border: "border-cyan-400" },
    { title: "Completed", icon: <CheckCircle size={20} className="text-green-400" />, border: "border-green-400" }
  ];

  return (
    <MainLayout>
      <div className="mb-6">
        <Link to="/projects" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 mb-4 w-fit transition">
          <ArrowLeft size={16} /> Back to Projects
        </Link>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-white">
              {project.name}
              <span className={`text-sm font-bold px-3 py-1 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)] ${
                project.calculated_status === "Completed" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                project.calculated_status === "In Progress" ? "bg-green-500/20 text-green-300 border border-green-500/30" :
                "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
              }`}>
                {project.calculated_status}
              </span>
            </h1>
            <p className="text-slate-300 mt-2 max-w-2xl">{project.description}</p>
          </div>
          {currentUserRole !== "Client" && (
             <CreateIssueModal defaultProjectId={project.id} />
          )}
        </div>
      </div>

      {/* TABS MENU */}
      <div className="flex gap-6 border-b border-white/10 mb-6">
        {["Board", "Activity", "Chat", "Wiki"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === tab ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === "Board" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Kanban Board */}
        <div className="lg:col-span-3">
          <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <div 
                key={col.title} 
                className="flex-1 min-w-[280px] bg-white/5 backdrop-blur-md rounded-2xl p-4 shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnColumn(e, col.title)}
              >
                <div className="flex items-center gap-2 mb-4 px-2">
                  {col.icon}
                  <h2 className="text-lg font-bold text-white">{col.title}</h2>
                  <span className="ml-auto bg-white/10 text-slate-300 px-2 py-0.5 rounded-full text-xs font-bold border border-white/10">
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
                         setSourceLink(task.source_link || "");
                         setShowEditModal(true);
                       }}
                       className={`bg-white/10 backdrop-blur-sm border border-white/10 border-l-4 ${col.border} p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] cursor-pointer hover:bg-white/20 transition-all relative group`}
                     >
                       <div className="flex justify-between items-start mb-2">
                         <span className="text-xs font-bold text-slate-300 bg-black/30 px-2 py-1 rounded border border-white/5">
                           {task.ticket_id || `TSK-${task.id}`}
                         </span>
                         <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] ${task.issue_type === "Bug" ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"}`}>
                           {task.issue_type === "Bug" ? <Bug size={12}/> : <CheckSquare size={12}/>}
                           {task.issue_type || "Task"}
                         </span>
                       </div>

                       <h3 className="text-md font-semibold text-white mb-1 leading-snug">{task.name}</h3>
                       {task.issue_type === "Bug" && task.severity && <p className="text-xs text-red-400 font-medium mb-2">Severity: {task.severity}</p>}

                       <div className="flex justify-between items-end mt-4">
                         <span className={`text-xs font-bold px-2 py-1 rounded-full border ${task.priority === "High" ? "bg-red-500/20 text-red-300 border-red-500/30" : task.priority === "Medium" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" : "bg-green-500/20 text-green-300 border-green-500/30"}`}>
                            {task.priority}
                         </span>
                         <div className="w-7 h-7 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(6,182,212,0.5)]" title={members.find(m => m.id === task.assignee_id)?.full_name || "Unassigned"}>
                           {(members.find(m => m.id === task.assignee_id)?.full_name || "U")[0].toUpperCase()}
                         </div>
                       </div>
                       
                       {/* Delete button */}
                       {currentUserRole !== "Client" && (
                         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-red-400 hover:text-red-300 p-1 bg-black/40 rounded-full shadow-sm border border-red-400/20 backdrop-blur-md">×</button>
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
        <div className="lg:col-span-1 bg-white/5 backdrop-blur-md rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 p-6 h-fit">
          <h2 className="text-lg font-bold mb-4 text-white">Project Team</h2>
          <div className="space-y-4">
            {members.filter(m => project.members?.some(mem => mem.id === m.id) || project.created_by_id === m.id).map(member => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                  {(member.full_name || member.name || member.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{member.full_name || member.name || member.email}</p>
                  <p className="text-xs text-slate-400 font-medium">
                    {member.role === "Client" ? "Client" : member.company_role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {activeTab === "Activity" && (
        <ProjectComments projectId={project.id} />
      )}

      {activeTab === "Chat" && (
        <ProjectChat projectId={project.id} projectName={project.name} currentUserRole={currentUserRole} />
      )}

      {activeTab === "Wiki" && (
        <ProjectWiki projectId={project.id} currentUserRole={currentUserRole} />
      )}
      
      {/* Edit Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left" onClick={() => setShowEditModal(false)}>
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 p-6 md:p-8 rounded-2xl w-[95%] max-w-[600px] max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.5)] text-slate-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6 text-white">Edit Ticket</h2>

            <div className="space-y-5">
              <div>
                <label className="block mb-2 font-semibold text-slate-300">Issue Type</label>
                <div className="flex gap-4 p-1 bg-black/30 border border-white/10 rounded-lg w-fit">
                  <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-md transition ${issueType === "Task" ? "bg-white/20 shadow-sm font-bold text-white" : "text-slate-400 hover:bg-white/10"}`}>
                    <input type="radio" value="Task" checked={issueType === "Task"} onChange={(e) => setIssueType(e.target.value)} className="hidden" />
                    Task
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-md transition ${issueType === "Bug" ? "bg-white/20 shadow-sm font-bold text-red-400" : "text-slate-400 hover:bg-white/10"}`}>
                    <input type="radio" value="Bug" checked={issueType === "Bug"} onChange={(e) => setIssueType(e.target.value)} className="hidden" />
                    Bug
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-slate-300">Ticket Title</label>
                <input type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none" />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-slate-300">Description</label>
                <textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg h-24 focus:ring-1 focus:ring-cyan-500 outline-none" />
                
                {/* Render clickable link from database */}
                {sourceLink && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={sourceLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-full border border-cyan-500/20 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
                      <ExternalLink size={12} /> {sourceLink.includes('tab=Wiki') ? "Open Linked Document" : "Open Link"}
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-semibold text-slate-300">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500">
                    <option className="bg-slate-900">High</option>
                    <option className="bg-slate-900">Medium</option>
                    <option className="bg-slate-900">Low</option>
                  </select>
                </div>
                
                {issueType === "Bug" && (
                <div>
                  <label className="block mb-2 font-semibold text-slate-300">Severity</label>
                  <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500">
                    <option className="bg-slate-900">Critical</option>
                    <option className="bg-slate-900">Major</option>
                    <option className="bg-slate-900">Medium</option>
                    <option className="bg-slate-900">Minor</option>
                  </select>
                </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-semibold text-slate-300">Project</label>
                  <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500">
                    <option value="" className="bg-slate-900">Select...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-slate-300">Assignee</label>
                  <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500">
                    <option value="" className="bg-slate-900">Select...</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id} className="bg-slate-900">{member.full_name || member.name || member.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-slate-300">Due Date</label>
                <input type="date" value={dueDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500" />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 font-medium text-slate-300 hover:bg-white/10 rounded-lg transition">Cancel</button>
                <button onClick={handleUpdateTask} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-6 py-2.5 rounded-lg font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all">
                  Save Changes
                </button>
              </div>

              {/* Attachments Section */}
              <TaskAttachments taskId={editingTaskId} />

              {/* Comments Section */}
              <TaskComments taskId={editingTaskId} />

            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
