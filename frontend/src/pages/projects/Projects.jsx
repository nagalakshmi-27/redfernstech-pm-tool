import MainLayout from "../../layouts/MainLayout";
import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../../context/AppContext";
import {
  FolderKanban,
  Clock3,
  PlayCircle,
  CheckCircle,
  UploadCloud,
  Search,
  ChevronDown,
  ChevronUp,
  Users,
  Archive,
MoreHorizontal,
Calendar,
} from "lucide-react";
import DeleteProjectModal from "./components/DeleteProjectModal";

export default function Projects() {
  const { projects, setProjects, members, activeWorkspaceId, activeWorkspaceRole } = useContext(AppContext);
  const navigate = useNavigate();
  const currentUserRole = activeWorkspaceRole;
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
const [showAllMembers, setShowAllMembers] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
const [selectedFile, setSelectedFile] = useState(null);
const [importProjectName, setImportProjectName] = useState("");
const [uploading, setUploading] = useState(false);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [projectToDelete, setProjectToDelete] = useState(null);
const [showArchiveDrawer, setShowArchiveDrawer] = useState(false);
const [openMenuId, setOpenMenuId] = useState(null);
const [archiveSearch, setArchiveSearch] = useState("");
const menuRef = useRef(null);
const startDateRef = useRef(null);
const endDateRef = useRef(null);
  const totalProjects = projects.length;
  const planningProjects = projects.filter((p) => p.calculated_status === "Planning").length;
  const inProgressProjects = projects.filter((p) => p.calculated_status === "In Progress").length;
  const completedProjects = projects.filter((p) => p.calculated_status === "Completed").length;
  const [showDeleteArchivedModal, setShowDeleteArchivedModal] = useState(false);
const [archivedProjectToDelete, setArchivedProjectToDelete] = useState(null);
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
  member_ids: selectedMembers,
  workspace_id: parseInt(activeWorkspaceId),
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
          setProjects([newProject, ...projects]);
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
setMemberSearch("");
setShowAllMembers(false);
setShowModal(false);
  };

  const handleDeleteProject = async () => {
  if (!projectToDelete) return;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/projects/${projectToDelete.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      setProjects(projects.filter((p) => p.id !== projectToDelete.id));
      setShowDeleteModal(false);
      setProjectToDelete(null);
    }
  } catch {
    alert("Failed to connect to backend.");
  }
};

  const handleImportProject = async () => {
  if (!selectedFile) {
    alert("Please select an Excel or CSV file.");
    return;
  }

  try {
    setUploading(true);

    const formData = new FormData();

    formData.append("file", selectedFile);

    if (importProjectName.trim()) {
      formData.append("project_name", importProjectName);
    }
    
    if (activeWorkspaceId) {
      formData.append("workspace_id", activeWorkspaceId);
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/projects/import-excel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMsg = errData.detail || "Import failed";
      alert(errorMsg);
      throw new Error(errorMsg);
    }

    const data = await response.json();

    // Close modal
    setShowImportModal(false);
    setSelectedFile(null);
    setImportProjectName("");

    // Redirect based on how many projects were created
    if (Array.isArray(data) && data.length === 1) {
      window.location.href = `/projects/${data[0].id}`;
    } else {
      window.location.href = `/projects`;
    }

  } catch (err) {
    console.error(err);
    alert("Failed to import project.");
  } finally {
    setUploading(false);
  }
};

const filteredMembers = members.filter((member) =>
  (member.full_name || "")
    .toLowerCase()
    .includes(memberSearch.toLowerCase())
);

const displayedMembers = showAllMembers
  ? filteredMembers
  : filteredMembers.slice(0, 5);

const handleRestoreProject = async (projectId) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ is_archived: false }),
    });
    if (res.ok) {
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === projectId
            ? { ...project, is_archived: false, archived: false }
            : project
        )
      );
      setOpenMenuId(null);
    }
  } catch (err) {
    console.error("Failed to restore project", err);
  }
};
const handleDeleteArchivedProject = async () => {
  if (!archivedProjectToDelete) return;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_URL}/projects/${archivedProjectToDelete.id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (res.ok) {
      setProjects((prevProjects) =>
        prevProjects.filter((project) => project.id !== archivedProjectToDelete.id)
      );
      setShowDeleteArchivedModal(false);
      setArchivedProjectToDelete(null);
    }
  } catch (err) {
    console.error("Failed to delete archived project", err);
  }
};

