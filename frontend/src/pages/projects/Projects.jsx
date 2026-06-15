import MainLayout from "../../layouts/MainLayout";
import { useState, useContext } from "react";
import AppContext from "../../context/AppContext";
export default function Projects() {
  const {
  projects,
  setProjects,
  activities,
  setActivities,
} = useContext(AppContext);

  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectStatus, setProjectStatus] = useState("Planning");
  const [projectDescription, setProjectDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const totalProjects = projects.length;
  const [editingProjectId, setEditingProjectId] = useState(null);

const planningProjects = projects.filter(
  (project) => project.status === "Planning"
).length;

const inProgressProjects = projects.filter(
  (project) => project.status === "In Progress"
).length;

const completedProjects = projects.filter(
  (project) => project.status === "Completed"
).length;

  const handleCreateProject = () => {
  if (!projectName.trim()) {
    alert("Project Name is required");
    return;
  }

  if (!projectDescription.trim()) {
    alert("Project Description is required");
    return;
  }

  if (!startDate) {
    alert("Start Date is required");
    return;
  }

  if (!endDate) {
    alert("End Date is required");
    return;
  }

  if (new Date(endDate) < new Date(startDate)) {
    alert("End Date cannot be before Start Date");
    return;
  }

  if (editingProjectId) {
    setProjects(
      projects.map((project) =>
        project.id === editingProjectId
          ? {
              ...project,
              name: projectName,
              description: projectDescription,
              startDate,
              endDate,
              status: projectStatus,
            }
          : project
      )
    );
  } else {
  const newProject = {
    id: Date.now(),
    name: projectName,
    description: projectDescription,
    startDate,
    endDate,
    status: projectStatus,
    progress: 0,
    members: 1,
  };

  setProjects([...projects, newProject]);

  setActivities([
    `📁 ${newProject.name} project created`,
    ...activities,
  ]);
}

setProjectName("");
setProjectDescription("");
setStartDate("");
setEndDate("");
setProjectStatus("Planning");
setEditingProjectId(null);
setShowModal(false);
};

const handleDeleteProject = (id) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this project?"
  );

  if (!confirmDelete) return;

  setProjects(
    projects.filter((project) => project.id !== id)
  );
};

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>

        <button
  onClick={() => {
  setEditingProjectId(null);
  setProjectName("");
  setProjectDescription("");
  setStartDate("");
  setEndDate("");
  setProjectStatus("Planning");
  setShowModal(true);
}}
  className="bg-slate-900 text-white px-4 py-2 rounded-lg"
>
  + Create Project
</button>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">

  <div className="bg-white rounded-xl shadow p-4">
    <p className="text-gray-500 text-sm">
      Total Projects
    </p>
    <h2 className="text-2xl font-bold">
      {totalProjects}
    </h2>
  </div>

  <div className="bg-white rounded-xl shadow p-4">
    <p className="text-gray-500 text-sm">
      Planning
    </p>
    <h2 className="text-2xl font-bold text-yellow-600">
      {planningProjects}
    </h2>
  </div>

  <div className="bg-white rounded-xl shadow p-4">
    <p className="text-gray-500 text-sm">
      In Progress
    </p>
    <h2 className="text-2xl font-bold text-green-600">
      {inProgressProjects}
    </h2>
  </div>

  <div className="bg-white rounded-xl shadow p-4">
    <p className="text-gray-500 text-sm">
      Completed
    </p>
    <h2 className="text-2xl font-bold text-blue-600">
      {completedProjects}
    </h2>
  </div>

</div>

      <div className="grid grid-cols-2 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-xl shadow p-6"
          >
            <h2 className="text-xl font-semibold mb-3">
  {project.name}
</h2>
<p className="text-gray-600 mb-3">
  {project.description}
</p>

<span
  className={`inline-block px-3 py-1 rounded-full text-sm mb-4 ${
  project.status === "In Progress"
    ? "bg-green-100 text-green-700"
    : project.status === "Completed"
    ? "bg-blue-100 text-blue-700"
    : "bg-yellow-100 text-yellow-700"
}`}
>
  {project.status}
</span>

<div className="mb-4">
  <div className="flex justify-between text-sm mb-1">
    <span>Progress</span>
    <span>{project.progress}%</span>
  </div>

  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className="bg-blue-600 h-2 rounded-full"
      style={{ width: `${project.progress}%` }}
    ></div>
  </div>
</div>

<p className="text-gray-600">
  Members: {project.members}
</p>
<p className="text-sm text-gray-500 mt-2">
  Start: {project.startDate}
</p>

<p className="text-sm text-gray-500">
  End: {project.endDate}
</p>
<div className="flex gap-2 mt-4">
  <button
    onClick={() => {
      setEditingProjectId(project.id);
      setProjectName(project.name);
      setProjectDescription(project.description);
      setStartDate(project.startDate);
      setEndDate(project.endDate);
      setProjectStatus(project.status);
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
          </div>
        ))}
      </div>
      {showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-xl w-[500px]">
      <h2 className="text-2xl font-bold mb-4">
  {editingProjectId ? "Edit Project" : "Create Project"}
</h2>

      <div className="space-y-4">
        <div>
  <label className="block mb-2 font-medium">
    Project Name
  </label>
  <input
  type="text"
  placeholder="Enter Project Name"
  value={projectName}
  onChange={(e) => setProjectName(e.target.value)}
  className="w-full border p-3 rounded-lg"
/>
</div>

<div>
  <label className="block mb-2 font-medium">
    Project Description
  </label>
  <textarea
    placeholder="Enter Project Description"
    value={projectDescription}
    onChange={(e) => setProjectDescription(e.target.value)}
    className="w-full border p-3 rounded-lg"
  />
</div>

<div>
  <label className="block mb-2 font-medium">
    Start Date
  </label>
  <input
  type="date"
  value={startDate}
  onChange={(e) => setStartDate(e.target.value)}
  className="w-full border p-3 rounded-lg"
/>
</div>

<div>
  <label className="block mb-2 font-medium">
    End Date
  </label>
  <input
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    className="w-full border p-3 rounded-lg"
  />
</div>

<div>
  <label className="block mb-2 font-medium">
    Project Status
  </label>
  <select
  value={projectStatus}
  onChange={(e) => setProjectStatus(e.target.value)}
  className="w-full border p-3 rounded-lg"
>
    <option>Planning</option>
    <option>In Progress</option>
    <option>Completed</option>
  </select>
</div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
  setShowModal(false);
  setEditingProjectId(null);
}}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
  onClick={handleCreateProject}
  className="bg-slate-900 text-white px-4 py-2 rounded-lg"
>
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