import MainLayout from "../../layouts/MainLayout";

export default function Notifications() {
  const notifications = [
    {
      id: 1,
      message: "New task assigned to you",
      time: "2 hours ago",
    },
    {
      id: 2,
      message: "Project status updated",
      time: "Yesterday",
    },
    {
      id: 3,
      message: "Sprint review scheduled",
      time: "Today",
    },
  ];

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-6">
        Notifications
      </h1>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-white rounded-xl shadow p-4"
          >
            <h3 className="font-semibold">
              🔔 {notification.message}
            </h3>

            <p className="text-gray-500 text-sm">
              {notification.time}
            </p>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}