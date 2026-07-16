import { useState } from "react";
import { AlertTriangle } from "lucide-react";

const dummyUsers = [
  {
    id: 1,
    name: "Rahul Sharma",
    email: "rahul@gmail.com",
  },
  {
    id: 2,
    name: "Priya Reddy",
    email: "priya@gmail.com",
  },
  {
    id: 3,
    name: "Akansha",
    email: "akansha@gmail.com",
  },
];

export default function DeleteOrganizationModal({
  open,
  onClose,
}) {
  const [selectedUser, setSelectedUser] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#171d31] w-full max-w-lg rounded-xl border border-white/10 p-6"
      >
        <div className="flex items-start gap-4 mb-6">

  <div className="p-3 rounded-full bg-red-500/20">
    <AlertTriangle
      className="text-red-400"
      size={24}
    />
  </div>

  <div>

    <h2 className="text-2xl font-bold text-white">
      Delete Organization
    </h2>

    <p className="text-red-400 mt-2 font-medium">
      This action cannot be undone.
    </p>

    <p className="text-slate-400 mt-2">
      Before deleting your organization, transfer ownership to another member.
    </p>

  </div>

</div>

        <div className="mt-6">
          <label className="block text-slate-300 mb-2">
            Transfer Organization To
          </label>

          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-white"
          >
            <option value="">Select Member</option>

            {dummyUsers.map((user) => (
              <option
                key={user.id}
                value={user.id}
              >
                {user.name}
              </option>
            ))}
          </select>
          <div className="mt-5 flex items-center gap-3">

  <input
    type="checkbox"
    checked={confirmDelete}
    onChange={(e) => setConfirmDelete(e.target.checked)}
    className="w-4 h-4"
  />

  <label className="text-slate-300">
    I understand this action cannot be undone.
  </label>

</div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-white/20 text-white"
          >
            Cancel
          </button>

          <button
            disabled={!selectedUser || !confirmDelete}
            className={`px-5 py-2 rounded-lg text-white ${
              selectedUser
                ? "bg-red-500 hover:bg-red-600"
                : "bg-slate-600 cursor-not-allowed"
            }`}
          >
            Transfer Ownership & Delete
          </button>
        </div>
      </div>
    </div>
  );
}