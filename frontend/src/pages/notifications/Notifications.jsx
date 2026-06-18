import MainLayout from "../../layouts/MainLayout";
import { useContext } from "react";
import AppContext from "../../context/AppContext";

export default function Notifications() {
  const { activities } = useContext(AppContext);

  return (
    <MainLayout>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">
        Notifications
      </h1>

      <div className="space-y-4 max-w-4xl">
        {activities.length > 0 ? (
  activities.map((activity, index) => (
    <div
      key={index}
      className="bg-white rounded-xl shadow p-4 md:p-5"
    >
      <h3 className="font-semibold break-words text-sm md:text-base">
        🔔 {activity}
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