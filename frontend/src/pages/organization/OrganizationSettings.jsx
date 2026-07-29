import { useState, useEffect, useContext } from "react";
import MainLayout from "../../layouts/MainLayout";
import AppContext from "../../context/AppContext";
import CreateUserModal from "./components/CreateUserModal";
import ViewUsersModal from "./components/ViewUsersModal";
import DeleteTransferModal from "./components/DeleteTransferModal";
import TransferOwnershipModal from "./components/TransferOwnershipModal";
import DeleteOrganizationModal from "./components/DeleteOrganizationModal";

import { Navigate } from "react-router-dom";

export default function OrganizationSettings() {
  const { activeWorkspaceRole, currentUser, fetchCurrentUser } = useContext(AppContext);

  // If currentUser is loaded and they are not an owner, redirect them
  if (currentUser && !currentUser.is_owner) {
    return <Navigate to="/dashboard" replace />;
  }

  const currentUserRole = currentUser?.is_owner
    ? "Owner"
    : activeWorkspaceRole;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [message, setMessage] = useState("");
const [showCreateUserModal, setShowCreateUserModal] = useState(false);
const [showViewUsersModal, setShowViewUsersModal] = useState(false);
const [showDeleteTransferModal, setShowDeleteTransferModal] = useState(false);
const [showTransferOwnershipModal, setShowTransferOwnershipModal] = useState(false);
const [showDeleteOrganizationModal, setShowDeleteOrganizationModal] = useState(false);

  useEffect(() => {
    const fetchMyData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/users/me`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();

          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setEmail(data.email || "");
          setOrganizationName(
            data.organization_name || "RedFerns Tech"
          );
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };

    fetchMyData();
  }, [currentUser]);

  const handleSave = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            organization_name: organizationName,
          }),
        }
      );

      if (response.ok) {
        await fetchCurrentUser();
        setMessage("Settings saved successfully!");
      } else {
        setMessage("Failed to save settings.");
      }

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage("Failed to save settings.");
    }
  };

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold text-white mb-8">
        Organization Settings
      </h1>

      <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 space-y-6">

        {message && (
          <div
            className={`rounded-lg p-3 ${
              message.toLowerCase().includes("success")
                ? "bg-green-500/20 border border-green-500/30 text-green-300"
                : "bg-red-500/20 border border-red-500/30 text-red-300"
            }`}
          >
            {message}
          </div>
        )}

        <div>
          <label className="block text-slate-300 mb-2 font-medium">
            Organization Name
          </label>

          <input
            type="text"
            value={organizationName}
            readOnly
            className="w-full md:w-2/3 p-3 rounded-lg bg-white/5 border border-white/10 text-slate-300 cursor-not-allowed"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-5 md:w-2/3">
          <div>
            <label className="block text-slate-300 mb-2 font-medium">
              First Name
            </label>

            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-2 font-medium">
              Last Name
            </label>

            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 mb-2 font-medium">
            Email
          </label>

          <input
            value={email}
            readOnly
            className="w-full md:w-2/3 p-3 rounded-lg bg-white/5 border border-white/10 text-slate-300 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-slate-300 mb-2 font-medium">
            User Type
          </label>

          <input
            value={currentUserRole || "Loading..."}
            readOnly
            className="w-full md:w-2/3 p-3 rounded-lg bg-white/5 border border-white/10 text-slate-300 cursor-not-allowed"
          />
        </div>

        <div className="pt-6 flex flex-wrap gap-4">

  <button
  onClick={() => {
    setShowCreateUserModal(true);
  }}
  className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition"
>
  Create User
</button>

  <button
  onClick={() => setShowViewUsersModal(true)}
  className="px-6 py-3 rounded-lg border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 transition"
>
  View Users
</button>

  <button
  onClick={() => setShowDeleteTransferModal(true)}
  className="px-6 py-3 rounded-lg border border-red-500 text-red-400 hover:bg-red-500/10 transition"
>
  Delete / Transfer Organization
</button>

</div>

<div className="pt-6">
  <button
    onClick={handleSave}
    className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition"
  >
    Save Changes
  </button>
</div>

   </div>

      <CreateUserModal
  open={showCreateUserModal}
  onClose={() => setShowCreateUserModal(false)}
/>
<ViewUsersModal
  open={showViewUsersModal}
  onClose={() => setShowViewUsersModal(false)}
/>
<DeleteTransferModal
  open={showDeleteTransferModal}
  onClose={() => setShowDeleteTransferModal(false)}
  onTransfer={() => {
    setShowDeleteTransferModal(false);
    setShowTransferOwnershipModal(true);
  }}
  onDelete={() => {
    setShowDeleteTransferModal(false);
    setShowDeleteOrganizationModal(true);
  }}
/>

<TransferOwnershipModal
  open={showTransferOwnershipModal}
  onClose={() => setShowTransferOwnershipModal(false)}
/>

<DeleteOrganizationModal
  open={showDeleteOrganizationModal}
  onClose={() => setShowDeleteOrganizationModal(false)}
/>
    </MainLayout>
  );
}