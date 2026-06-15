import { useNavigate } from "react-router-dom";
export default function TopNavbar() {
  const navigate = useNavigate();
  return (
    <div className="h-16 bg-white border-b flex items-center justify-between px-6">
      <input
        type="text"
        placeholder="Search..."
        className="border rounded-lg px-4 py-2 w-80"
      />

      <div className="flex items-center gap-4">
  <button
  onClick={() => navigate("/notifications")}
  className="text-xl"
>
  🔔
</button>

  <button
    onClick={() => {
      localStorage.removeItem("isLoggedIn");
      window.location.href = "/";
    }}
    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
  >
    Logout
  </button>

  <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center">
    N
  </div>
</div>
    </div>
  );
}