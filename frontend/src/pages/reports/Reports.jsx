import { useContext, useState } from "react";
import AppContext from "../../context/AppContext";
import MainLayout from "../../layouts/MainLayout";

import ReportsHeader from "./components/ReportsHeader";
import ReportsFilters from "./components/ReportsFilters";
import SummaryCards from "./components/SummaryCards";
import AnalyticsCharts from "./components/AnalyticsCharts";
import RecentReportsTable from "./components/RecentReportsTable";
import TopPerformers from "./components/TopPerformers";
import ProjectHealth from "./components/ProjectHealth";
import TeamWorkload from "./components/TeamWorkload";
import * as XLSX from "xlsx";

export default function Reports() {
  const { projects, tasks, members } = useContext(AppContext);

  // Filter State
  const [selectedProject, setSelectedProject] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedMember, setSelectedMember] = useState("All");
  const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");

  // Filter Tasks

const filteredTasks = tasks.filter((task) => {
  const matchesProject =
    selectedProject === "All" ||
    task.project_id === Number(selectedProject);

  const matchesStatus =
    selectedStatus === "All" ||
    task.status === selectedStatus;

  const matchesMember =
    selectedMember === "All" ||
    task.assignee_id === Number(selectedMember);

  const createdDate = new Date(task.created_at);

  let matchesDate = true;

if (fromDate) {
  matchesDate =
    matchesDate &&
    createdDate >= new Date(fromDate);
}

if (toDate) {
  const endDate = new Date(toDate);
  endDate.setHours(23, 59, 59, 999);

  matchesDate =
    matchesDate &&
    createdDate <= endDate;
}

  return (
    matchesProject &&
    matchesStatus &&
    matchesMember &&
    matchesDate
  );
});
  

// Export CSV
const handleExportCSV = () => {
  if (filteredTasks.length === 0) {
    alert("No data available to export.");
    return;
  }

  const csvData = filteredTasks.map((task) => {
    const project = projects.find(
      (p) => p.id === task.project_id
    );

    const member = members.find(
      (m) => m.id === task.assignee_id
    );

    return {
      Ticket: task.ticket_id,
      Task: task.name,
      Project: project?.name || "-",
      Assignee: member?.full_name || member?.name || member?.email || "-",
      Status: task.status,
      Priority: task.priority,
      "Due Date": task.due_date,
    };
  });

  const headers = Object.keys(csvData[0]).join(",");

  const rows = csvData.map((row) =>
    Object.values(row)
      .map((value) => `"${value ?? ""}"`)
      .join(",")
  );

  const csvContent = [headers, ...rows].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `reports-${new Date()
  .toISOString()
  .split("T")[0]}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
const handleExportExcel = () => {
  if (filteredTasks.length === 0) {
    alert("No data available to export.");
    return;
  }

  const excelData = filteredTasks.map((task) => {
    const project = projects.find(
      (p) => p.id === task.project_id
    );

    const member = members.find(
      (m) => m.id === task.assignee_id
    );

    return {
      Ticket: task.ticket_id,
      Task: task.name,
      Project: project?.name || "-",
      Assignee:
        member?.full_name ||
        member?.name ||
        member?.email ||
        "-",
      Status: task.status,
      Priority: task.priority,
      "Due Date": task.due_date,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Reports"
  );

  XLSX.writeFile(
    workbook,
    `reports-${new Date().toISOString().split("T")[0]}.xlsx`
  );
};
const handleResetFilters = () => {
  setSelectedProject("All");
  setSelectedStatus("All");
  setSelectedMember("All");
  setFromDate("");
  setToDate("");
};
  return (
    <MainLayout>
      <ReportsHeader
  onResetFilters={handleResetFilters}
  onExportCSV={handleExportCSV}
  onExportExcel={handleExportExcel}
/>

      <ReportsFilters
  projects={projects}
  members={members}
  selectedProject={selectedProject}
  setSelectedProject={setSelectedProject}
  selectedStatus={selectedStatus}
  setSelectedStatus={setSelectedStatus}
  selectedMember={selectedMember}
  setSelectedMember={setSelectedMember}
  fromDate={fromDate}
setFromDate={setFromDate}
toDate={toDate}
setToDate={setToDate}
/>

      <SummaryCards
        projects={projects}
        tasks={filteredTasks}
      />

      <AnalyticsCharts
  projects={projects}
  tasks={filteredTasks}
/>

<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

  <ProjectHealth
    projects={projects}
    tasks={filteredTasks}
  />

  <TeamWorkload
    members={members}
    tasks={filteredTasks}
  />

</div>

<RecentReportsTable
  tasks={filteredTasks}
  projects={projects}
/>

      <TopPerformers
        tasks={filteredTasks}
        members={members}
      />
    </MainLayout>
  );
}