const filteredArchivedProjects = projects.filter(
  (project) =>
    project.is_archived &&
    project.name.toLowerCase().includes(archiveSearch.toLowerCase())
);
useEffect(() => {
  function handleClickOutside(event) {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setOpenMenuId(null);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Projects</h1>
        {currentUserRole === "Admin" && (
  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
    <button
    onClick={() => setShowArchiveDrawer(true)}
    className="border border-white/10 rounded-lg p-2 text-slate-300 hover:bg-white/10 transition"
  >
    <Archive size={20} />
  </button>
    <button
      onClick={() => setShowImportModal(true)}
      className="border border-cyan-500 text-cyan-400 px-4 py-2 rounded-lg font-medium hover:bg-cyan-500/10 transition-all"
    >
      Import Excel
    </button>

    <button
      onClick={() => {
        setEditingProjectId(null);
        setProjectName("");
        setProjectDescription("");
        setStartDate("");
        setEndDate("");
        setSelectedMembers([]);
setMemberSearch("");
setShowAllMembers(false);
setShowModal(true);
      }}
      className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all"
    >
      + Create Project
    </button>

  </div>
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
  {projects
    .filter((project) => !project.is_archived)
    .map((project) => {
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

              <div className="flex items-center gap-2 mt-2 text-slate-300">
  <Users size={16} className="text-cyan-400" />
  <span>{memberArray.length} Members</span>
</div>

<p className="text-sm text-slate-400 mt-2">
  Start: {project.start_date}
</p>
<p className="text-sm text-slate-400">
  End: {project.end_date}
</p>


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
  <label className="flex items-center gap-2 mb-2 font-medium text-slate-300">
    <Users size={18} className="text-cyan-400" />
    Assign Team Members
  </label>

  <div className="border border-white/10 bg-black/20 rounded-lg p-3">

    <div className="relative mb-3">
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        type="text"
        placeholder="Search team members..."
        value={memberSearch}
        onChange={(e) => {
          setMemberSearch(e.target.value);
          setShowAllMembers(false);
        }}
        className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
      />
    </div>

    <div className="space-y-2 text-slate-300 max-h-56 overflow-y-auto pr-1">

      {displayedMembers.map((member) => (
        <label
          key={member.id}
          className="flex items-center gap-2"
        >
          <input
            type="checkbox"
            checked={selectedMembers.includes(member.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedMembers([...selectedMembers, member.id]);
              } else {
                setSelectedMembers(
                  selectedMembers.filter((id) => id !== member.id)
                );
              }
            }}
          />

          {member.full_name}
        </label>
      ))}

      {filteredMembers.length > 5 && (
        <button
          type="button"
          onClick={() => setShowAllMembers(!showAllMembers)}
          className="flex items-center gap-2 mt-3 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition"
        >
          {showAllMembers ? (
            <>
              <ChevronUp size={16} />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Show More
            </>
          )}
        </button>
      )}

    </div>

  </div>
</div>

              <div>
                <label className="block mb-2 font-medium text-slate-300">Start Date</label>
                <div className="relative">
  <input
    ref={startDateRef}
    type="date"
    value={startDate}
    min={new Date().toISOString().split("T")[0]}
    max="9999-12-31"
    onChange={(e) => setStartDate(e.target.value)}
    className="w-full bg-black/20 border border-white/10 text-white p-3 pr-12 rounded-lg focus:outline-none focus:border-cyan-500 appearance-none [color-scheme:dark]"
  />

  <Calendar
  size={18}
  onClick={() => startDateRef.current?.showPicker()}
  className="absolute right-4 top-1/2 -translate-y-1/2 text-white cursor-pointer z-10"
/>
</div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-slate-300">End Date</label>
                <div className="relative">
  <input
  ref={endDateRef}
    type="date"
    value={endDate}
    min={startDate || new Date().toISOString().split("T")[0]}
    max="9999-12-31"
    onChange={(e) => setEndDate(e.target.value)}
    className="w-full bg-black/20 border border-white/10 text-white p-3 pr-12 rounded-lg focus:outline-none focus:border-cyan-500 appearance-none"
  />

  <Calendar
  size={18}
  onClick={() => endDateRef.current?.showPicker()}
  className="absolute right-4 top-1/2 -translate-y-1/2 text-white cursor-pointer z-10"
/>
</div>
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

      {showImportModal && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="bg-[#141a2d] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">

      <h2 className="text-2xl font-bold text-white mb-2">
        Import Project
      </h2>

      <p className="text-slate-400 mb-6">
        Upload an Excel (.xlsx) or CSV (.csv) file to create a project.
      </p>

      {/* Project Name */}
      <div className="mb-4">
        <label className="block text-slate-300 mb-2">
          Project Name (Optional)
        </label>

        <input
          type="text"
          value={importProjectName}
          onChange={(e) => setImportProjectName(e.target.value)}
          placeholder="Enter project name"
          className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
        />
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-slate-300 mb-2">
          Select Excel File
        </label>

        <label className="block">
  <input
    type="file"
    accept=".xlsx,.csv"
    onChange={(e) => setSelectedFile(e.target.files[0])}
    className="hidden"
  />

  <div className="cursor-pointer rounded-xl border-2 border-dashed border-cyan-500/40 bg-black/20 hover:bg-black/30 hover:border-cyan-400 hover:scale-[1.01] transition-all duration-200 p-8 text-center">

    <div className="flex justify-center mb-3">
  <UploadCloud size={48} className="text-cyan-400" />
</div>

    <p className="text-white font-medium">
      Click to choose an Excel or CSV file
    </p>

    <p className="text-slate-400 text-sm mt-2">
      Supported formats: .xlsx, .csv
    </p>

    {selectedFile && (
      <div className="mt-5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 text-cyan-300 font-medium">
        {selectedFile.name}
      </div>
    )}

  </div>
</label>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3">

        <button
          onClick={() => {
            setShowImportModal(false);
            setSelectedFile(null);
            setImportProjectName("");
          }}
          className="px-5 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5"
        >
          Cancel
        </button>

        <button
  onClick={handleImportProject}
  disabled={uploading || !selectedFile}
  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-5 py-2 rounded-lg disabled:opacity-50"
>
  {uploading ? "Importing..." : "Import"}
</button>

      </div>

    </div>
  </div>
)}
{showArchiveDrawer && (
  <>
    {/* Backdrop */}
    <div
      className="fixed inset-0 bg-black/50 z-40"
      onClick={() => setShowArchiveDrawer(false)}
    />

    {/* Drawer */}
    <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] md:w-[450px] bg-[#141B2D] border-l border-white/10 shadow-2xl z-50 flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/10">
        <h2 className="text-xl font-semibold text-white">
          Archived Projects
        </h2>

        <button
          onClick={() => setShowArchiveDrawer(false)}
          className="text-slate-400 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>

      {/* Search */}
<div className="px-5 py-4 border-b border-white/10">
  <div className="relative">
    <Search
      size={18}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
    />

    <input
      type="text"
      placeholder="Search archived projects..."
      value={archiveSearch}
      onChange={(e) => setArchiveSearch(e.target.value)}
      className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
    />
  </div>
</div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">

        {projects.filter(project => project.is_archived).length === 0 ? (

          <div className="flex h-full flex-col items-center justify-center text-center">

            <Archive size={50} className="text-slate-500 mb-4" />

            <h3 className="text-lg font-medium text-white">
              No Archived Projects
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Archived projects will appear here.
            </p>

          </div>

        ) : (

          filteredArchivedProjects.map(project => (

              <div
  key={project.id}
  className="relative mb-3 rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
>
  <div className="flex items-start justify-between gap-3">

    <div className="min-w-0 flex-1">
      <h3 className="text-white font-semibold text-lg break-words">
        {project.name}
      </h3>

      <p className="text-sm text-slate-400 mt-1 break-words">
        {project.description}
      </p>
    </div>

    <button
      onClick={(e) => {
        e.stopPropagation();
        setOpenMenuId(
          openMenuId === project.id ? null : project.id
        );
      }}
      className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition"
    >
      <MoreHorizontal size={20} className="text-slate-300" />
    </button>
    {openMenuId === project.id && (
  <div
    ref={menuRef}
    className="absolute right-5 top-14 w-52 rounded-xl border border-white/10 bg-[#1E2639] shadow-2xl overflow-hidden z-50"
  >
    <button
      onClick={() => handleRestoreProject(project.id)}
      className="w-full px-4 py-3 text-left text-white hover:bg-cyan-500/10 transition"
    >
      Restore Project
    </button>

    <div className="border-t border-white/10" />

    <button
  onClick={() => {
    setArchivedProjectToDelete(project);
    setShowDeleteArchivedModal(true);
    setOpenMenuId(null);
  }}
  className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition"
>
  Delete Forever
</button>

  </div>
)}

  </div>
</div>

            ))

        )}

      </div>

    </div>
  </>
)}
<DeleteProjectModal
  open={showDeleteArchivedModal}
  onClose={() => {
    setShowDeleteArchivedModal(false);
    setArchivedProjectToDelete(null);
  }}
  onDelete={handleDeleteArchivedProject}
  projectName={archivedProjectToDelete?.name}
  title="Delete Project Permanently"
  description="Are you sure you want to permanently delete"
  confirmButtonText="Delete Forever"
/>

<DeleteProjectModal
  open={showDeleteModal}
  onClose={() => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  }}
  onDelete={handleDeleteProject}
  projectName={projectToDelete?.name}
/>
    </MainLayout>
  );
}