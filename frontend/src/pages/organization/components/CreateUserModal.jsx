import { useState } from "react";

export default function CreateUserModal({
  open,
  onClose,
}) {

    const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [email, setEmail] = useState("");
const [role, setRole] = useState("member");
const handleCreateUser = () => {
  if (!firstName || !lastName || !email) return;

  alert("User created successfully.");

  setFirstName("");
  setLastName("");
  setEmail("");
  setRole("member");

  onClose();
};
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#171d31] w-full max-w-md rounded-xl border border-white/10 p-6">

        <h2 className="text-2xl font-bold text-white mb-6">
          Create User
        </h2>

        <div className="space-y-4">

          <div>
            <label className="block text-slate-300 mb-2">
  First Name <span className="text-red-400">*</span>
</label>

            <input
  type="text"
  value={firstName}
  onChange={(e) => setFirstName(e.target.value)}
  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
/>
          </div>

          <div>
            <label className="block text-slate-300 mb-2">
  Last Name <span className="text-red-400">*</span>
</label>

            <input
  type="text"
  value={lastName}
  onChange={(e) => setLastName(e.target.value)}
  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
/>
</div>

          <div>
            <label className="block text-slate-300 mb-2">
  Email <span className="text-red-400">*</span>
</label>

            <input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
/>
          </div>

          <div>
            <label className="block text-slate-300 mb-2">
              Role
            </label>

            <select
  value={role}
  onChange={(e) => setRole(e.target.value)}
  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
>
  <option value="member">Member</option>
</select>
          </div>

        </div>

        <div className="flex justify-end gap-3 mt-8">

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-white/20 text-white"
          >
            Cancel
          </button>

          <button
  onClick={handleCreateUser}
  disabled={!firstName || !lastName || !email}
  className={`px-5 py-2 rounded-lg text-white transition ${
    !firstName || !lastName || !email
      ? "bg-slate-600 cursor-not-allowed"
      : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90"
  }`}
>
  Create User
</button>

        </div>

      </div>
    </div>
  );
}