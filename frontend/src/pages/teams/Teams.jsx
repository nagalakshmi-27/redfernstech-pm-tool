import MainLayout from "../../layouts/MainLayout";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  Code,
  Palette,
  Briefcase,
} from "lucide-react";
import { validateEmail } from "../../utils/validation";
import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AppContext from "../../context/AppContext";

export default function Teams() {
  const { members, activeWorkspaceRole, activeWorkspaceId } = useContext(AppContext);
  const currentUserRole = activeWorkspaceRole;
  const currentUserId = Number(localStorage.getItem("userId"));
  const location = useLocation();

const [highlightMemberId, setHighlightMemberId] = useState(null);
const [selectedImage, setSelectedImage] = useState(null);

const memberRefs = useRef({});
  const [showModal, setShowModal] = useState(false);
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState(null);
  const [roleDropdownPos, setRoleDropdownPos] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
    const closeDropdown = () => setOpenRoleDropdownId(null);
    document.addEventListener("click", closeDropdown);
    window.addEventListener("scroll", closeDropdown, { capture: true, passive: true });
    return () => {
      document.removeEventListener("click", closeDropdown);
      window.removeEventListener("scroll", closeDropdown, { capture: true });
    };
  }, []);

  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("Member");
  
  const [networkUsers, setNetworkUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (showModal) {
      fetch(`${import.meta.env.VITE_API_URL}/users/network`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
      .then(res => res.json())
      .then(data => setNetworkUsers(data))
      .catch(err => console.error("Failed to fetch network users", err));
    } else {
      setShowSuggestions(false);
    }
  }, [showModal]);

  const filteredNetworkUsers = networkUsers.filter(u => 
    !members.some(m => m.email === u.email) && 
    (u.email.toLowerCase().includes(memberEmail.toLowerCase()) || 
     (u.full_name && u.full_name.toLowerCase().includes(memberEmail.toLowerCase())))
  );

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
          role: memberRole,
          workspace_id: parseInt(activeWorkspaceId)
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
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
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
      `${import.meta.env.VITE_API_URL}/users/teammates/${memberId}?workspace_id=${activeWorkspaceId}`,
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
  } catch (error) {
    console.error(error);
    alert("Error: " + error.message);
  }
};

const handleRoleChange = async (memberId, newRole) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/workspaces/${activeWorkspaceId}/members/${memberId}/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ role: newRole })
    });
    if (response.ok) {
      window.location.reload();
    } else {
      const err = await response.json();
      alert(err.detail || "Failed to update role");
    }
  } catch (error) {
    alert("Error updating role");
  }
};

useEffect(() => {
  const id = location.state?.highlightMemberId;

  if (!id) return;

  console.log("Highlight Member:", id);

  requestAnimationFrame(() => {
    memberRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setHighlightMemberId(id);

    setTimeout(() => {
      setHighlightMemberId(null);
    }, 3000);
  });

}, [location.state]);

if (currentUserRole === "Client") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Teams</h1>

        {currentUserRole !== "Client" && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] w-full sm:w-auto transition-all"
          >
            + Add Member
          </button>
        )}
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
                <div
  key={`${projectName}-${member.id}`}
  ref={(el) => {
    memberRefs.current[member.id] = el;
  }}
  className={`bg-white/5 backdrop-blur-md rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border p-4 md:p-6 transition-all duration-500 ${
    highlightMemberId === member.id
      ? "border-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.8)]"
      : "border-white/10"
  }`}
