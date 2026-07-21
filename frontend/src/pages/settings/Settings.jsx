import { useState, useEffect, useContext, useRef } from "react";
import { Eye, EyeOff, Upload, Camera, Trash2 } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import AppContext from "../../context/AppContext";
import ImageCropModal from "../../components/ImageCropModal";

export default function Settings() {
  const { activeWorkspaceRole, currentUser } = useContext(AppContext);
  const currentUserRole = currentUser?.is_owner ? "Owner" : activeWorkspaceRole;
  // Profile States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [companyRole, setCompanyRole] = useState("");
  const [department, setDepartment] = useState("");
  const [organizationName, setOrganizationName] = useState("");
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

const [eligibleAdmins, setEligibleAdmins] = useState([]);
const [loadingAdmins, setLoadingAdmins] = useState(false);
const [deleteOrTransfer, setDeleteOrTransfer] = useState("transfer");
const [selectedOwnerId, setSelectedOwnerId] = useState("");
const [showFinalDeleteModal, setShowFinalDeleteModal] = useState(false);
const [passwordForDelete, setPasswordForDelete] = useState("");
const [deleteConfirmation, setDeleteConfirmation] = useState("");
const [finalConfirmation, setFinalConfirmation] = useState(false);
const [showPhotoModal, setShowPhotoModal] = useState(false);
const [showCamera, setShowCamera] = useState(false);
const [showCropModal, setShowCropModal] = useState(false);
const [selectedImage, setSelectedImage] = useState(null);

const [profileImage, setProfileImage] = useState(
  localStorage.getItem("profileImage") || null
);

const fileInputRef = useRef(null);
const videoRef = useRef(null);
const canvasRef = useRef(null);
const streamRef = useRef(null);

const userEmail = localStorage.getItem("userEmail") || "";

const userInitial = userEmail
  ? userEmail.charAt(0).toUpperCase()
  : "U";
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
          setOrganizationName(data.organization_name || "RedFerns Tech");
        }
        
        const fetchAdmins = async () => {
          if (currentUser?.is_owner) {
            try {
              setLoadingAdmins(true);
              const adminsRes = await fetch(`${import.meta.env.VITE_API_URL}/users/eligible-owners`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
              });
              if (adminsRes.ok) {
                const adminsData = await adminsRes.json();
                setEligibleAdmins(adminsData);
                if (adminsData.length > 0) {
                  setSelectedOwnerId(adminsData[0].id);
                } else {
                  setDeleteOrTransfer("delete");
                }
              }
              setLoadingAdmins(false);
            } catch (err) {
              console.error("Failed to load eligible owners", err);
              setLoadingAdmins(false);
            }
          }
        };
        fetchAdmins();
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    };
    fetchMyData();
  }, [currentUser]);
  useEffect(() => {
  const handleProfileImageUpdate = () => {
    const latestImage = localStorage.getItem("profileImage");
    setProfileImage(latestImage);
  };

  window.addEventListener("profileImageUpdated", handleProfileImageUpdate);

  return () => {
    window.removeEventListener(
      "profileImageUpdated",
      handleProfileImageUpdate
    );
  };
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
        body: JSON.stringify({ first_name: firstName, last_name: lastName, company_role: companyRole, department: department, organization_name: organizationName })
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
    const token = localStorage.getItem("token");
    try {
      if (currentUser?.is_owner && deleteOrTransfer === "transfer" && selectedOwnerId) {
        const transferRes = await fetch(`${import.meta.env.VITE_API_URL}/users/transfer-organization`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ new_owner_id: parseInt(selectedOwnerId) })
        });
        if (!transferRes.ok) {
           setMessage("Failed to transfer organization. Please try again.");
           resetDeleteFlow();
           return;
        }
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ password: passwordForDelete })
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
  const handleImageSelect = (event) => {
  const file = event.target.files[0];

  if (!file) return;

  const imageUrl = URL.createObjectURL(file);

  setSelectedImage(imageUrl);

  setShowCropModal(true);

  setShowPhotoModal(false);
};

