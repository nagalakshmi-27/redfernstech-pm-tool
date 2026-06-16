import { useState, useEffect } from "react";
import AppContext from "./AppContext";

export function AppProvider({ children }) {
  // 1. Start with an empty array instead of fake data!
  const [projects, setProjects] = useState([]);
  
  const [tasks, setTasks] = useState([
    { id: 1, name: "Design Dashboard", description: "Create dashboard UI", priority: "High", status: "In Progress", assignee: "Akash", dueDate: "2026-06-20", project: "PM Tool" },
    { id: 2, name: "Create Login UI", description: "Develop Login Page", priority: "Medium", status: "To Do", assignee: "Nagalakshmi", dueDate: "2026-06-25", project: "PM Tool" },
  ]);
  
  const [members, setMembers] = useState([
    { id: 1, name: "Nagalakshmi", role: "Frontend Developer", email: "naga@redferns.com", department: "Development" },
    { id: 2, name: "Akash", role: "Backend Developer", email: "akash@redferns.com", department: "Development" },
    { id: 3, name: "Akanksha", role: "UI/UX Designer", email: "akanksha@redferns.com", department: "Design" },
  ]);
  
  const [activities, setActivities] = useState([]);

  // 2. Fetch real projects from the database when the app loads!
  useEffect(() => {
    const fetchProjects = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; // Don't fetch if not logged in

      try {
        const response = await fetch("http://127.0.0.1:8000/projects/", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setProjects(data); // Save the real database projects to React!
        }
      } catch (err) {
        console.error("Failed to load projects", err);
      }
    };
    
    fetchProjects();
  }, []);

  return (
    <AppContext.Provider
      value={{
        projects,
        setProjects,
        tasks,
        setTasks,
        members,
        setMembers,
        activities,
        setActivities,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}