>
                  {member.profile_image ? (
                    <img 
                      src={member.profile_image.startsWith('http') ? member.profile_image : `${import.meta.env.VITE_API_URL}${member.profile_image}`} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-full object-cover mb-3 shadow-[0_0_10px_rgba(6,182,212,0.5)] cursor-pointer hover:ring-2 hover:ring-cyan-400 transition"
                      onClick={() => setSelectedImage(member.profile_image.startsWith('http') ? member.profile_image : `${import.meta.env.VITE_API_URL}${member.profile_image}`)}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center justify-center text-lg font-bold mb-3 uppercase shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                      {member.full_name ? member.full_name.charAt(0) : (member.name ? member.name.charAt(0) : "U")}
                    </div>
                  )}
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
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="bg-red-500/20 text-red-200 px-3 py-2 rounded-lg text-sm border border-red-500/30 hover:bg-red-500/40 transition"
                      >
                        Delete
                      </button>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openRoleDropdownId === member.id) {
                              setOpenRoleDropdownId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setRoleDropdownPos({ top: rect.bottom + 4, left: rect.left });
                              setOpenRoleDropdownId(member.id);
                            }
                          }}
                          className="bg-cyan-500/20 text-cyan-200 px-3 py-2 rounded-lg text-sm border border-cyan-500/30 hover:bg-cyan-500/40 transition"
                        >
                          Change Role ▾
                        </button>
                        {openRoleDropdownId === member.id && createPortal(
                          <div 
                            className="fixed z-[100] w-32 bg-slate-800 border border-white/10 shadow-2xl rounded-lg py-1 flex flex-col"
                            style={{ top: roleDropdownPos.top, left: roleDropdownPos.left }}
                          >
                            <button onClick={(e) => { e.stopPropagation(); handleRoleChange(member.id, "Admin"); setOpenRoleDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/10 hover:text-white">Admin</button>
                            <button onClick={(e) => { e.stopPropagation(); handleRoleChange(member.id, "Member"); setOpenRoleDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/10 hover:text-white">Member</button>
                            <button onClick={(e) => { e.stopPropagation(); handleRoleChange(member.id, "Client"); setOpenRoleDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/10 hover:text-white">Client</button>
                          </div>,
                          document.body
                        )}
                      </div>
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

        <div className="relative">
          <label className="block mb-2 font-medium text-slate-300">
            Email
          </label>
          <input
            type="email"
            placeholder="Enter Email"
            value={memberEmail}
            onChange={(e) => {
              setMemberEmail(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          {showSuggestions && filteredNetworkUsers.length > 0 && (
             <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto">
               {filteredNetworkUsers.map(user => (
                 <div 
                   key={user.id} 
                   className="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0"
                   onMouseDown={(e) => {
                     e.preventDefault(); // Prevent focus from leaving input, stopping onBlur immediately
                     setMemberEmail(user.email);
                     setMemberName(user.full_name || user.first_name || "");
                     setShowSuggestions(false);
                   }}
                 >
                   {user.profile_image ? (
                     <img src={user.profile_image.startsWith('http') ? user.profile_image : `${import.meta.env.VITE_API_URL}${user.profile_image}`} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                   ) : (
                     <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center justify-center text-sm font-bold uppercase">
                       {user.full_name ? user.full_name.charAt(0) : user.email.charAt(0)}
                     </div>
                   )}
                   <div className="flex flex-col">
                     <span className="text-white text-sm font-medium">{user.full_name || user.email.split('@')[0]}</span>
                     <span className="text-xs text-slate-400">{user.email}</span>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>

        <div>
          <label className="block mb-2 font-medium text-slate-300">Role</label>
          <select
            value={memberRole}
            onChange={(e) => setMemberRole(e.target.value)}
            className="w-full bg-black/20 border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {currentUserRole === "Admin" && <option value="Admin" className="bg-slate-900">Admin</option>}
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

{/* Image Modal */}
{selectedImage && (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" 
    onClick={() => setSelectedImage(null)}
  >
    <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={() => setSelectedImage(null)} 
        className="absolute -top-12 right-0 text-white hover:text-cyan-400 text-4xl transition font-bold"
      >
        &times;
      </button>
      <img 
        src={selectedImage} 
        alt="Enlarged Profile" 
        className="max-w-full max-h-[85vh] rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.5)] object-contain" 
      />
    </div>
  </div>
)}
    </MainLayout>
  );
}