const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    streamRef.current = stream;

    setShowCamera(true);

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }, 100);
  } catch {
    alert("Unable to access camera.");
  }
};

const stopCamera = () => {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach((track) => track.stop());
  }

  setShowCamera(false);
};

const capturePhoto = () => {
  const canvas = canvasRef.current;
  const video = videoRef.current;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  const image = canvas.toDataURL("image/png");

  setSelectedImage(image);

  stopCamera();

  setShowCropModal(true);

  setShowPhotoModal(false);
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

const allAssigned = currentUser?.is_owner ? (deleteOrTransfer === "delete" || (deleteOrTransfer === "transfer" && selectedOwnerId)) : true;
const canProceed = passwordForDelete && allAssigned;

  const resetDeleteFlow = () => {
  setShowDeleteModal(false);
  setShowFinalDeleteModal(false);

  setConfirmDelete(false);
  setDeleteConfirmation("");
  setDeleteOrTransfer("delete");
  setSelectedOwnerId("");
  setPasswordForDelete("");
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
<div className="flex flex-col items-start mb-8">
  <div className="relative">
    <div
      onClick={() => setShowPhotoModal(true)}
      className="w-32 h-32 rounded-full overflow-hidden border-2 border-cyan-500 cursor-pointer"
    >
      {profileImage ? (
        <img
          src={profileImage}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-4xl font-bold text-white">
          {userInitial}
        </div>
      )}
    </div>
  </div>
  

<input
  type="file"
  accept="image/*"
  ref={fileInputRef}
  onChange={handleImageSelect}
  className="hidden"
/>
</div>
<div>
  <label className="block font-medium mb-2 text-slate-300">
    Organization Name
  </label>

  <input
    type="text"
    value={organizationName}
    readOnly
    className="w-full md:w-2/3 border p-3 rounded-lg bg-white/5 text-slate-300 border-white/10 cursor-not-allowed"
  />
</div>

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
          <label className="block font-medium mb-2 text-slate-300">User-Name</label>
          <input
            type="text"
            value={currentUser?.username || "Loading..."}
            readOnly
            className="w-full md:w-2/3 border p-3 rounded-lg bg-white/5 text-slate-300 border-white/10 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block font-medium mb-2 text-slate-300">User Type</label>
          <input
            type="text"
            value={currentUserRole || "Loading..."}
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
    {currentUser?.is_owner ? (
      <>
        <h3 className="text-lg font-semibold text-white mb-4 mt-6">
          Organization Transfer
        </h3>
        {loadingAdmins ? (
          <div className="text-slate-400">Checking for eligible admins...</div>
        ) : eligibleAdmins.length === 0 ? (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
            You are the only Owner. If you proceed, the entire organization and all its data will be permanently deleted.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="radio"
                  name="org_action"
                  value="transfer"
                  checked={deleteOrTransfer === "transfer"}
                  onChange={() => setDeleteOrTransfer("transfer")}
                  className="accent-cyan-500"
                />
                <h3 className="font-medium text-white">
                  Transfer Organization to a new Owner
                </h3>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="radio"
                  name="org_action"
                  value="delete"
                  checked={deleteOrTransfer === "delete"}
                  onChange={() => setDeleteOrTransfer("delete")}
                  className="accent-red-500"
                />
                Delete the entire Organization permanently
              </label>
            </div>
            
            {deleteOrTransfer === "transfer" && (
              <div className="mt-4 p-4 border border-white/10 bg-black/20 rounded-xl" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm text-slate-400 mb-2">Select a workspace admin to become the new Owner.</p>
                <select
                  value={selectedOwnerId}
                  onChange={(e) => setSelectedOwnerId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 text-white rounded-lg p-3 focus:outline-none focus:border-cyan-400"
                >
                  {eligibleAdmins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.full_name} ({admin.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {deleteOrTransfer === "delete" && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                <p className="text-red-200 text-sm">
                  <span className="font-semibold text-red-400">WARNING:</span> This will permanently delete all workspaces, projects, and users in this organization.
                </p>
              </div>
            )}
          </div>
        )}
      </>
    ) : (
      <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-xl">
        <p className="text-cyan-200 text-sm">
          <span className="font-semibold text-cyan-400">Note:</span> Your account will be removed, but the organization and your projects will remain intact.
        </p>
      </div>
    )}
  </div>
</div>
      <div className="mt-6">
        <input
            type="password"
            placeholder="Confirm with your password to delete"
            value={passwordForDelete}
            onChange={(e) => setPasswordForDelete(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white mb-4"
        />
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
  disabled={!confirmDelete || !allAssigned || !passwordForDelete}
  onClick={() => {
    if (confirmDelete && allAssigned && passwordForDelete) {
      setShowDeleteModal(false);
      setShowFinalDeleteModal(true);
    }
  }}
  className={`px-5 py-2 rounded-lg text-white font-semibold transition ${
    confirmDelete && allAssigned && passwordForDelete
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
{showPhotoModal && (
  <div
  className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]"
  onClick={() => setShowPhotoModal(false)}
>
    <div
  className="relative bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-[380px] p-6"
  onClick={(e) => e.stopPropagation()}
>

      {/* Close Button */}
      <button
        onClick={() => setShowPhotoModal(false)}
        className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
      >
        ✕
      </button>

      {/* Profile Image */}
      <div className="flex flex-col items-center">

        <div className="w-44 h-44 rounded-full overflow-hidden border-2 border-cyan-500 mb-5">

          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-5xl font-bold text-white">
              {userInitial}
            </div>
          )}

        </div>

        <p className="text-slate-300 text-sm mb-6 break-all">
          {userEmail}
        </p>

      </div>

      <div className="border-t border-white/10">

        <button
          onClick={() => {
    setShowPhotoModal(false);
    fileInputRef.current.click();
}}
          className="w-full flex items-center gap-3 px-4 py-4 text-slate-200 hover:bg-white/10"
        >
          <Upload size={20} className="text-cyan-400" />
          Upload from Device
        </button>

        <button
          onClick={startCamera}
          className="w-full flex items-center gap-3 px-4 py-4 text-slate-200 hover:bg-white/10"
        >
          <Camera size={20} className="text-cyan-400" />
          Take Photo
        </button>

        {profileImage && (
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem("token");

                await fetch(
                  `${import.meta.env.VITE_API_URL}/users/me/avatar`,
                  {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

                setProfileImage(null);
                localStorage.removeItem("profileImage");
                setShowPhotoModal(false);
              } catch (err) {
                console.error(err);
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-4 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={20} />
            Remove Photo
          </button>
        )}

      </div>

    </div>
  </div>
)}

{showCamera && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999]">
    <div className="bg-slate-900 rounded-2xl p-6 border border-white/10 w-[420px]">

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full rounded-xl"
      />

      <canvas
        ref={canvasRef}
        className="hidden"
      />

      <div className="flex justify-between mt-5">

        <button
          onClick={stopCamera}
          className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
        >
          Cancel
        </button>

        <button
          onClick={capturePhoto}
          className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white"
        >
          Capture
        </button>

      </div>

    </div>
  </div>
)}

{showCropModal && (
  <ImageCropModal
    image={selectedImage}
    onCancel={() => {
      setShowCropModal(false);
      setSelectedImage(null);
    }}
    onSave={async (croppedImage) => {
      setProfileImage(croppedImage);
      localStorage.setItem("profileImage", croppedImage);

      setShowCropModal(false);
      setShowPhotoModal(false);
      setSelectedImage(null);

      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/users/me/avatar`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              avatar_base64: croppedImage,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();

          const backendHost = import.meta.env.VITE_API_URL
            .replace("/api", "")
            .replace(/\/$/, "");

          const fullUrl = `${backendHost}${data.profile_image}`;

          setProfileImage(fullUrl);
          localStorage.setItem("profileImage", fullUrl);
          window.dispatchEvent(new Event("profileImageUpdated"));
        }
      } catch (err) {
        console.error(err);
      }
    }}
  />
)}
    </MainLayout>
  );
}