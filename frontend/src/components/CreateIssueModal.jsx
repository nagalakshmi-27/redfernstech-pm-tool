import { useState, useContext } from "react";
import AppContext from "../context/AppContext";

export default function CreateIssueModal() {
  const { tasks, setTasks, activities, setActivities, projects, members } = useContext(AppContext);
  const currentUserRole = localStorage.getItem("userRole");
  
  const [showModal, setShowModal] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [issueType, setIssueType] = useState("Task");
  const [severity, setSeverity] = useState("Medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [dueDate, setDueDate] = useState("");

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
      severity: issueType === "Bug" ? severity : null
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
        setShowModal(false);
      } else {
        alert("Failed to create ticket.");
      }
    } catch {
      alert("Error saving to database.");
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg flex items-center justify-center gap-2 transition shadow-lg w-full sm:w-auto"
      >
        <span className="text-xl leading-none">+</span> Create Issue
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 text-left" onClick={() => setShowModal(false)}>
          <div className="bg-white p-6 md:p-8 rounded-2xl w-[95%] max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl text-slate-800" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-blue-600">+</span> Create New Issue
            </h2>

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
                <input type="text" placeholder="e.g. Implement login feature" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-slate-700">Description</label>
                <textarea placeholder="Steps to reproduce or acceptance criteria..." value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg h-28 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                
                {issueType === "Bug" && (
                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Severity</label>
                  <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    <option>Critical</option>
                    <option>Major</option>
                    <option>Medium</option>
                    <option>Minor</option>
                  </select>
                </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Project</label>
                  <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    <option value="">Select a project...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Assignee</label>
                  <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    <option value="">Select assignee...</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>{member.full_name || member.name || member.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-slate-700">Due Date</label>
                <input type="date" value={dueDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setDueDate(e.target.value)} className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t mt-8">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                <button onClick={handleCreateTask} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg transition">
                  Create Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
