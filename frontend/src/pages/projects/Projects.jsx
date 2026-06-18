import MainLayout from "../../layouts/MainLayout";
import { useState, useContext } from "react";
import AppContext from "../../context/AppContext";
import { FolderKanban, Clock3, PlayCircle, CheckCircle } from "lucide-react";

export default function Projects() {
  const { projects, setProjects, activities, setActivities, members, tasks } = useContext(AppContext);
  const currentUserId = Number(localStorage.getItem("userId"));
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const totalProjects = projects.length;
  const planningProjects = projects.filter((p) => p.calculated_status === "Planning").length;
  const inProgressProjects = projects.filter((p) => p.calculated_status === "In Progress").length;
  const completedProjects = projects.filter((p) => p.calculated_status === "Completed").length;

  const handleCreateProject = async () => {
    if (!projectName.trim()) { alert("Project Name is required"); return; }
    if (!projectDescription.trim()) { alert("Project Description is required"); return; }
    if (!startDate) { alert("Start Date is required"); return; }
    if (!endDate) { alert("End Date is required"); return; }
    if (new Date(endDate) < new Date(startDate)) { alert("End Date cannot be before Start Date"); return; }

    const token = localStorage.getItem("token");
    
    // Notice how we don't even care about status here anymore because it's calculated on the fly!
    const projectData = {
      name: projectName,
      description: projectDescription,
      start_date: startDate,
      end_date: endDate,
      status: "Planning", 
      member_ids: selectedMembers 
    };

    try {
      if (editingProjectId) {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${editingProjectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(projectData)
        });
        if (response.ok) {
          const updatedProject = await response.json();
          setProjects(projects.map((p) => p.id === editingProjectId ? updatedProject : p));
        }
      } else {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(projectData)
        });
        if (response.ok) {
          const newProject = await response.json();
          setProjects([...projects, newProject]);
          setActivities([`📁 ${newProject.name} project created`, ...activities]);
        }
      }
    } catch {
      alert("Failed to save project to database.");
    }

    setProjectName("");
    setProjectDescription("");
    setStartDate("");
    setEndDate("");
    setSelectedMembers([]);
    setEditingProjectId(null);
    setShowModal(false);
  };

  const handleDeleteProject = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this project?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        setProjects(projects.filter((project) => project.id !== id));
      }
    } catch {
      alert("Failed to connect to backend.");
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
        <button
          onClick={() => {
            setEditingProjectId(null);
            setProjectName("");
            setProjectDescription("");
            setStartDate("");
            setEndDate("");
            setSelectedMembers([]);
            setShowModal(true);
          }}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
        >
          + Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-base font-medium">Total Projects</p>
              <p className="text-3xl font-bold mt-2">{totalProjects}</p>
            </div>
            <FolderKanban size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-base font-medium">Planning</p>
              <p className="text-3xl font-bold mt-2">{planningProjects}</p>
            </div>
            <Clock3 size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-base font-medium">In Progress</p>
              <p className="text-3xl font-bold mt-2">{inProgressProjects}</p>
            </div>
            <PlayCircle size={22} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-base font-medium">Completed</p>
              <p className="text-3xl font-bold mt-2">{completedProjects}</p>
            </div>
            <CheckCircle size={22} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project) => {
          // Backend-calculated dynamic properties!
          const dynamicStatus = project.calculated_status;
          const progress = project.progress;

          const memberArray = project.members || [];

          return (
            <div key={project.id} className="bg-white rounded-xl shadow p-4 md:p-6">
              <h2 className="text-xl font-semibold mb-3">{project.name}</h2>
              <p className="text-gray-600 mb-3">{project.description}</p>

              <span className={`inline-block px-3 py-1 rounded-full text-sm mb-4 ${
                  dynamicStatus === "In Progress" ? "bg-green-100 text-green-700" : 
                  dynamicStatus === "Completed" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                {dynamicStatus}
              </span>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              <p className="text-gray-600">Members: {memberArray.length}</p>
              <p className="text-sm text-gray-500 mt-1 break-words">{memberArray.map(m => m.full_name).join(", ") || "No members assigned"}</p>
              <p className="text-sm text-gray-500 mt-2">Start: {project.start_date}</p>
              <p className="text-sm text-gray-500">End: {project.end_date}</p>

              {project.created_by_id === currentUserId && (
  <div className="flex flex-col sm:flex-row gap-2 mt-4">
    <button
      onClick={() => {
        setEditingProjectId(project.id);
        setProjectName(project.name);
        setProjectDescription(project.description);
        setStartDate(project.start_date || "");
        setEndDate(project.end_date || "");
        setSelectedMembers(memberArray.map((m) => m.id));
        setShowModal(true);
      }}
      className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
    >
      Edit
    </button>

    <button
      onClick={() => handleDeleteProject(project.id)}
      className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
    >
      Delete
    </button>
  </div>
)}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 md:p-6 rounded-xl w-[95%] max-w-[500px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingProjectId ? "Edit Project" : "Create Project"}</h2>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Project Name</label>
                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full border p-3 rounded-lg" />
              </div>

              <div>
                <label className="block mb-2 font-medium">Project Description</label>
                <textarea value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} className="w-full border p-3 rounded-lg" />
              </div>

              <div>
                <label className="block mb-2 font-medium">Assign Team Members</label>
                <div className="space-y-2 border rounded-lg p-3">
                  {members.map((member) => (
                    <label key={member.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, member.id]);
                          } else {
                            setSelectedMembers(selectedMembers.filter((id) => id !== member.id));
                          }
                        }}
                      />
                      {member.full_name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium">Start Date</label>
                <input
  type="date"
  value={startDate}
  min={new Date().toISOString().split("T")[0]}
  onChange={(e) => setStartDate(e.target.value)}
  className="w-full border p-3 rounded-lg"
/>
              </div>

              <div>
                <label className="block mb-2 font-medium">End Date</label>
                <input
  type="date"
  value={endDate}
  min={startDate || new Date().toISOString().split("T")[0]}
  onChange={(e) => setEndDate(e.target.value)}
  className="w-full border p-3 rounded-lg"
/>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button onClick={handleCreateProject} className="bg-slate-900 text-white px-4 py-2 rounded-lg">
                  {editingProjectId ? "Update Project" : "Create Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}