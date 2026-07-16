import { useState, useEffect } from "react";
import { Search, Users } from "lucide-react";

export default function ViewUsersModal({ open, onClose }) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [networkUsers, setNetworkUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch(`${import.meta.env.VITE_API_URL}/users/teammates`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
      .then(res => res.json())
      .then(data => {
        setNetworkUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch organization users", err);
        setLoading(false);
      });
    }
  }, [open]);

  if (!open) return null;

  const filteredUsers = networkUsers.filter((user) =>
    (user.full_name || user.email).toLowerCase().includes(search.toLowerCase())
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
          {loading ? (
            <div className="text-center text-slate-400 py-4">Loading users...</div>
          ) : usersToShow.length === 0 ? (
            <div className="text-center text-slate-400 py-4">No users found.</div>
          ) : (
            usersToShow.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-center gap-3">
                  {user.profile_image ? (
                    <img src={user.profile_image.startsWith('http') ? user.profile_image : `${import.meta.env.VITE_API_URL}${user.profile_image}`} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center justify-center font-bold uppercase">
                      {(user.full_name || user.email).charAt(0)}
                    </div>
                  )}

                  <div>
                    <p className="text-white font-semibold">
                      {user.full_name || user.email.split('@')[0]}
                    </p>

                    <p className="text-slate-400 text-sm">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === "Super Admin" || user.role === "Owner"
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-cyan-500/20 text-cyan-300"
                    }`}
                  >
                    {user.role}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300`}
                  >
                    Active
                  </span>
                </div>
              </div>
            ))
          )}
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