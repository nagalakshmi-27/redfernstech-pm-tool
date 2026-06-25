import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Bell, Settings, LogOut } from "lucide-react";
export default function TopNavbar({
  sidebarOpen,
  setSidebarOpen,
}) {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail") || "";
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const handleLogout = () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userId");
  window.location.href = "/";
};
  const userInitial = userEmail
    ? userEmail.charAt(0).toUpperCase()
    : "U";

  return (
    <div className="h-16 bg-white/5 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 md:px-6 relative z-50">
      <div className="flex items-center gap-3">
  <button
    onClick={() => setSidebarOpen(!sidebarOpen)}
    className="md:hidden text-2xl text-white"
  >
    ☰
  </button>

  <input
    type="text"
    placeholder="Search..."
    className="hidden md:block bg-black/20 border border-white/10 text-white placeholder-slate-400 rounded-lg px-4 py-2 w-80 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
  />
</div>

      <div className="flex items-center gap-2 md:gap-4">
        {userEmail && (
  <span className="hidden md:block text-slate-300 text-sm font-medium mr-2">
    {userEmail}
  </span>
)}

        <button
  onClick={() => navigate("/notifications")}
  className="hover:scale-110 transition text-slate-300 hover:text-white"
>
  <Bell size={22} />
</button>

        <div className="relative">
  <button
    onClick={() => setShowProfileMenu(!showProfileMenu)}
    className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold"
  >
    {userInitial}
  </button>

  {showProfileMenu && (
    <div className="absolute right-0 mt-3 w-64 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 overflow-hidden z-50">
      <div className="px-4 py-4 bg-white/5 border-b border-white/10">
  <p className="text-sm text-slate-400">Signed in as</p>
  <p className="font-semibold text-slate-100 break-all">
    {userEmail}
  </p>
</div>

      <button
  onClick={() => navigate("/settings")}
  className="w-full flex items-center gap-2 px-4 py-3 text-slate-200 hover:bg-white/10 transition"
>
  <Settings size={16} />
  Settings
</button>

<button
  onClick={handleLogout}
  className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 transition"
>
  <LogOut size={16} />
  Logout
</button>
    </div>
  )}
</div>
      </div>
    </div>
  );
}