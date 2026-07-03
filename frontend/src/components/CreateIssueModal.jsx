import { useState, useContext, useEffect } from "react";
import { createPortal } from "react-dom";
import AppContext from "../context/AppContext";

export default function CreateIssueModal({ 
  defaultProjectId = "", 
  defaultTaskDescription = "", 
  defaultTaskName = "",
  defaultAssigneeId = "",
  defaultDueDate = "",
  defaultSourceLink = null,
  isOpen = undefined, 
  onClose = undefined, 
  hideTrigger = false,
  onSuccess = undefined
}) {
  const { tasks, setTasks, activities, setActivities, projects, members, activeWorkspaceRole } = useContext(AppContext);
  const currentUserRole = activeWorkspaceRole;
  
  const [internalShowModal, setInternalShowModal] = useState(false);
  const showModal = isOpen !== undefined ? isOpen : internalShowModal;

  const [taskName, setTaskName] = useState(defaultTaskName);
  const [taskDescription, setTaskDescription] = useState(defaultTaskDescription);
  const [priority, setPriority] = useState("Medium");
  const [issueType, setIssueType] = useState("Task");
  const [severity, setSeverity] = useState("Medium");
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId);
  const [selectedProject, setSelectedProject] = useState(defaultProjectId);
  const selectedProjectData = projects.find(
  (project) => project.id === Number(selectedProject)
);

