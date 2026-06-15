import { useState } from "react";
import AppContext from "./AppContext";

export function AppProvider({ children }) {
  const [projects, setProjects] = useState([
  {
    id: 1,
    name: "PM Tool",
    status: "Active",
  },
]);
  const [tasks, setTasks] = useState([
  {
    id: 1,
    name: "Design Dashboard",
    description: "Create dashboard UI",
    priority: "High",
    status: "In Progress",
    assignee: "Akash",
    dueDate: "2026-06-20",
  },
  {
    id: 2,
    name: "Create Login UI",
    description: "Develop Login Page",
    priority: "Medium",
    status: "To Do",
    assignee: "Nagalakshmi",
    dueDate: "2026-06-25",
  },
]);
  const [members, setMembers] = useState([
  {
    id: 1,
    name: "Nagalakshmi",
    role: "Frontend Developer",
    email: "naga@redferns.com",
    department: "Development",
  },
  {
    id: 2,
    name: "Akash",
    role: "Backend Developer",
    email: "akash@redferns.com",
    department: "Development",
  },
  {
    id: 3,
    name: "Akanksha",
    role: "UI/UX Designer",
    email: "akanksha@redferns.com",
    department: "Design",
  },
]);
  const [activities, setActivities] = useState([]);

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