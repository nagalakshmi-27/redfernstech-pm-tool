import { useState } from "react";

export default function CreateUserModal({
  open,
  onClose,
}) {

    const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [email, setEmail] = useState("");
const [role, setRole] = useState("member");
const [loading, setLoading] = useState(false);

const handleCreateUser = async () => {
  if (!email) {
    alert("Please provide an email address");
    return;
  }
  
  setLoading(true);
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/users/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email: email,
        is_owner: false,
        workspace_access: role,
        workspace_id: null
      })
    });
    
    if (response.ok) {
      alert("User invited successfully!");
      setFirstName("");
      setLastName("");
      setEmail("");
      setRole("member");
      onClose();
    } else {
      const err = await response.json();
      alert("Failed to invite user: " + err.detail);
    }
  } catch (error) {
    console.error("Error inviting user:", error);
    alert("An error occurred. Please try again.");
  } finally {
    setLoading(false);
  }
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
  First Name <span className="text-slate-500 text-sm font-normal">(Optional)</span>
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
  Last Name <span className="text-slate-500 text-sm font-normal">(Optional)</span>
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
            disabled={loading || !email}
            className={`px-5 py-2 rounded-lg text-white font-medium ${
              (loading || !email) ? "bg-slate-600 cursor-not-allowed" : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90"
            }`}
          >
            {loading ? "Inviting..." : "Create User"}
          </button>

        </div>

      </div>
    </div>
  );
}