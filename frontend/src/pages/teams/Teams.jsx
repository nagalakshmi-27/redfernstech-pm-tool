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
import AppContext from "../../context/AppContext";

export default function Teams() {
  const { members, setMembers } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [department, setDepartment] = useState("");
  const handleAddMember = async () => {
    if (!memberEmail.trim()) { alert("Email is required"); return; }
    if (!validateEmail(memberEmail)) { alert("Please enter a valid email"); return; }
    if (!memberRole.trim()) { alert("Role is required"); return; }
    if (!department.trim()) { alert("Department is required"); return; }
    try {
      const response = await fetch("http://127.0.0.1:8000/users/invite", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ 
          email: memberEmail, 
          role: memberRole, 
          department: department 
        })
      });
      if (response.ok) {
        alert("Invitation sent successfully to " + memberEmail + "!");
        setMemberName("");
        setMemberEmail("");
        setMemberRole("");
        setDepartment("");
        setShowModal(false);
      } else {
        const errData = await response.json();
        alert("Failed to send invite: " + errData.detail);
      }
    } catch (err) {
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



  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Teams</h1>

        <button
  onClick={() => setShowModal(true)}
  className="bg-slate-900 text-white px-4 py-2 rounded-lg"
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
      

      <div className="grid grid-cols-2 gap-6">
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-xl shadow p-6"
          >
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-lg font-bold mb-3">
  {member.name.charAt(0)}
</div>
            <h2 className="text-xl font-semibold mb-2">
              {member.name}
            </h2>

            <p className="text-blue-600 mb-2">
              {member.role}
            </p>

            <p className="text-gray-600">
              {member.email}
            </p>
            <p className="text-sm text-gray-500 mt-2">
  Department: {member.department}
</p>
          </div>
        ))}
      </div>
      {showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-xl w-[500px]">
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
          <label className="block mb-2 font-medium">
            Role
          </label>
          <select
  value={memberRole}
  onChange={(e) => setMemberRole(e.target.value)}
  className="w-full border p-3 rounded-lg"
>
  <option value="">Select Role</option>
  <option>Admin</option>
  <option>Project Manager</option>
  <option>Frontend Developer</option>
  <option>Backend Developer</option>
  <option>UI/UX Designer</option>
  <option>QA Engineer</option>
</select>
        </div>

        <div>
  <label className="block mb-2 font-medium">
    Department
  </label>

  <select
    value={department}
    onChange={(e) => setDepartment(e.target.value)}
    className="w-full border p-3 rounded-lg"
  >
    <option value="">Select Department</option>
    <option>Development</option>
    <option>Design</option>
    <option>Management</option>
    <option>QA</option>
  </select>
</div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleAddMember}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg"
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