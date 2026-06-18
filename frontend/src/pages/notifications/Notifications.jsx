import MainLayout from "../../layouts/MainLayout";
import { useState, useEffect } from "react";

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
      <h1 className="text-2xl md:text-3xl font-bold mb-6">
        Notifications
      </h1>

      <div className="space-y-4 max-w-4xl">
        {dbNotifications.length > 0 ? (
  dbNotifications.slice(0, 10).map((activity, index) => (
    <div
      key={activity.id || index}
      className="bg-white rounded-xl shadow p-4 md:p-5"
    >
      <h3 className="font-semibold break-words text-sm md:text-base">
        🔔 {activity.message}
      </h3>
    </div>
  ))
) : (
  <div className="bg-white rounded-xl shadow p-4 md:p-5">
    No Notifications Yet
  </div>
)}
      </div>
    </MainLayout>
  );
}