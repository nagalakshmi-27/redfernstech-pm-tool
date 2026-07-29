import { useContext, useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import AppContext from "../../context/AppContext";
import CreateIssueModal from "../../components/CreateIssueModal";
import {
  CheckSquare,
  Clock3,
  PlayCircle,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  Settings2,
  Users,
  Pencil,
  LayoutPanelTop,
  Eye,
  Archive,
  Trash2,
} from "lucide-react";
import ProjectTeamModal from "./components/ProjectTeamModal";
import ProjectChat from "./ProjectChat";
import ProjectWiki from "./ProjectWiki";
import ProjectComments from "./ProjectComments";
import TaskComments from "../../components/TaskComments";
import TaskAttachments from "../../components/TaskAttachments";
import CustomizeBoardModal from "./components/CustomizeBoardModal";
import KanbanBoard from "./components/KanbanBoard";
import ScrumBoard from "./components/ScrumBoard";
import TaskListBoard from "./components/TaskListBoard";
import { useMemo } from "react";
import { iconLibrary } from "../../utils/iconLibrary";
import EditProjectModal from "./components/EditProjectModal";
import DeleteProjectModal from "./components/DeleteProjectModal";
import TaskVisibilityModal from "./components/TaskVisibilityModal";

export default function ProjectWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
  projects,
  setProjects,
  tasks,
  setTasks,
  members,
  activeWorkspaceId,
  activeWorkspaceRole,
} = useContext(AppContext);
  const DEFAULT_COLUMNS = useMemo(
  () => [
    { name: "To Do", icon: "Clock3", color: "#facc15" },
    { name: "In Progress", icon: "PlayCircle", color: "#22d3ee" },
    { name: "Completed", icon: "CheckCircle", color: "#4ade80" }
  ],
  []
);
useEffect(() => {
  function handleClickOutside(event) {
    if (
      settingsMenuRef.current &&
      !settingsMenuRef.current.contains(event.target)
    ) {
      setShowProjectSettings(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  document.addEventListener("touchstart", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
    document.removeEventListener("touchstart", handleClickOutside);
  };
}, []);
  const currentUserRole = activeWorkspaceRole;
  const [highlightProject, setHighlightProject] = useState(false);

  const project = useMemo(() => projects.find(p => p.id === parseInt(id)), [projects, id]);
  const projectTasks = useMemo(() => tasks.filter(t => t.project_id === parseInt(id)), [tasks, id]);

  // Edit Task State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const settingsMenuRef = useRef(null);
  const closeEditModal = () => {
    setShowEditModal(false);
    if (editingTaskId) {
      setHighlightedTaskId(editingTaskId);
      setTimeout(() => {
        const el = document.getElementById(`task-card-${editingTaskId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }, 100);
      setTimeout(() => setHighlightedTaskId(null), 4000);
    }
  };
  const handleArchiveProject = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ is_archived: true }),
      });
      if (res.ok) {
        setProjects((prevProjects) =>
          prevProjects.map((p) =>
            p.id === project.id
              ? { ...p, is_archived: true, archived: true }
              : p
          )
        );
        setShowArchiveProjectModal(false);
        navigate("/projects");
      }
    } catch (err) {
      console.error("Failed to archive project", err);
    }
  };

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
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [workLogs, setWorkLogs] = useState([]);
  const [newWorkLogHours, setNewWorkLogHours] = useState("");
  const [newWorkLogDesc, setNewWorkLogDesc] = useState("");
  const [activeTaskTab, setActiveTaskTab] = useState("subtasks");
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [showTaskVisibilityModal, setShowTaskVisibilityModal] = useState(false);
  const [showArchiveProjectModal, setShowArchiveProjectModal] = useState(false);
  const [taskVisibility, setTaskVisibility] = useState("everyone");
  const [taskViewers, setTaskViewers] = useState([]);
  
  useEffect(() => {
    if (project) {
      setTaskVisibility(project.task_visibility || "everyone");
      setTaskViewers(project.task_viewers || []);
    }
  }, [project]);
  const handleOpenTask = (task) => {
    setEditingTaskId(task.id);
    setTaskName(task.name);
    setTaskDescription(task.description || "");
    setPriority(task.priority);
    setStatus(task.status);
    setIssueType(task.issue_type || "Task");
    setSeverity(task.severity || "Medium");
    setAssigneeId(task.assignee_id || "");
    setSelectedProject(task.project_id);
    setDueDate(task.due_date || "");
    setSourceLink(task.source_link || "");
    setSubtasks(task.subtasks || []);
    setWorkLogs(task.work_logs || []);
    setActiveTaskTab("subtasks");
    setShowEditModal(true);
  };
  const [projectName, setProjectName] = useState(project?.name || "");
const [projectDescription, setProjectDescription] = useState(project?.description || "");
const [startDate, setStartDate] = useState(project?.start_date || "");
const [endDate, setEndDate] = useState(project?.end_date || "");
const [boardType, setBoardType] = useState(project?.board_type || "kanban");

const [selectedMembers, setSelectedMembers] = useState(
  (project?.members || []).map((m) => m.id)
);

useEffect(() => {
  if (project) {
    setProjectName(project.name);
    setProjectDescription(project.description || "");
    setStartDate(project.start_date || "");
    setEndDate(project.end_date || "");
    setBoardType(project.board_type || "kanban");
    setSelectedMembers((project.members || []).map((m) => m.id));
  }
}, [project]);

const [memberSearch, setMemberSearch] = useState("");
const [showAllMembers, setShowAllMembers] = useState(false);

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !editingTaskId) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/subtasks/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newSubtaskTitle,
          task_id: editingTaskId
        }),
      });
      if (response.ok) {
        const added = await response.json();
        setSubtasks([...subtasks, added]);
        setTasks(tasks.map(t => t.id === editingTaskId ? { ...t, subtasks: [...(t.subtasks || []), added] } : t));
        setNewSubtaskTitle("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (subtaskId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/subtasks/${subtaskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_completed: !currentStatus
        }),
      });
      if (response.ok) {
        const updated = await response.json();
        const newSubtasks = subtasks.map(st => st.id === subtaskId ? updated : st);
        setSubtasks(newSubtasks);
        setTasks(tasks.map(t => t.id === editingTaskId ? { ...t, subtasks: newSubtasks } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/subtasks/${subtaskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const newSubtasks = subtasks.filter(st => st.id !== subtaskId);
        setSubtasks(newSubtasks);
        setTasks(tasks.map(t => t.id === editingTaskId ? { ...t, subtasks: newSubtasks } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddWorkLog = async () => {
    if (!newWorkLogHours || isNaN(newWorkLogHours) || !editingTaskId) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/worklogs/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hours_spent: parseFloat(newWorkLogHours),
          description: newWorkLogDesc.trim() || null,
          task_id: editingTaskId
        }),
      });
      if (response.ok) {
        const added = await response.json();
        setWorkLogs([...workLogs, added]);
        setTasks(tasks.map(t => t.id === editingTaskId ? { ...t, work_logs: [...(t.work_logs || []), added] } : t));
        setNewWorkLogHours("");
        setNewWorkLogDesc("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWorkLog = async (worklogId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/worklogs/${worklogId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const newLogs = workLogs.filter(wl => wl.id !== worklogId);
        setWorkLogs(newLogs);
        setTasks(tasks.map(t => t.id === editingTaskId ? { ...t, work_logs: newLogs } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [showCustomizeBoard, setShowCustomizeBoard] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [boardColumns, setBoardColumns] = useState(
  project?.board_columns?.length
    ? [...project.board_columns]
    : [...DEFAULT_COLUMNS]
);

const [tempBoardColumns, setTempBoardColumns] = useState([]);

const [newColumnName, setNewColumnName] = useState("");
useEffect(() => {
  const currentCols = project?.board_columns?.length
      ? [...project.board_columns]
      : [...DEFAULT_COLUMNS];
      
  const colNames = currentCols.map(c => typeof c === 'string' ? c.toLowerCase() : (c?.name || 'Unknown').toLowerCase());
  
  const missing = [];
  projectTasks.forEach(task => {
      if (task.status && !colNames.includes(task.status.toLowerCase())) {
          if (!missing.some(m => m.toLowerCase() === task.status.toLowerCase())) {
              missing.push(task.status);
              colNames.push(task.status.toLowerCase());
          }
      }
  });

  let newCols = [...currentCols, ...missing];
  
  if (missing.length > 0) {
    const completedIndex = newCols.findIndex(c => {
      const name = typeof c === 'string' ? c : (c?.name || '');
      return name.toLowerCase() === 'completed' || name.toLowerCase() === 'done';
    });
    if (completedIndex !== -1 && completedIndex !== newCols.length - 1) {
      const completedCol = newCols.splice(completedIndex, 1)[0];
      newCols.push(completedCol);
    }
  }

  setBoardColumns(prev => {
    if (prev.length !== newCols.length) return newCols;
    for (let i = 0; i < prev.length; i++) {
      const prevName = typeof prev[i] === 'string' ? prev[i] : (prev[i]?.name || '');
      const newName = typeof newCols[i] === 'string' ? newCols[i] : (newCols[i]?.name || '');
      if (prevName !== newName) return newCols;
    }
    return prev;
  });
}, [JSON.stringify(project?.board_columns), projectTasks]);

useEffect(() => {
  if (!project || !boardColumns.length) return;
  
  const totalTasks = projectTasks.length;
  const lastColumn = boardColumns[boardColumns.length - 1];
  const lastColName = typeof lastColumn === 'string' ? lastColumn : (lastColumn?.name || 'Completed');
  
  const completedTasks = projectTasks.filter(t => t.status === lastColName).length;
  const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  let newCalculatedStatus = "To Do";
  if (newProgress === 100 && totalTasks > 0) newCalculatedStatus = "Completed";
  else if (newProgress > 0) newCalculatedStatus = "In Progress";
  
  if (project.progress !== newProgress || project.calculated_status !== newCalculatedStatus) {
    setProjects(prevProjects => prevProjects.map(p => p.id === project.id ? { ...p, progress: newProgress, calculated_status: newCalculatedStatus } : p));
  }
}, [projectTasks, boardColumns, project?.id]);

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

  useEffect(() => {
  if (location.state?.highlightProjectId) {
    setHighlightProject(true);

    const timer = setTimeout(() => {
      setHighlightProject(false);
    }, 3000);

    return () => clearTimeout(timer);
  }
}, [location.state]);

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
      const payload = {
        name: taskToUpdate.name,
        description: taskToUpdate.description,
        status: newStatus,
        priority: taskToUpdate.priority,
        issue_type: taskToUpdate.issue_type,
        severity: taskToUpdate.severity,
        due_date: taskToUpdate.due_date,
        project_id: taskToUpdate.project_id,
        assignee_id: taskToUpdate.assignee_id,
        position: newPosition !== undefined && newPosition !== null && !isNaN(newPosition) ? Number(newPosition) : null,
        source_link: taskToUpdate.source_link
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(payload)
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
     
     let newPosition;
     
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
  const refreshProjects = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/projects/?workspace_id=${activeWorkspaceId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      setProjects(data);
    }
  } catch (err) {
    console.error("Failed to refresh projects", err);
  }
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

  setTasks(tasks.map(t =>
    t.id === editingTaskId ? updatedTask : t
  ));

  await refreshProjects();

  closeEditModal();
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

const columns = boardColumns;
const getColumnIcon = (column) => {
  if (column && typeof column === 'object' && column.icon) {
    const IconObj = iconLibrary.find(i => i.name === column.icon);
    if (IconObj) {
      const IconComp = IconObj.component;
      return <IconComp size={20} style={{ color: column.color || '#94a3b8' }} />;
    }
  }

  const colName = typeof column === 'string' ? column : (column?.name || 'Unknown');
  switch (colName) {
    case "To Do":
      return <Clock3 size={20} className="text-yellow-400" />;

    case "In Progress":
      return <PlayCircle size={20} className="text-cyan-400" />;

    case "Completed":
    case "Done":
      return <CheckCircle size={20} className="text-green-400" />;

    default:
      return <CheckSquare size={20} className="text-slate-400" />;
  }
};

const getColumnColor = (column) => {
  if (column && typeof column === 'object' && column.color) {
    return column.color;
  }
  const colName = typeof column === 'string' ? column : (column?.name || 'Unknown');
  switch (colName) {
    case "To Do":
      return "#facc15";

    case "In Progress":
      return "#22d3ee";

    case "Completed":
    case "Done":
      return "#4ade80";

    default:
      const colors = ["#fb923c", "#f472b6", "#a78bfa", "#38bdf8", "#fb7185", "#c084fc", "#fde047", "#818cf8"];
      let hash = 0;
      for (let i = 0; i < colName.length; i++) {
        hash = colName.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
  }
};
const handleUpdateProject = async () => {
  if (!projectName?.trim()) {
    alert("Project Name is required");
    return;
  }

  if (!projectDescription?.trim()) {
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

  const token = localStorage.getItem("token");
  

  const projectData = {
    name: projectName,
    description: projectDescription,
    start_date: startDate,
    end_date: endDate,
    member_ids: selectedMembers,
    workspace_id: parseInt(activeWorkspaceId),
  };

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/projects/${project.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update project");
    }

    const updatedProject = await response.json();

    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? updatedProject : p))
    );

    setShowEditProjectModal(false);
  } catch (err) {
    console.error(err);
    alert("Failed to update project.");
  }
};
const handleDeleteProject = async () => {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/projects/${project.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete");
    }

    setProjects((prev) => prev.filter((p) => p.id !== project.id));

    setShowDeleteProjectModal(false);

    navigate("/projects");
  } catch (err) {
    console.error(err);
    alert("Failed to delete project.");
  }
};

const handleBoardViewChange = async (type) => {
  // Change UI immediately
  setBoardType(type);

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/projects/${project.id}/board-view`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          board_type: type,
        }),
      }
    );

    if (response.ok) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id ? { ...p, board_type: type } : p
        )
      );
    }
  } catch (err) {
    // Backend is not ready yet.
    console.log("Board view API not available yet.");
  }
};


  return (
    <MainLayout>
      <div className="mb-6">

  <div className="flex justify-between items-center mb-4">

    <Link
      to="/projects"
      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 transition"
    >
      <ArrowLeft size={16} />
      Back to Projects
    </Link>

    {currentUserRole === "Admin" && (
      <div className="relative" ref={settingsMenuRef}>

  <button
    onClick={() => setShowProjectSettings(!showProjectSettings)}
    className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition"
  >
    <Settings2 size={20} className="text-slate-300" />
  </button>

  {showProjectSettings && (
  <div className="absolute right-0 mt-3 w-64 rounded-xl border border-white/10 bg-[#171d31] shadow-2xl z-50 overflow-hidden">

    <button
  onClick={() => {
  setProjectName(project.name || "");
  setProjectDescription(project.description || "");
  setStartDate(project.start_date || "");
  setEndDate(project.end_date || "");
  setBoardType(project.board_type || "kanban");
  setSelectedMembers((project.members || []).map((m) => m.id));
  setMemberSearch("");
  setShowAllMembers(false);

  setShowProjectSettings(false);
  setShowEditProjectModal(true);
}}
  className="w-full flex items-center gap-3 px-5 py-3 text-white hover:bg-white/5 transition"
>
      <Pencil size={18} />
      <span>Edit Project</span>
    </button>

    <button
  onClick={() => {
    setShowProjectSettings(false);

    setTempBoardColumns([...boardColumns]);
    setNewColumnName("");

    setShowCustomizeBoard(true);
  }}
  className="w-full flex items-center gap-3 px-5 py-3 text-white hover:bg-white/5 transition"
>
  <LayoutPanelTop size={18} />
  <span>Customize Board</span>
</button>

    <button
  onClick={() => {
    setShowProjectSettings(false);
    setShowTaskVisibilityModal(true);
  }}
  className="w-full flex items-center gap-3 px-5 py-3 text-white hover:bg-white/5 transition"
>
  <Eye size={18} />
  <span>Task Visibility</span>
</button>

<button
  onClick={() => {
    setShowProjectSettings(false);
    setShowArchiveProjectModal(true);
  }}
  className="w-full flex items-center gap-3 px-5 py-3 text-white hover:bg-white/5 transition"
>
  <Archive size={18} />
  <span>Archive Project</span>
</button>

    <div className="border-t border-white/10" />

    <button
  onClick={() => {
    setShowProjectSettings(false);
    setShowDeleteProjectModal(true);
  }}
  className="w-full flex items-center gap-3 px-5 py-3 text-red-400 hover:bg-red-500/10 transition"
>
      <Trash2 size={18} />
      <span>Delete Project</span>
    </button>

  </div>
)}

</div>
    )}

  </div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/10 pb-6">
          <div
  className={`rounded-xl p-3 transition-all duration-700 ${
    highlightProject
      ? "ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.8)]"
      : ""
  }`}
>
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
          <div className="flex items-center gap-3">
    {currentUserRole === "Admin" && (
      <>
        {/* Board View Switcher */}
        <div className="flex rounded-xl border border-white/10 bg-[#171d31] p-1 h-[42px]">
          {["kanban", "scrum", "list"].map((type) => (
            <button
              key={type}
              onClick={() => handleBoardViewChange(type)}
              className={`px-3 py-1 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
                boardType === type
                  ? "bg-cyan-500 text-white shadow-md"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowTeamModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-cyan-500 transition-all"
        >
          <Users size={18} />
          Team
        </button>
      </>
    )}
    <CreateIssueModal defaultProjectId={project.id} />
  </div>
)}
        </div>
      </div>

      {/* TABS MENU */}
      <div className="flex gap-6 border-b border-white/10 mb-6 overflow-x-auto whitespace-nowrap pb-2">
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
  <div className="w-full">

    {/* Kanban Board */}
    {(!boardType || boardType === "kanban") && (
      <KanbanBoard
        columns={columns}
        projectTasks={projectTasks}
        members={members}
        currentUserRole={currentUserRole}
        handleDragStart={handleDragStart}
        handleDragOver={handleDragOver}
        handleDropOnColumn={handleDropOnColumn}
        handleDropOnCard={handleDropOnCard}
        getColumnIcon={getColumnIcon}
        getColumnColor={getColumnColor}
        handleDeleteTask={handleDeleteTask}
        openTask={handleOpenTask}
        highlightedTaskId={highlightedTaskId}
      />
    )}

    {/* Scrum Board */}
    {boardType === "scrum" && (
      <ScrumBoard
        columns={columns}
        projectTasks={projectTasks}
        members={members}
        currentUserRole={currentUserRole}
        handleDragStart={handleDragStart}
        handleDragOver={handleDragOver}
        handleDropOnColumn={handleDropOnColumn}
        handleDropOnCard={handleDropOnCard}
        getColumnIcon={getColumnIcon}
        getColumnColor={getColumnColor}
        handleDeleteTask={handleDeleteTask}
        openTask={handleOpenTask}
        highlightedTaskId={highlightedTaskId}
      />
    )}

    {/* List Board */}
    {boardType === "list" && (
      <TaskListBoard
        projectTasks={projectTasks}
        members={members}
        currentUserRole={currentUserRole}
        handleDeleteTask={handleDeleteTask}
        openTask={handleOpenTask}
        highlightedTaskId={highlightedTaskId}
      />
    )}

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left" onClick={closeEditModal}>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

  {/* Status */}
  <div>
    <label className="block mb-2 font-semibold text-slate-300">
      Status
    </label>

    <select
      value={status}
      onChange={(e) => setStatus(e.target.value)}
      className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
    >
      {columns.map((column) => {
        const colName = typeof column === 'string' ? column : (column?.name || 'Unknown');
        return (
        <option
          key={colName}
          value={colName}
          className="bg-slate-900"
        >
          {colName}
        </option>
      )})}
    </select>
  </div>

  <div>
  <label className="block mb-2 font-semibold text-slate-300">
    Priority
  </label>

  <select
    value={priority}
    onChange={(e) => setPriority(e.target.value)}
    className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
  >
    <option className="bg-slate-900">High</option>
    <option className="bg-slate-900">Medium</option>
    <option className="bg-slate-900">Low</option>
  </select>
</div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

  {issueType === "Bug" && (
    <div>
      <label className="block mb-2 font-semibold text-slate-300">
        Severity
      </label>

      <select
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
        className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
      >
        <option className="bg-slate-900">Critical</option>
        <option className="bg-slate-900">Major</option>
        <option className="bg-slate-900">Medium</option>
        <option className="bg-slate-900">Minor</option>
      </select>
    </div>
  )}

  <div className={issueType === "Task" ? "md:col-span-2" : ""}>
    <label className="block mb-2 font-semibold text-slate-300">
      Due Date
    </label>

    <input
      type="date"
      value={dueDate}
      min={new Date().toISOString().split("T")[0]}
      onChange={(e) => setDueDate(e.target.value)}
      className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
    />
  </div>

</div>

              <div className="flex border-b border-white/10 mt-6 mb-4">
                <button 
                  onClick={() => setActiveTaskTab("subtasks")} 
                  className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTaskTab === "subtasks" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
                >
                  Subtasks
                </button>
                <button 
                  onClick={() => setActiveTaskTab("timetracking")} 
                  className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTaskTab === "timetracking" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
                >
                  Time Tracking
                </button>
                <button 
                  onClick={() => setActiveTaskTab("attachments")} 
                  className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTaskTab === "attachments" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
                >
                  Attachments
                </button>
                <button 
                  onClick={() => setActiveTaskTab("comments")} 
                  className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTaskTab === "comments" ? "border-cyan-500 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
                >
                  Comments
                </button>
              </div>

              {activeTaskTab === "subtasks" && (
              <div className="mb-2">
                <label className="block mb-2 font-semibold text-slate-300">Subtasks</label>
                
                {subtasks.length > 0 && (
                  <div className="mb-3 w-full bg-black/20 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-cyan-500 h-full transition-all duration-300"
                      style={{ width: `${Math.round((subtasks.filter(s => s.is_completed).length / subtasks.length) * 100)}%` }}
                    />
                  </div>
                )}

                <div className="space-y-2 mb-3">
                  {subtasks.map((st) => (
                    <div key={st.id} className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5 group">
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input 
                          type="checkbox" 
                          checked={st.is_completed} 
                          onChange={() => handleToggleSubtask(st.id, st.is_completed)}
                          className="w-4 h-4 rounded border-white/20 bg-black/50 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
                        />
                        <span className={`text-sm ${st.is_completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {st.title}
                        </span>
                      </label>
                      <button 
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input 
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') handleAddSubtask(); }}
                    placeholder="Add a subtask..."
                    className="flex-1 bg-black/20 border border-white/10 text-white px-3 py-2 text-sm rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <button 
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
              )}

              {activeTaskTab === "timetracking" && (
              <div className="mb-2">
                <label className="block mb-2 font-semibold text-slate-300">Time Tracking</label>
                
                {workLogs.length > 0 && (
                  <div className="mb-4 text-sm text-slate-400">
                    Total Logged: <span className="text-cyan-400 font-semibold">{workLogs.reduce((acc, log) => acc + log.hours_spent, 0)} hours</span>
                  </div>
                )}

                <div className="space-y-2 mb-3">
                  {workLogs.map((wl) => (
                    <div key={wl.id} className="flex flex-col bg-black/20 p-3 rounded-lg border border-white/5 group">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-cyan-400">{wl.hours_spent} hours</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">{new Date(wl.created_at).toLocaleDateString()}</span>
                          <button 
                            onClick={() => handleDeleteWorkLog(wl.id)}
                            className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {wl.description && (
                        <span className="text-sm text-slate-300 mt-1">{wl.description}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    value={newWorkLogHours}
                    onChange={(e) => setNewWorkLogHours(e.target.value)}
                    placeholder="Hours"
                    className="w-full sm:w-24 bg-black/20 border border-white/10 text-white px-3 py-2 text-sm rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <input 
                    value={newWorkLogDesc}
                    onChange={(e) => setNewWorkLogDesc(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') handleAddWorkLog(); }}
                    placeholder="What did you work on?"
                    className="flex-1 bg-black/20 border border-white/10 text-white px-3 py-2 text-sm rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <button 
                    onClick={handleAddWorkLog}
                    disabled={!newWorkLogHours}
                    className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    Log Time
                  </button>
                </div>
              </div>
              )}

              {activeTaskTab === "attachments" && (
              <div className="mb-2">
                <TaskAttachments taskId={editingTaskId} />
              </div>
              )}

              {activeTaskTab === "comments" && (
              <div className="mb-2">
                <TaskComments taskId={editingTaskId} />
              </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={closeEditModal}
                  className="px-5 py-2.5 font-medium text-slate-300 hover:bg-white/10 rounded-lg transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleUpdateTask}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-6 py-2.5 rounded-lg font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all"
                >
                  Save Changes
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      <CustomizeBoardModal
  open={showCustomizeBoard}
  onClose={() => {
  setTempBoardColumns([...boardColumns]);
  setNewColumnName("");
  setShowCustomizeBoard(false);
}}
  tempBoardColumns={tempBoardColumns}
  setTempBoardColumns={setTempBoardColumns}
  newColumnName={newColumnName}
  setNewColumnName={setNewColumnName}
  onSave={async () => {
  const cleaned = tempBoardColumns
    .filter(Boolean)
    .map(col => typeof col === 'string' ? col.trim() : { ...col, name: (col.name || "").trim() });

  if (cleaned.some(col => {
    const name = typeof col === 'string' ? col : col.name;
    return !name;
  })) {
    alert("Column names cannot be empty.");
    return;
  }

  const unique = new Set(cleaned.map(col => {
    const name = typeof col === 'string' ? col : col.name;
    return name.toLowerCase();
  }));

  if (unique.size !== cleaned.length) {
    alert("Duplicate column names are not allowed.");
    return;
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ board_columns: cleaned })
    });
    if (!response.ok) throw new Error("Failed to save");
    
    setBoardColumns(cleaned);
    setNewColumnName("");
    setShowCustomizeBoard(false);
    
    // Force a reload so the global context pulls the updated tasks/columns from the backend 
    // since the backend might have moved tasks during a rename/delete!
    window.location.reload();
  } catch {
    alert("Failed to save columns to database.");
  }
}}
/>
      <ProjectTeamModal
        open={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        members={members.filter(m => project.members?.some(mem => mem.id === m.id) || project.created_by_id === m.id)}
      />
      <EditProjectModal
  open={showEditProjectModal}
  onClose={() => setShowEditProjectModal(false)}
  projectName={projectName}
  setProjectName={setProjectName}
  projectDescription={projectDescription}
  setProjectDescription={setProjectDescription}
  startDate={startDate}
  setStartDate={setStartDate}
  endDate={endDate}
  setEndDate={setEndDate}
  members={members}
  selectedMembers={selectedMembers}
  setSelectedMembers={setSelectedMembers}
  memberSearch={memberSearch}
  setMemberSearch={setMemberSearch}
  showAllMembers={showAllMembers}
  setShowAllMembers={setShowAllMembers}
  onUpdate={handleUpdateProject}
/>
<DeleteProjectModal
  open={showDeleteProjectModal}
  onClose={() => setShowDeleteProjectModal(false)}
  onDelete={handleDeleteProject}
  projectName={project.name}
/>
<TaskVisibilityModal
  open={showTaskVisibilityModal}
  onClose={() => setShowTaskVisibilityModal(false)}
  visibility={taskVisibility}
  setVisibility={setTaskVisibility}
  taskViewers={taskViewers}
  setTaskViewers={setTaskViewers}
  projectMembers={project?.members || []}
  onSave={async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          task_visibility: taskVisibility,
          task_viewers: taskViewers
        })
      });
      if (res.ok) {
        const updatedProject = await res.json();
        setProjects(projects.map(p => p.id === parseInt(id) ? updatedProject : p));
        setShowTaskVisibilityModal(false);
      } else {
        alert("Failed to update task visibility");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    }
  }}
/>
{showArchiveProjectModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#171d31] p-6 shadow-2xl">

      <div className="flex items-center gap-3">
        <Archive size={24} className="text-cyan-400" />
        <h2 className="text-xl font-semibold text-white">
          Archive Project
        </h2>
      </div>

      <p className="mt-4 text-slate-300">
        Are you sure you want to archive this project?
      </p>

      <p className="mt-2 text-sm text-slate-500">
        Archived projects can be restored later.
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => setShowArchiveProjectModal(false)}
          className="rounded-lg border border-white/10 px-4 py-2 text-slate-300 hover:bg-white/5"
        >
          Cancel
        </button>

        <button
  onClick={handleArchiveProject}
  className="rounded-lg bg-cyan-500 px-4 py-2 text-white hover:bg-cyan-600"
>
  Archive
</button>
      </div>

    </div>
  </div>
)}
    </MainLayout>
  );
}
