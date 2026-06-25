import MainLayout from "../../layouts/MainLayout";
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../../context/AppContext";
import { FolderKanban, Clock3, PlayCircle, CheckCircle } from "lucide-react";

export default function Projects() {
  const { projects, setProjects, activities, setActivities, members, tasks } = useContext(AppContext);
  const navigate = useNavigate();
  const currentUserId = Number(localStorage.getItem("userId"));
  const currentUserRole = localStorage.getItem("userRole");
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
        <h1 className="text-2xl md:text-3xl font-bold text-white">Projects</h1>
        {currentUserRole !== "Client" && (
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
          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] w-full sm:w-auto transition-all"
        >
          + Create Project
        </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 border-l-4 border-l-cyan-500">
          <div className="flex justify-between items-center text-slate-200">
            <div>
              <p className="text-slate-400 text-base font-medium">Total Projects</p>
              <p className="text-3xl font-bold mt-2 text-white">{totalProjects}</p>
            </div>
            <FolderKanban size={22} className="text-cyan-400" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 border-l-4 border-l-yellow-400">
          <div className="flex justify-between items-center text-slate-200">
            <div>
              <p className="text-slate-400 text-base font-medium">Planning</p>
              <p className="text-3xl font-bold mt-2 text-white">{planningProjects}</p>
            </div>
            <Clock3 size={22} className="text-yellow-400" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 border-l-4 border-l-green-400">
          <div className="flex justify-between items-center text-slate-200">
            <div>
              <p className="text-slate-400 text-base font-medium">In Progress</p>
              <p className="text-3xl font-bold mt-2 text-white">{inProgressProjects}</p>
            </div>
            <PlayCircle size={22} className="text-green-400" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 border-l-4 border-l-purple-400">
          <div className="flex justify-between items-center text-slate-200">
            <div>
              <p className="text-slate-400 text-base font-medium">Completed</p>
              <p className="text-3xl font-bold mt-2 text-white">{completedProjects}</p>
            </div>
            <CheckCircle size={22} className="text-purple-400" />
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
            <div 
              key={project.id} 
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] p-4 md:p-6 cursor-pointer hover:bg-white/10 hover:border-cyan-400/50 transition-all group relative"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <h2 className="text-xl font-semibold mb-3 text-white group-hover:text-cyan-400 transition">{project.name}</h2>
              <p className="text-slate-300 mb-3">{project.description}</p>

              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 shadow-[0_0_10px_rgba(0,0,0,0.3)] ${
                  dynamicStatus === "In Progress" ? "bg-green-500/20 text-green-300 border border-green-500/30" : 
                  dynamicStatus === "Completed" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                }`}>
                {dynamicStatus}
              </span>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1 text-slate-300">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-2 border border-white/5">
                  <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              <p className="text-slate-300">Members: {memberArray.length}</p>
              <p className="text-sm text-slate-400 mt-1 break-words">{memberArray.map(m => m.full_name).join(", ") || "No members assigned"}</p>
              <p className="text-sm text-slate-400 mt-2">Start: {project.start_date}</p>
              <p className="text-sm text-slate-400">End: {project.end_date}</p>

              {(currentUserRole === "Admin" || project.created_by_id === currentUserId) && (
  <div className="flex flex-col sm:flex-row gap-2 mt-4 relative z-10">
    <button
      onClick={(e) => {
        e.stopPropagation();
        setEditingProjectId(project.id);
        setProjectName(project.name);
        setProjectDescription(project.description);
        setStartDate(project.start_date || "");
        setEndDate(project.end_date || "");
        setSelectedMembers(memberArray.map((m) => m.id));
        setShowModal(true);
      }}
      className="bg-white/10 text-white px-3 py-2 rounded-lg text-sm border border-white/20 hover:bg-white/20 transition"
    >
      Edit
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        handleDeleteProject(project.id);
      }}
      className="bg-red-500/20 text-red-200 px-3 py-2 rounded-lg text-sm border border-red-500/30 hover:bg-red-500/40 transition"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 p-4 md:p-6 rounded-2xl w-[95%] max-w-[500px] max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <h2 className="text-2xl font-bold mb-4 text-white">{editingProjectId ? "Edit Project" : "Create Project"}</h2>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-slate-300">Project Name</label>
                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
              </div>

              <div>
                <label className="block mb-2 font-medium text-slate-300">Project Description</label>
                <textarea value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
              </div>

              <div>
                <label className="block mb-2 font-medium text-slate-300">Assign Team Members</label>
                <div className="space-y-2 border border-white/10 bg-black/20 rounded-lg p-3 text-slate-300">
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
                <label className="block mb-2 font-medium text-slate-300">Start Date</label>
                <input
  type="date"
  value={startDate}
  min={new Date().toISOString().split("T")[0]}
  onChange={(e) => setStartDate(e.target.value)}
  className="w-full bg-black/20 border border-white/10 text-slate-200 p-3 rounded-lg focus:outline-none focus:border-cyan-500"
/>
              </div>

              <div>
                <label className="block mb-2 font-medium text-slate-300">End Date</label>
                <input
  type="date"
  value={endDate}
  min={startDate || new Date().toISOString().split("T")[0]}
  onChange={(e) => setEndDate(e.target.value)}
  className="w-full bg-black/20 border border-white/10 text-slate-200 p-3 rounded-lg focus:outline-none focus:border-cyan-500"
/>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-white/20 text-slate-300 rounded-lg hover:bg-white/5 transition">Cancel</button>
                <button onClick={handleCreateProject} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all">
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