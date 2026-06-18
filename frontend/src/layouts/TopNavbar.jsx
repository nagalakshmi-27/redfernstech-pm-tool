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
    <div className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
  <button
    onClick={() => setSidebarOpen(!sidebarOpen)}
    className="md:hidden text-2xl"
  >
    ☰
  </button>

  <input
    type="text"
    placeholder="Search..."
    className="hidden md:block border rounded-lg px-4 py-2 w-80"
  />
</div>

      <div className="flex items-center gap-2 md:gap-4">
        {userEmail && (
  <span className="hidden md:block text-gray-600 text-sm font-medium mr-2">
    {userEmail}
  </span>
)}

        <button
  onClick={() => navigate("/notifications")}
  className="hover:scale-110 transition"
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
    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
      <div className="px-4 py-4 bg-slate-50">
  <p className="text-sm text-gray-500">Signed in as</p>
  <p className="font-semibold text-slate-800 break-all">
    {userEmail}
  </p>
</div>

      <button
  onClick={() => navigate("/settings")}
  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-50 transition"
>
  <Settings size={16} />
  Settings
</button>

<button
  onClick={handleLogout}
  className="w-full flex items-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 transition"
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