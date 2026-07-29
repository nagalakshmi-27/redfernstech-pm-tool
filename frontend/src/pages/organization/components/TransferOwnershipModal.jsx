import { useState, useEffect, useContext } from "react";
import AppContext from "../../../context/AppContext";

export default function TransferOwnershipModal({
  open,
  onClose,
}) {
  const [selectedMember, setSelectedMember] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { currentUser, fetchCurrentUser, fetchWorkspaces } = useContext(AppContext);

  useEffect(() => {
    if (open) {
      setPassword("");
      setAgree(false);
      fetch(`${import.meta.env.VITE_API_URL}/users/teammates`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
      .then(res => res.json())
      .then(data => {
        setUsers(data.filter(u => u.id !== currentUser?.id));
      })
      .catch(err => console.error(err));
    }
  }, [open, currentUser]);

  const handleTransfer = async () => {
    if (!selectedMember || !password) return;
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me/transfer-organization`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ new_owner_id: parseInt(selectedMember), password })
      });
      if (response.ok) {
        await fetchCurrentUser();
        await fetchWorkspaces();
        window.location.reload();
      } else {
        const err = await response.json();
        alert(err.detail || "Failed to transfer ownership");
      }
    } catch (err) {
      console.error(err);
      alert("Error transferring ownership");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const canTransfer =
    selectedMember &&
    password &&
    agree;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">

      <div className="bg-[#171d31] w-full max-w-xl rounded-xl border border-white/10 p-8">

        <h2 className="text-3xl font-bold text-white">
          Transfer Ownership
        </h2>

        <p className="text-slate-400 mt-4 leading-8">
          Transfer ownership of this organization to another member.
          The selected member will become the new Owner and you will
          no longer have ownership privileges.
        </p>

        <div className="mt-6 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
  <p className="text-cyan-300 text-sm leading-6">
    After confirming the transfer, the selected member will become the new
    <strong> Owner</strong>. You will lose all owner privileges for this organization.
  </p>
</div>

        {/* Member */}

        <div className="mt-8">

          <label className="block text-slate-300 mb-2">
            Select New Owner
          </label>

          <div className="relative">
  <select
    value={selectedMember}
    onChange={(e) => setSelectedMember(e.target.value)}
    className="w-full appearance-none rounded-lg border border-white/10 bg-[#161b2e] px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
  >
    <option value="" className="bg-[#161b2e] text-white">
      Select Member
    </option>
    {users.map(user => (
      <option key={user.id} value={user.id} className="bg-[#161b2e] text-white">
        {user.full_name || user.email}
      </option>
    ))}
  </select>

  <svg
    className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
</div>

        </div>

        {/* Confirm */}

        <div className="mt-6">

          <label className="block text-slate-300 mb-2">
            Enter your password to confirm
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none"
          />

        </div>

        {/* Checkbox */}

        <div className="flex items-center gap-3 mt-6">

          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />

          <p className="text-slate-300">
            I understand ownership will be transferred permanently.
          </p>

        </div>

        {/* Buttons */}

        <div className="flex justify-end gap-4 mt-10">

          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg border border-white/20 text-white"
          >
            Back
          </button>

          <button
            disabled={!canTransfer || loading}
            onClick={handleTransfer}
            className={`px-6 py-3 rounded-lg text-white ${
              canTransfer
                ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                : "bg-slate-600 cursor-not-allowed"
            }`}
          >
            {loading ? "Transferring..." : "Transfer Ownership"}
          </button>

        </div>

      </div>

    </div>
  );
}