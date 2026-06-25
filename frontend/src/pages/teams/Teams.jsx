import MainLayout from "../../layouts/MainLayout";
import { useState } from "react";
import {
  Users,
  Code,
  Palette,
  Briefcase,
} from "lucide-react";
import { validateEmail } from "../../utils/validation";
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AppContext from "../../context/AppContext";

export default function Teams() {
  const { members} = useContext(AppContext);
  const currentUserRole = localStorage.getItem("userRole");

  if (currentUserRole === "Client") {
    return <Navigate to="/dashboard" replace />;
  }
  const [showModal, setShowModal] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("Member");
  const handleAddMember = async () => {
    if (!memberEmail.trim()) { alert("Email is required"); return; }
    if (!validateEmail(memberEmail)) { alert("Please enter a valid email"); return; }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/invite`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          email: memberEmail,
          role: memberRole
        })
      });
      if (response.ok) {
        alert("Invitation sent successfully to " + memberEmail + "!");
        setMemberName("");
        setMemberEmail("");
        setMemberRole("Teammate");
        setShowModal(false);
      } else {
        const errData = await response.json();
console.log(errData);
alert("Failed to send invite: " + JSON.stringify(errData));
      }
    } catch{
      alert("Failed to connect to backend.");
    }
  };

const totalMembers = members.length;

const developers = members.filter(
  (member) => member.department === "Development"
).length;

const designers = members.filter(
  (member) => member.department === "Design"
).length;

const managers = members.filter(
  (member) => member.department === "Management"
).length;

const handleDeleteMember = async (memberId) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this member?"
  );

  if (!confirmDelete) return;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/users/teammates/${memberId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      alert("Member deleted successfully!");
      window.location.reload();
    } else {
      const errData = await response.json();
      alert(errData.detail || "Failed to delete member");
    }
  } catch {
    alert("Failed to connect to backend");
  }
};

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Teams</h1>

        {currentUserRole === "Admin" && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] w-full sm:w-auto transition-all"
          >
            + Add Member
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

  <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 border-l-4 border-l-cyan-500">
    <div className="flex justify-between items-center text-slate-200">
      <div>
        <p className="text-slate-400 text-base font-medium">
          Total Members
        </p>

        <p className="text-3xl font-bold mt-2 text-white">
          {totalMembers}
        </p>
      </div>

      <Users size={22} className="text-cyan-400" />
    </div>
  </div>

  <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 border-l-4 border-l-green-400">
    <div className="flex justify-between items-center text-slate-200">
      <div>
        <p className="text-slate-400 text-base font-medium">
          Developers
        </p>

        <p className="text-3xl font-bold mt-2 text-white">
          {developers}
        </p>
      </div>

      <Code size={22} className="text-green-400" />
    </div>
  </div>

  <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 border-l-4 border-l-indigo-400">
    <div className="flex justify-between items-center text-slate-200">
      <div>
        <p className="text-slate-400 text-base font-medium">
          Designers
        </p>

        <p className="text-3xl font-bold mt-2 text-white">
          {designers}
        </p>
      </div>

      <Palette size={22} className="text-indigo-400" />
    </div>
  </div>

  <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 border-l-4 border-l-purple-400">
    <div className="flex justify-between items-center text-slate-200">
      <div>
        <p className="text-slate-400 text-base font-medium">
          Managers
        </p>

        <p className="text-3xl font-bold mt-2 text-white">
          {managers}
        </p>
      </div>

      <Briefcase size={22} className="text-purple-400" />
    </div>
  </div>

</div>
      

      <div>
        {Object.entries(
          members.reduce((acc, member) => {
            if (!member.shared_projects || member.shared_projects.length === 0) {
              if (!acc["No Shared Projects"]) acc["No Shared Projects"] = [];
              acc["No Shared Projects"].push(member);
            } else {
              member.shared_projects.forEach(proj => {
                if (!acc[proj]) acc[proj] = [];
                acc[proj].push(member);
              });
            }
            return acc;
          }, {})
        ).map(([projectName, projectMembers]) => (
          <div key={projectName} className="mb-10">
            <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2 flex items-center gap-2 text-white">
              <Briefcase className="text-cyan-400" size={24} /> {projectName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projectMembers.map((member) => (
                <div key={`${projectName}-${member.id}`} className="bg-white/5 backdrop-blur-md rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 p-4 md:p-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center justify-center text-lg font-bold mb-3 uppercase shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                    {member.full_name ? member.full_name.charAt(0) : (member.name ? member.name.charAt(0) : "U")}
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold mb-2 break-words text-white">
                    {member.full_name || member.name || "Unknown"}
                  </h2>
                  <p className="text-cyan-400 mb-2">
                    {member.role === "Client" ? "Client" : (member.company_role || member.role)}
                  </p>
                  <p className="text-slate-300 break-all">
                    {member.email}
                  </p>
                  {member.role !== "Client" && (
                    <p className="text-sm text-slate-400 mt-2">
                      Department: {member.department}
                    </p>
                  )}
                  {currentUserRole === "Admin" && member.email !== localStorage.getItem("userEmail") && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="bg-red-500/20 text-red-200 px-3 py-2 rounded-lg text-sm border border-red-500/30 hover:bg-red-500/40 transition"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {showModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 p-4 md:p-6 rounded-2xl w-[95%] max-w-[500px] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      <h2 className="text-2xl font-bold mb-4 text-white">
        Add Team Member
      </h2>

      <div className="space-y-4">

        <div>
          <label className="block mb-2 font-medium text-slate-300">
            Name
          </label>
          <input
  type="text"
  placeholder="Enter Name"
  value={memberName}
  onChange={(e) => setMemberName(e.target.value)}
  className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
/>
        </div>

        <div>
          <label className="block mb-2 font-medium text-slate-300">
            Email
          </label>
          <input
            type="email"
            placeholder="Enter Email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-slate-300">Role</label>
          <select
            value={memberRole}
            onChange={(e) => setMemberRole(e.target.value)}
            className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="Admin" className="bg-slate-900">Admin</option>
            <option value="Member" className="bg-slate-900">Member</option>
            <option value="Client" className="bg-slate-900">Client</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 border border-white/20 text-slate-300 rounded-lg hover:bg-white/5 transition w-full sm:w-auto"
          >
            Cancel
          </button>

          <button
            onClick={handleAddMember}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] w-full sm:w-auto transition-all"
          >
            Add Member
          </button>
        </div>

      </div>
    </div>
  </div>
)}
    </MainLayout>
  );
}