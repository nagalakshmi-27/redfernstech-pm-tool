import MainLayout from "../../layouts/MainLayout";
import { useState, useContext } from "react";
import { ListTodo, Clock3, PlayCircle, CheckCircle } from "lucide-react";
import AppContext from "../../context/AppContext";

export default function Tasks() {
  const { tasks, setTasks, activities, setActivities, projects, members } = useContext(AppContext);
  const currentUserId = members.find(m => m.email === localStorage.getItem("userEmail"))?.id;
  
  const [showModal, setShowModal] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("To Do");
  const [assigneeId, setAssigneeId] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);

  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((task) => task.status === "To Do").length;
  const inProgressTasks = tasks.filter((task) => task.status === "In Progress").length;
  const completedTasks = tasks.filter((task) => task.status === "Completed").length;



  const handleCreateTask = async () => {
    if (!taskName.trim()) { alert("Task Name is required"); return; }
    if (!taskDescription.trim()) { alert("Task Description is required"); return; }
    if (!assigneeId) { alert("Assignee is required"); return; }
    if (!dueDate) { alert("Due Date is required"); return; }
    if (!selectedProject) { alert("Please select a project"); return; }

    const token = localStorage.getItem("token");
    
    // We perfectly match the Python schema here!
    const taskData = {
      name: taskName,
      description: taskDescription,
      priority: priority,
      status: status,
      due_date: dueDate,
      assignee_id: parseInt(assigneeId), 
      project_id: parseInt(selectedProject)
    };

    try {
      if (editingTaskId) {
        const response = await fetch(`http://127.0.0.1:8000/tasks/${editingTaskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(taskData)
        });
        if (response.ok) {
          const updatedTask = await response.json();
          setTasks(tasks.map((t) => t.id === editingTaskId ? updatedTask : t));
        }
      } else {
        const response = await fetch("http://127.0.0.1:8000/tasks/", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(taskData)
        });
        if (response.ok) {
          const newTask = await response.json();
          setTasks([...tasks, newTask]);
          setActivities([`📝 ${newTask.name} task created`, ...activities]);
        }
      }
    } catch (err) {
      alert("Failed to save task to database.");
    }

    setTaskName("");
    setTaskDescription("");
    setPriority("Medium");
    setStatus("To Do");
    setAssigneeId("");
    setSelectedProject("");
    setDueDate("");
    setEditingTaskId(null);
    setShowModal(false);
  };

  const handleDeleteTask = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this task?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/tasks/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        setTasks(tasks.filter((task) => task.id !== id));
      }
    } catch (err) {
      alert("Failed to connect to backend.");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://127.0.0.1:8000/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(tasks.map((t) => t.id === taskId ? updatedTask : t));
        setActivities([`🔄 Task status updated to ${newStatus}`, ...activities]);
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      alert("Error updating status");
    }
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <button
          onClick={() => {
            setEditingTaskId(null);
            setTaskName("");
            setTaskDescription("");
            setPriority("Medium");
            setStatus("To Do");
            setAssigneeId("");
            setSelectedProject("");
            setDueDate("");
            setShowModal(true);
          }}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg"
        >
          + Create Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-base font-medium">Total Tasks</p>
              <p className="text-3xl font-bold mt-2">{totalTasks}</p>
            </div>
            <ListTodo size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-base font-medium">To Do</p>
              <p className="text-3xl font-bold mt-2">{todoTasks}</p>
            </div>
            <Clock3 size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-base font-medium">In Progress</p>
              <p className="text-3xl font-bold mt-2">{inProgressTasks}</p>
            </div>
            <PlayCircle size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-base font-medium">Completed</p>
              <p className="text-3xl font-bold mt-2">{completedTasks}</p>
            </div>
            <CheckCircle size={22} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-3">{task.name}</h2>
            <p className="text-gray-600 mb-3">{task.description}</p>

            <div className="flex gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm ${
                task.priority === "High" ? "bg-red-100 text-red-700" :
                task.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                "bg-green-100 text-green-700"
              }`}>
                {task.priority}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                task.status === "Completed" ? "bg-blue-100 text-blue-700" :
                task.status === "In Progress" ? "bg-green-100 text-green-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                {task.status}
              </span>
            </div>
            
            <p className="text-sm text-gray-500">
              Project: {projects.find(p => p.id === task.project_id)?.name || "Unknown"}
            </p>
            <p>Assignee: {members.find(m => m.id === task.assignee_id)?.full_name || "Unknown"}</p>
            <p className="text-sm text-gray-500 mt-1">
              Due Date: {task.due_date}
            </p>
            {projects.find((p) => p.id === task.project_id)?.created_by_id === currentUserId ? (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setEditingTaskId(task.id);
                      setTaskName(task.name);
                      setTaskDescription(task.description);
                      setPriority(task.priority);
                      setStatus(task.status);
                      setAssigneeId(task.assignee_id || "");
                      setSelectedProject(task.project_id);
                      setDueDate(task.due_date || "");
                      setShowModal(true);
                    }}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <label className="text-sm font-medium mr-2">Update Status:</label>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="border p-1 rounded-lg text-sm"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              )}
            </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[500px]">
            <h2 className="text-2xl font-bold mb-4">{editingTaskId ? "Edit Task" : "Create Task"}</h2>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Task Name</label>
                <input type="text" placeholder="Enter Task Name" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="w-full border p-3 rounded-lg" />
              </div>

              <div>
                <label className="block mb-2 font-medium">Task Description</label>
                <textarea placeholder="Enter Task Description" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="w-full border p-3 rounded-lg" />
              </div>

              <div>
                <label className="block mb-2 font-medium">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border p-3 rounded-lg">
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border p-3 rounded-lg">
                  <option>To Do</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Project</label>
                <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="w-full border p-3 rounded-lg">
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Assignee</label>
                <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full border p-3 rounded-lg">
                  <option value="">Select Team Member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border p-3 rounded-lg" />
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowModal(false); setEditingTaskId(null); }} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button onClick={handleCreateTask} className="bg-slate-900 text-white px-4 py-2 rounded-lg">
                  {editingTaskId ? "Update Task" : "Create Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}