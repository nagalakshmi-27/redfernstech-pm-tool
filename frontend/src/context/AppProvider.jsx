import { useState, useEffect } from "react";
import AppContext from "./AppContext";

export function AppProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]); // <--- Starts empty now!
  
  // We keep this fake data for the Teams UI for now
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] =useState(null);

  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    return localStorage.getItem("activeWorkspaceId") || null;
  });
  const [activeWorkspaceRole, setActiveWorkspaceRole] = useState(null);

  // Fetch Workspaces once
  useEffect(() => {
    const fetchWorkspaces = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/workspaces/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWorkspaces(data);
          if (data.length > 0) {
            const currentValid = data.some(ws => ws.id.toString() === activeWorkspaceId?.toString());
            if (!activeWorkspaceId || !currentValid) {
              setActiveWorkspaceId(data[0].id.toString());
            }
          } else {
            setActiveWorkspaceId(null);
          }
        }
      } catch (err) {
        console.error("Failed to load workspaces", err);
      }
    };
    fetchWorkspaces();
  }, []);

  // Save activeWorkspaceId
  useEffect(() => {
    if (activeWorkspaceId) {
      localStorage.setItem("activeWorkspaceId", activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (activeWorkspaceId && workspaces.length > 0) {
      const activeWs = workspaces.find(ws => ws.id.toString() === activeWorkspaceId.toString());
      if (activeWs) {
        setActiveWorkspaceRole(activeWs.user_role);
      }
    }
  }, [activeWorkspaceId, workspaces]);

  // Fetch Data based on activeWorkspaceId
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token || !activeWorkspaceId) return; 
      try {
      const userRes = await fetch(
  `${import.meta.env.VITE_API_URL}/users/me`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

if (userRes.ok) {
  const userData = await userRes.json();
  setCurrentUser(userData);
}

      
        // Fetch Projects
        const projRes = await fetch(`${import.meta.env.VITE_API_URL}/projects/?workspace_id=${activeWorkspaceId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (projRes.ok) {
          const projData = await projRes.json();
          setProjects(projData);
        }

        // Fetch Tasks!
        const teamRes = await fetch(`${import.meta.env.VITE_API_URL}/users/teammates?workspace_id=${activeWorkspaceId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          // We map full_name to 'name' so your UI cards work perfectly!
          const formattedMembers = teamData.map(m => ({ ...m, name: m.full_name || m.email }));
          setMembers(formattedMembers);
        }
        const taskRes = await fetch(
  `${import.meta.env.VITE_API_URL}/tasks/?workspace_id=${activeWorkspaceId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
        if (taskRes.ok) {
          const taskData = await taskRes.json();
          setTasks(taskData);
        }

      } catch (err) {
        console.error("Failed to load data from database", err);
      }
    };
    
    fetchData();
  }, [activeWorkspaceId]);

  return (
    <AppContext.Provider
      value={{
        workspaces,
        setWorkspaces,
        activeWorkspaceId,
        setActiveWorkspaceId,
        activeWorkspaceRole,
        projects, setProjects, tasks, setTasks, members, setMembers, currentUser,
setCurrentUser }}
    >
      {children}
    </AppContext.Provider>
  );
}