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
  const [memberRole, setMemberRole] = useState("Teammate");
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
        <h1 className="text-2xl md:text-3xl font-bold">Teams</h1>

        <button
  onClick={() => setShowModal(true)}
  className="bg-slate-900 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
>
  + Add Member
</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-base font-medium">
          Total Members
        </p>

        <p className="text-3xl font-bold mt-2">
          {totalMembers}
        </p>
      </div>

      <Users size={22} />
    </div>
  </div>

  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-base font-medium">
          Developers
        </p>

        <p className="text-3xl font-bold mt-2">
          {developers}
        </p>
      </div>

      <Code size={22} />
    </div>
  </div>

  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-indigo-500">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-base font-medium">
          Designers
        </p>

        <p className="text-3xl font-bold mt-2">
          {designers}
        </p>
      </div>

      <Palette size={22} />
    </div>
  </div>

  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-base font-medium">
          Managers
        </p>

        <p className="text-3xl font-bold mt-2">
          {managers}
        </p>
      </div>

      <Briefcase size={22} />
    </div>
  </div>

</div>
      

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-xl shadow p-4 md:p-6"
          >
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-lg font-bold mb-3">
  {member.name.charAt(0)}
</div>
            <h2 className="text-lg md:text-xl font-semibold mb-2 break-words">
              {member.name}
            </h2>

            <p className="text-blue-600 mb-2">
              {member.role}
            </p>

            <p className="text-gray-600 break-all">
              {member.email}
            </p>
            {member.role !== "Client" && (
            <p className="text-sm text-gray-500 mt-2">
              Department: {member.department}
            </p>
            )}
{member.email !== localStorage.getItem("userEmail") && (
  <div className="mt-4">
    <button
      onClick={() => handleDeleteMember(member.id)}
      className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-600"
    >
      Delete
    </button>
  </div>
)}
          </div>
        ))}
      </div>
      {showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white p-4 md:p-6 rounded-xl w-[95%] max-w-[500px]">
      <h2 className="text-2xl font-bold mb-4">
        Add Team Member
      </h2>

      <div className="space-y-4">

        <div>
          <label className="block mb-2 font-medium">
            Name
          </label>
          <input
  type="text"
  placeholder="Enter Name"
  value={memberName}
  onChange={(e) => setMemberName(e.target.value)}
  className="w-full border p-3 rounded-lg"
/>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Email
          </label>
          <input
            type="email"
            placeholder="Enter Email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Role</label>
          <select
            value={memberRole}
            onChange={(e) => setMemberRole(e.target.value)}
            className="w-full border p-3 rounded-lg bg-white"
          >
            <option value="Teammate">Teammate</option>
            <option value="Client">Client</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 border rounded-lg w-full sm:w-auto"
          >
            Cancel
          </button>

          <button
            onClick={handleAddMember}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
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