import MainLayout from "../../layouts/MainLayout";
import { useState, useContext } from "react";
import AppContext from "../../context/AppContext";
import {
  FolderKanban,
  Clock3,
  PlayCircle,
  CheckCircle,
} from "lucide-react";
export default function Projects() {
  const {
  projects,
  setProjects,
  activities,
  setActivities,
  members,
  tasks,
} = useContext(AppContext);

  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const totalProjects = projects.length;
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
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
            members: selectedMembers,
          }
        : project
    )
  );
}else {


const newProject = {
  id: Date.now(),
  name: projectName,
  description: projectDescription,
  startDate,
  endDate,
  status: "Planning",
  members: selectedMembers,
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
setSelectedMembers([]);

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
  setShowModal(true);
}}
  className="bg-slate-900 text-white px-4 py-2 rounded-lg"
>
  + Create Project
</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-base font-medium">
          Total Projects
        </p>
        <p className="text-3xl font-bold mt-2">
          {totalProjects}
        </p>
      </div>

      <FolderKanban size={22} />
    </div>
  </div>

  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-base font-medium">
          Planning
        </p>
        <p className="text-3xl font-bold mt-2">
          {planningProjects}
        </p>
      </div>

      <Clock3 size={22} />
    </div>
  </div>

  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-base font-medium">
          In Progress
        </p>
        <p className="text-3xl font-bold mt-2">
          {inProgressProjects}
        </p>
      </div>

      <PlayCircle size={22} />
    </div>
  </div>

  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-base font-medium">
          Completed
        </p>
        <p className="text-3xl font-bold mt-2">
          {completedProjects}
        </p>
      </div>

      <CheckCircle size={22} />
    </div>
  </div>

</div>

      <div className="grid grid-cols-2 gap-6">
  {projects.map((project) => {

    const projectTasks = tasks.filter(
      (task) => task.project === project.name
    );

    const completedTasks = projectTasks.filter(
      (task) => task.status === "Completed"
    );

    const progress =
      projectTasks.length > 0
        ? Math.round(
            (completedTasks.length /
              projectTasks.length) * 100
          )
        : 0;

    return (
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
    <span>{progress}%</span>
  </div>

  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className="bg-blue-600 h-2 rounded-full"
      style={{ width: `${progress}%` }}
    ></div>
  </div>
</div>

<p className="text-gray-600">
  Members: {project.members?.length || 0}
</p>
<p className="text-sm text-gray-500 mt-1">
  {project.members?.join(", ")}
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
      setSelectedMembers(project.members || []);
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
    );
  })}
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
    Assign Team Members
  </label>

  <div className="space-y-2 border rounded-lg p-3">
  {members.map((member) => (
    <label
      key={member.id}
      className="flex items-center gap-2"
    >
      <input
        type="checkbox"
        checked={selectedMembers.includes(member.name)}
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedMembers([
              ...selectedMembers,
              member.name,
            ]);
          } else {
            setSelectedMembers(
              selectedMembers.filter(
                (name) => name !== member.name
              )
            );
          }
        }}
      />

      {member.name}
    </label>
  ))}
</div>
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