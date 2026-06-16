import { useEffect, useState } from "react";

export default function TopNavbar() {
  // These were missing!
  const [userInitial, setUserInitial] = useState("U");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
      setUserInitial(email.charAt(0).toUpperCase());
    }
  }, []);

  return (
    <div className="h-16 bg-white border-b flex items-center justify-between px-6">
      <input
        type="text"
        placeholder="Search..."
        className="border rounded-lg px-4 py-2 w-80"
      />

      <div className="flex items-center gap-4">
        {userEmail && <span className="text-gray-600 text-sm font-medium mr-2">{userEmail}</span>}
        
        <button className="text-xl">🔔</button>

        <button
          onClick={() => {
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("token");
            localStorage.removeItem("userEmail");
            window.location.href = "/";
          }}
          className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>

        <div 
          className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold" 
          title={userEmail}
        >
          {userInitial}
        </div>
      </div>
    </div>
  );
}