const filteredMembers = members.filter((member) => {
  // Hide Clients
  if (member.role === "Client") return false;

  // If no project is selected, show all non-client members
  if (!selectedProjectData) return true;

  // Show only members who belong to the selected project
  return selectedProjectData.members?.some(
  (projectMember) => projectMember.id === member.id
);
});
  const [dueDate, setDueDate] = useState(defaultDueDate);

  useEffect(() => {
    if (defaultTaskDescription) setTaskDescription(defaultTaskDescription);
    if (defaultTaskName) setTaskName(defaultTaskName);
    if (defaultAssigneeId) setAssigneeId(defaultAssigneeId);
    if (defaultDueDate) setDueDate(defaultDueDate);
  }, [defaultTaskDescription, defaultTaskName, defaultAssigneeId, defaultDueDate]);

  const handleClose = () => {
    if (onClose) onClose();
    else setInternalShowModal(false);
  };

  if (currentUserRole === "Client") return null;

  const handleCreateTask = async () => {
    if (!taskName.trim()) { alert("Title is required"); return; }
    if (!taskDescription.trim()) { alert("Description is required"); return; }
    if (!assigneeId) { alert("Assignee is required"); return; }
    if (!dueDate) { alert("Due Date is required"); return; }
    if (!selectedProject) { alert("Please select a project"); return; }

    const token = localStorage.getItem("token");
    const taskData = {
      name: taskName,
      description: taskDescription,
      priority: priority,
      status: "To Do",
      due_date: dueDate,
      assignee_id: parseInt(assigneeId), 
      project_id: parseInt(selectedProject),
      issue_type: issueType,
      severity: issueType === "Bug" ? severity : null,
      source_link: defaultSourceLink
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(taskData)
      });
      if (response.ok) {
        const newTask = await response.json();
        setTasks([...tasks, newTask]);
        setActivities([`📝 ${newTask.name} ticket created`, ...activities]);
        
        // Reset form
        setTaskName("");
        setTaskDescription("");
        setPriority("Medium");
        setIssueType("Task");
        setSeverity("Medium");
        setAssigneeId("");
        setSelectedProject("");
        setDueDate("");
        setDueDate("");
        handleClose();
        if (onSuccess) onSuccess(newTask);
      } else {
        alert("Failed to create ticket.");
      }
    } catch {
      alert("Error saving to database.");
    }
  };

  return (
    <>
      {!hideTrigger && (
        <button 
          onClick={() => setInternalShowModal(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-2.5 px-5 rounded-lg flex items-center justify-center gap-2 transition shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] w-full sm:w-auto"
        >
          <span className="text-xl leading-none">+</span> Create Issue
        </button>
      )}

      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left" onClick={handleClose}>
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 p-6 md:p-8 rounded-2xl w-[95%] max-w-[600px] max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.5)] text-slate-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
              <span className="text-cyan-400">+</span> Create New Issue
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block mb-2 font-semibold text-slate-300">Issue Type</label>
                <div className="flex gap-4 p-1 bg-black/30 border border-white/10 rounded-lg w-fit">
                  <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-md transition ${issueType === "Task" ? "bg-white/10 shadow-sm font-bold text-cyan-400 border border-cyan-400/30" : "text-slate-400 hover:bg-white/5"}`}>
                    <input type="radio" value="Task" checked={issueType === "Task"} onChange={(e) => setIssueType(e.target.value)} className="hidden" />
                    Task
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-md transition ${issueType === "Bug" ? "bg-white/10 shadow-sm font-bold text-red-400 border border-red-400/30" : "text-slate-400 hover:bg-white/5"}`}>
                    <input type="radio" value="Bug" checked={issueType === "Bug"} onChange={(e) => setIssueType(e.target.value)} className="hidden" />
                    Bug
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-slate-300">Ticket Title</label>
                <input type="text" placeholder="e.g. Implement login feature" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 transition" />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-slate-300">Description</label>
                <textarea placeholder="Steps to reproduce or acceptance criteria..." value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg h-28 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition" />
              </div>

              {issueType === "Task" ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

    {/* Priority */}
    <div>
      <label className="block mb-2 font-semibold text-slate-300">
        Priority
      </label>

      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
      >
        <option className="bg-slate-900">High</option>
        <option className="bg-slate-900">Medium</option>
        <option className="bg-slate-900">Low</option>
      </select>
    </div>

    {/* Project */}
    <div>
      <label className="block mb-2 font-semibold text-slate-300">
        Project
      </label>

      <select
        value={selectedProject}
        onChange={(e) => {
          setSelectedProject(e.target.value);
          setAssigneeId("");
        }}
        className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
      >
        <option value="" className="bg-slate-900">
          Select a project...
        </option>

        {projects.map((project) => (
          <option
            key={project.id}
            value={project.id}
            className="bg-slate-900"
          >
            {project.name}
          </option>
        ))}
      </select>
    </div>

  </div>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

    {/* Priority */}
    <div>
      <label className="block mb-2 font-semibold text-slate-300">
        Priority
      </label>

      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
      >
        <option className="bg-slate-900">High</option>
        <option className="bg-slate-900">Medium</option>
        <option className="bg-slate-900">Low</option>
      </select>
    </div>

    {/* Severity */}
    <div>
      <label className="block mb-2 font-semibold text-slate-300">
        Severity
      </label>

      <select
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
        className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
      >
        <option className="bg-slate-900">Critical</option>
        <option className="bg-slate-900">Major</option>
        <option className="bg-slate-900">Medium</option>
        <option className="bg-slate-900">Minor</option>
      </select>
    </div>

  </div>
)}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">


  {issueType === "Bug" && (
  <div>
    <label className="block mb-2 font-semibold text-slate-300">
      Project
    </label>

    <select
      value={selectedProject}
      onChange={(e) => {
        setSelectedProject(e.target.value);
        setAssigneeId("");
      }}
      className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
    >
      <option value="" className="bg-slate-900">
        Select a project...
      </option>

      {projects.map((project) => (
        <option
          key={project.id}
          value={project.id}
          className="bg-slate-900"
        >
          {project.name}
        </option>
      ))}
    </select>
  </div>
)}
  {/* Assignee */}
  <div>
    <label className="block mb-2 font-semibold text-slate-300">
      Assignee
    </label>

    <select
      value={assigneeId}
      onChange={(e) => setAssigneeId(e.target.value)}
      className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
    >
      <option className="bg-slate-900" value="">
        Select assignee...
      </option>

      {filteredMembers.map((member) => (
        <option
          key={member.id}
          value={member.id}
          className="bg-slate-900"
        >
          {member.full_name || member.name || member.email}
        </option>
      ))}
    </select>
  </div>

  {/* Due Date */}
  <div className={issueType === "Bug" ? "sm:col-span-2" : ""}>
    <label className="block mb-2 font-semibold text-slate-300">
      Due Date
    </label>

    <input
      type="date"
      value={dueDate}
      min={new Date().toISOString().split("T")[0]}
      onChange={(e) => setDueDate(e.target.value)}
      className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
    />
  </div>

</div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-white/10 mt-8">
                <button onClick={handleClose} className="px-5 py-2.5 font-bold text-slate-300 border border-white/20 hover:bg-white/5 rounded-lg transition">Cancel</button>
                <button onClick={handleCreateTask} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-2.5 rounded-lg font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all">
                  Create Issue
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
