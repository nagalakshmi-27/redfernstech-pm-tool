import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";

export default function Settings() {
  const currentUserRole = localStorage.getItem("userRole");
  // Profile States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [companyRole, setCompanyRole] = useState("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("");

  // Security (Password) States that were missing!
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordValidation, setShowPasswordValidation] =
  useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [ownedProjects, setOwnedProjects] = useState([]);
const [projectTransfers, setProjectTransfers] = useState({});
const [loadingProjects, setLoadingProjects] = useState(false);
const [showFinalDeleteModal, setShowFinalDeleteModal] = useState(false);
const [deleteConfirmation, setDeleteConfirmation] = useState("");
const [finalConfirmation, setFinalConfirmation] = useState(false);
  // 1. Load the user's data when the page opens
  useEffect(() => {
    const fetchMyData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (response.ok) {
          const data = await response.json();
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setEmail(data.email || "");
          setRole(data.role || "");
          setCompanyRole(data.company_role || "");
          setDepartment(data.department || "");
        }
        
        setLoadingProjects(true);
        const projectsResponse = await fetch(`${import.meta.env.VITE_API_URL}/users/me/owned-projects`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setOwnedProjects(projectsData);
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchMyData();
  }, []);

  // 2. Save Profile Data
  const handleSave = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, company_role: companyRole, department: department })
      });

      if (response.ok) {
        setMessage("Settings saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to save settings.");
      }
    } catch (err) {
  console.error("Failed to save settings:", err);
  setMessage("Failed to save settings.");
}
  };


  // 3. Handle Password Change (Dummy function to prevent crashes)
  const handlePasswordChange = async () => {
    setShowPasswordValidation(true);
    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match!");
      return;
    }
    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters long!");
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me/password`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ 
          current_password: currentPassword, 
          new_password: newPassword 
        })
      });
      if (response.ok) {
        setMessage("Password updated successfully!");
        setShowPasswordSection(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setMessage(""), 4000);
      } else {
        const errData = await response.json();
        setMessage(errData.detail || "Failed to update password.");
      }
    } catch {
      setMessage("Failed to connect to backend.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const projectsToDelete = ownedProjects.filter(p => p.members.length === 0).map(p => p.project_id);
      
      const transferRes = await fetch(`${import.meta.env.VITE_API_URL}/users/me/transfer-projects`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          projects_to_delete: projectsToDelete,
          transfers: projectTransfers
        })
      });

      if (!transferRes.ok) {
        setMessage("Failed to transfer projects. Please try again.");
        resetDeleteFlow();
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      if (response.ok) {
        alert("Your account has been successfully deleted.");
        handleLogout();
      } else {
        setMessage("Failed to delete account. Please try again.");
        resetDeleteFlow();
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
      setMessage("Failed to connect to backend.");
      resetDeleteFlow();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    window.location.href = "/";
  };

  const passwordChecks = {
  length: newPassword.length >= 8,
  uppercase: /[A-Z]/.test(newPassword),
  lowercase: /[a-z]/.test(newPassword),
  number: /\d/.test(newPassword),
  special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
};

const allProjectsAssigned =
  ownedProjects.length === 0 ||
  ownedProjects.every(
    (project) => project.members.length === 0 || projectTransfers[project.project_id]
  );
  const resetDeleteFlow = () => {
  setShowDeleteModal(false);
  setShowFinalDeleteModal(false);

  setConfirmDelete(false);
  setDeleteConfirmation("");
  setFinalConfirmation(false);

  setProjectTransfers({});
};
  return (
    <MainLayout>
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white">
  Settings
</h1>

      <div className="bg-white/5 backdrop-blur-md rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 p-4 md:p-6 space-y-4 text-white">
        {message && (
  <div className={`p-3 rounded-lg break-words ${message.toLowerCase().includes("success") ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>
    {message}
  </div>
)}

        <div className="flex flex-col md:flex-row gap-4 md:w-2/3">
          <div className="flex-1">
            <label className="block font-medium mb-2 text-slate-300">First Name</label>
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="flex-1">
            <label className="block font-medium mb-2 text-slate-300">Last Name</label>
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium mb-2 text-slate-300">Email</label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full md:w-2/3 border p-3 rounded-lg bg-white/5 text-slate-300 border-white/10 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block font-medium mb-2 text-slate-300">User Type</label>
          <input
            type="text"
            value={role}
            readOnly
            className="w-full md:w-2/3 border p-3 rounded-lg bg-white/5 text-slate-300 border-white/10 cursor-not-allowed"
          />
        </div>

        {currentUserRole !== "Client" && (
        <>
        <div>
          <label className="block font-medium mb-2 text-slate-300">Role</label>
          <input
            type="text"
            placeholder="Enter your role (e.g. Developer, Designer)"
            value={companyRole}
            onChange={(e) => setCompanyRole(e.target.value)}
            className="w-full md:w-2/3 bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        
        <div>
          <label className="block font-medium mb-2 text-slate-300">Department</label>
          <input
            type="text"
            placeholder="Enter your department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full md:w-2/3 bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        </>
        )}

        {/* Security Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Security</h2>

          {!showPasswordSection ? (
  <div className="flex flex-col sm:flex-row gap-3">
    <button
      onClick={() => setShowPasswordSection(true)}
      className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-5 py-3 rounded-lg font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all"
    >
      Change Password
    </button>

    <button
      onClick={() => {
  resetDeleteFlow();
  setShowDeleteModal(true);
}}
      className="border border-red-500 text-red-400 px-5 py-3 rounded-lg font-medium hover:bg-red-500/10 transition-all"
    >
      Delete Account
    </button>
  </div>
) : (
            <div className="space-y-4 bg-black/30 p-4 rounded-xl border border-white/10">
              <div className="relative">
  <input
    type={showCurrentPassword ? "text" : "password"}
    placeholder="Current Password"
    value={currentPassword}
    onChange={(e) => setCurrentPassword(e.target.value)}
    className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg pr-12 focus:outline-none focus:ring-1 focus:ring-cyan-500"
  />

  <button
    type="button"
    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
  >
    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>

              <div className="relative">
  <input
    type={showNewPassword ? "text" : "password"}
    placeholder="New Password"
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
    className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg pr-12 focus:outline-none focus:ring-1 focus:ring-cyan-500"
  />

  <button
    type="button"
    onClick={() => setShowNewPassword(!showNewPassword)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
  >
    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>
              {showPasswordValidation && (
  <div className="text-sm space-y-1">
    <p className={passwordChecks.length ? "text-green-600" : "text-red-600"}>
      {passwordChecks.length ? "✓" : "✗"} At least 8 characters
    </p>

    <p className={passwordChecks.uppercase ? "text-green-600" : "text-red-600"}>
      {passwordChecks.uppercase ? "✓" : "✗"} One uppercase letter
    </p>

    <p className={passwordChecks.lowercase ? "text-green-600" : "text-red-600"}>
      {passwordChecks.lowercase ? "✓" : "✗"} One lowercase letter
    </p>

    <p className={passwordChecks.number ? "text-green-600" : "text-red-600"}>
      {passwordChecks.number ? "✓" : "✗"} One number
    </p>

    <p className={passwordChecks.special ? "text-green-600" : "text-red-600"}>
      {passwordChecks.special ? "✓" : "✗"} One special character
    </p>
  </div>
)}

              <div className="relative">
  <input
    type={showConfirmPassword ? "text" : "password"}
    placeholder="Confirm Password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    className="w-full bg-black/20 border border-white/10 text-white placeholder-slate-500 p-3 rounded-lg pr-12 focus:outline-none focus:ring-1 focus:ring-cyan-500"
  />

  <button
    type="button"
    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
  >
    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handlePasswordChange}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-5 py-3 rounded-lg font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all"
                >
                  Update Password
                </button>
                <button
                  onClick={() => setShowPasswordSection(false)}
                  className="border border-white/20 text-slate-300 px-5 py-3 rounded-lg hover:bg-white/5 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save/Logout Actions */}
        <div className="pt-6 flex flex-col sm:flex-row gap-3">
          <button onClick={handleSave} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-5 py-3 rounded-lg font-medium shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] w-full sm:w-auto transition-all">
            Save Changes
          </button>
          <button onClick={handleLogout} className="border border-white/20 text-slate-300 px-5 py-3 rounded-lg hover:bg-white/5 transition w-full sm:w-auto">
            Logout
          </button>
        </div>
      </div>
      {showDeleteModal && (
  <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto">
  <div className="min-h-screen flex items-start sm:items-center justify-center p-3 sm:p-6">
    <div className="bg-[#141a2d] border border-white/10 rounded-2xl w-full max-w-3xl p-4 sm:p-6 shadow-2xl my-6 max-h-[92vh] overflow-hidden flex flex-col">

      <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-3">
        Delete Account
      </h2>

      <p className="text-slate-300 leading-relaxed">
        Are you sure you want to delete your account?
      </p>

      <p className="text-slate-400 text-sm mt-3">
        This action cannot be undone.
      </p>
      <div className="mt-6 flex-1 overflow-y-auto pr-2">
        <div className="mt-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
  <p className="text-yellow-300 font-semibold">
    Before deleting your account
  </p>

  <ul className="list-disc list-inside text-sm text-slate-300 mt-2 space-y-1">
    <li>All projects you own will be transferred.</li>
    <li>You will immediately lose access to your projects.</li>
    <li>Your account will be permanently deleted.</li>
    <li>This action cannot be undone.</li>
  </ul>
</div>
  <div className="mt-6">
  <h3 className="text-lg font-semibold text-white mb-4">
    Project Ownership
  </h3>

  {loadingProjects ? (

    <div className="text-slate-400">
      Loading your projects...
    </div>

  ) : ownedProjects.length === 0 ? (

    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-slate-400">
      No owned projects found.
    </div>

  ) : (

    <div className="space-y-4">

      {ownedProjects.map((project) => (

        <div
          key={project.project_id}
          className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4"
        >

          <h4 className="font-semibold text-base sm:text-lg text-white">
            {project.project_name}
          </h4>

          {project.members.length === 0 ? (
            <p className="text-sm text-red-400 mt-1">
              No other members. This project will be permanently deleted.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-400 mt-1 mb-3">
                Select a new owner for this project.
              </p>

              <select
                value={projectTransfers[project.project_id] || ""}
                onChange={(e) =>
                  setProjectTransfers((prev) => ({
                    ...prev,
                    [project.project_id]: e.target.value,
                  }))
                }
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm sm:text-base"
              >
                <option value="" className="text-slate-900 bg-slate-100">Select teammate</option>

                {project.members.map((member) => (

                  <option
                    key={member.id}
                    value={member.id}
                    className="text-slate-900 bg-slate-100"
                  >
                    {member.name}
                  </option>

                ))}

              </select>
            </>
          )}

        </div>

      ))}

    </div>

  )}
</div>
</div>
      <div className="mt-6">
  <label className="flex items-center gap-3 text-slate-300 cursor-pointer">
    <input
      type="checkbox"
      checked={confirmDelete}
      onChange={(e) => setConfirmDelete(e.target.checked)}
      className="w-4 h-4 accent-red-600"
    />
    <span>
      I understand that deleting my account is permanent.
    </span>
  </label>
</div>

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-white/10 pt-5">
        <button
          onClick={resetDeleteFlow}
          className="px-5 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5"
        >
          Cancel
        </button>

        <button
  disabled={!confirmDelete || !allProjectsAssigned}
  onClick={() => {
    setShowDeleteModal(false);
    setShowFinalDeleteModal(true);
  }}
  className={`px-5 py-2 rounded-lg text-white font-semibold transition ${
    confirmDelete && allProjectsAssigned
      ? "bg-red-600 hover:bg-red-700"
      : "bg-red-900/40 cursor-not-allowed"
  }`}
>
  Next
</button>
      </div>

    </div>
  </div>
  </div>
)}
{showFinalDeleteModal && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="bg-[#141a2d] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">

      <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-3">
        Final Confirmation
      </h2>

      <p className="text-slate-300 leading-relaxed">
        Your account will be permanently deleted.
      </p>

      <p className="text-slate-400 text-sm mt-2">
        Type <span className="font-bold text-red-400">DELETE</span> below to continue.
      </p>

      <input
        type="text"
        value={deleteConfirmation}
        onChange={(e) => setDeleteConfirmation(e.target.value)}
        placeholder="Type DELETE"
        className="w-full mt-5 bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
      />

      <label className="flex items-center gap-3 mt-5 cursor-pointer text-slate-300">
        <input
          type="checkbox"
          checked={finalConfirmation}
          onChange={(e) => setFinalConfirmation(e.target.checked)}
          className="accent-red-600"
        />

        <span>
          I understand this action cannot be undone.
        </span>
      </label>

      <div className="flex justify-end gap-3 mt-8">

        <button
          onClick={() => {
            setShowFinalDeleteModal(false);
            setShowDeleteModal(true);
          }}
          className="px-5 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5"
        >
          Back
        </button>

        <button
          onClick={handleDeleteAccount}
          disabled={
            deleteConfirmation !== "DELETE" ||
            !finalConfirmation
          }
          className={`px-5 py-2 rounded-lg text-white font-semibold transition ${
            deleteConfirmation === "DELETE" && finalConfirmation
              ? "bg-red-600 hover:bg-red-700"
              : "bg-red-900/40 cursor-not-allowed"
          }`}
        >
          Delete Account
        </button>

      </div>

    </div>
  </div>
)}
    </MainLayout>
  );
}