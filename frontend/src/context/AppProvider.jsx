import { useState, useEffect } from "react";
import AppContext from "./AppContext";

export function AppProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]); // <--- Starts empty now!
  
  // We keep this fake data for the Teams UI for now
  const [members, setMembers] = useState([]);
  
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; 

      try {
        // Fetch Projects
        const projRes = await fetch(`${import.meta.env.VITE_API_URL}/projects/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (projRes.ok) {
          const projData = await projRes.json();
          setProjects(projData);
        }

        // Fetch Tasks!
        const teamRes = await fetch(`${import.meta.env.VITE_API_URL}/users/teammates`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          // We map full_name to 'name' so your UI cards work perfectly!
          const formattedMembers = teamData.map(m => ({ ...m, name: m.full_name || m.email }));
          setMembers(formattedMembers);
        }
        const taskRes = await fetch(`${import.meta.env.VITE_API_URL}/tasks/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (taskRes.ok) {
          const taskData = await taskRes.json();
          setTasks(taskData);
        }

      } catch (err) {
        console.error("Failed to load data from database", err);
      }
    };
    
    fetchData();
  }, []);

  return (
    <AppContext.Provider
      value={{ projects, setProjects, tasks, setTasks, members, setMembers, activities, setActivities }}
    >
      {children}
    </AppContext.Provider>
  );
}