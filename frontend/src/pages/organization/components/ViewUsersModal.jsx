import { useState } from "react";
import { Search, Users } from "lucide-react";

const dummyUsers = [
  {
    id: 1,
    name: "Nagalakshmi",
    email: "nagalakshmi@redfernstech.com",
    role: "Super Admin",
    status: "Active",
  },
  {
    id: 2,
    name: "Rahul",
    email: "rahul@redfernstech.com",
    role: "Member",
    status: "Active",
  },
  {
    id: 3,
    name: "Priya",
    email: "priya@redfernstech.com",
    role: "Member",
    status: "Invited",
  },
  {
    id: 4,
    name: "John",
    email: "john@redfernstech.com",
    role: "Member",
    status: "Active",
  },
  {
    id: 5,
    name: "Alex",
    email: "alex@redfernstech.com",
    role: "Member",
    status: "Invited",
  },
  {
    id: 6,
    name: "Akansha",
    email: "akansha@redfernstech.com",
    role: "Member",
    status: "Active",
  },
  {
    id: 7,
    name: "Keerthi",
    email: "keerthi@redfernstech.com",
    role: "Member",
    status: "Active",
  },
];

export default function ViewUsersModal({ open, onClose }) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  if (!open) return null;

  const filteredUsers = dummyUsers.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  const usersToShow = showAll
    ? filteredUsers
    : filteredUsers.slice(0, 5);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#171d31] p-6"
      >
        <h2 className="text-2xl font-bold text-white mb-6">
          View Users
        </h2>

        <div className="relative mb-6">
          <Search
            size={18}
            className="absolute left-3 top-3.5 text-slate-400"
          />

          <input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-white"
          />
        </div>

        <div className="space-y-3">
  {usersToShow.map((user) => (
    <div
      key={user.id}
      className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-4"
    >
      <div className="flex items-center gap-3">
        <Users size={20} className="text-cyan-400" />

        <div>
          <p className="text-white font-semibold">
            {user.name}
          </p>

          <p className="text-slate-400 text-sm">
            {user.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">

        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.role === "Super Admin"
              ? "bg-purple-500/20 text-purple-300"
              : "bg-cyan-500/20 text-cyan-300"
          }`}
        >
          {user.role}
        </span>

        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.status === "Active"
              ? "bg-green-500/20 text-green-300"
              : "bg-yellow-500/20 text-yellow-300"
          }`}
        >
          {user.status}
        </span>

      </div>
    </div>
  ))}
</div>

        {filteredUsers.length > 5 && (
          <div className="mt-5 flex justify-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-cyan-400 hover:text-cyan-300"
            >
              {showAll ? "Show Less" : "Show More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}