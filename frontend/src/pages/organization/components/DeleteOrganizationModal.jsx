import { useState, useEffect, useContext } from "react";
import AppContext from "../../../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function DeleteOrganizationModal({
  open,
  onClose,
}) {
  const [transferFirst, setTransferFirst] = useState(false);
  const [selectedMember, setSelectedMember] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useContext(AppContext);
  const navigate = useNavigate();

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

  const handleDelete = async () => {
    setLoading(true);
    try {
      if (transferFirst && selectedMember) {
        // Transfer ownership first
        const transferRes = await fetch(`${import.meta.env.VITE_API_URL}/users/me/transfer-organization`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ new_owner_id: parseInt(selectedMember), password })
        });
        if (!transferRes.ok) {
          const err = await transferRes.json();
          alert(err.detail || "Failed to transfer ownership");
          setLoading(false);
          return;
        }
      }

      // Delete account
      const deleteRes = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ password })
      });
      if (deleteRes.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("activeWorkspaceId");
        window.location.href = "/";
      } else {
        const err = await deleteRes.json();
        alert(err.detail || "Failed to delete organization");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting organization");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const canDelete =
    password &&
    agree &&
    (!transferFirst || selectedMember);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">

      <div className="bg-[#171d31] w-full max-w-2xl rounded-xl border border-white/10 p-8">

        <h2 className="text-3xl font-bold text-red-400">
          Delete Organization
        </h2>

        <p className="text-red-300 mt-3 font-medium">
          This action cannot be undone.
        </p>

        <p className="text-slate-400 mt-5 leading-8">
          Deleting this organization will permanently delete all workspaces, projects, tasks, members, and organization data. This action cannot be undone.
        </p>
        <div className="mt-8 flex items-center gap-3">

  <input
    type="checkbox"
    checked={transferFirst}
    onChange={(e) => setTransferFirst(e.target.checked)}
  />

  <label className="text-slate-300">
    Transfer ownership before deleting
  </label>

</div>
{transferFirst && (

<div className="mt-6">
  <div className="mt-6 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
  <p className="text-cyan-300 text-sm leading-7">
    Ownership will first be transferred to the selected member before the organization is permanently deleted.
  </p>
</div>

<label className="block text-slate-300 mb-2">
Transfer Ownership To
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

)}
<div className="mt-6">

<label className="block text-slate-300 mb-2">
Enter your password to continue
</label>

<input
type="password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
placeholder="Your password"
className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none"
/>

</div>
<div className="flex items-center gap-3 mt-6">

<input
type="checkbox"
checked={agree}
onChange={(e)=>setAgree(e.target.checked)}
/>

<p className="text-slate-300">
I understand this action cannot be undone.
</p>

</div>
<div className="flex justify-end gap-4 mt-10">

<button
onClick={onClose}
className="px-6 py-3 rounded-lg border border-white/20 text-white"
>
Back
</button>

<button
disabled={!canDelete || loading}
onClick={handleDelete}
className={`px-6 py-3 rounded-lg text-white ${
canDelete
? "bg-red-500 hover:bg-red-600"
: "bg-slate-600 cursor-not-allowed"
}`}
>
{loading ? "Deleting..." : "Delete Organization"}
</button>

</div>

</div>

</div>

);
}