import MainLayout from "../../layouts/MainLayout";
import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";

export default function Notifications() {
  const [dbNotifications, setDbNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setDbNotifications(data);
        }
      } catch (err) {
        console.error("Failed to fetch notifications");
      }
    };
    fetchNotifications();
  }, []);

  return (
    <MainLayout>
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white">
        Notifications
      </h1>

      <div className="space-y-4 max-w-4xl">
        {dbNotifications.length > 0 ? (
  dbNotifications.slice(0, 10).map((activity, index) => (
    <div
      key={activity.id || index}
      className="bg-white/5 backdrop-blur-md rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 p-4 md:p-5"
    >
      <div className="flex items-start gap-3">
  <Bell
    size={20}
    className="text-cyan-400 mt-0.5 flex-shrink-0"
  />

  <h3 className="font-semibold break-words text-sm md:text-base text-white">
    {activity.message}
  </h3>
</div>
    </div>
  ))
) : (
  <div className="bg-white/5 backdrop-blur-md rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/10 p-6 flex items-center gap-3 text-slate-300">
  <BellOff size={22} className="text-slate-400" />
  <span>No Notifications Yet</span>
</div>
)}
      </div>
    </MainLayout>
  );
}