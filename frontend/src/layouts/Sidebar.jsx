import { Link } from "react-router-dom";

export default function Sidebar() {
  const currentUserRole = localStorage.getItem("userRole");
  return (
    <div className="w-56 min-h-screen bg-white/5 backdrop-blur-lg border-r border-white/10 text-white flex flex-col">
      {/* Logo / App Name */}
      <div className="h-16 px-5 border-b border-white/10 flex items-center">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
          RedFerns PM
        </h1>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4">
        <ul className="space-y-4">
          <li>
            <Link
              to="/dashboard"
              className="block px-4 py-3 rounded-lg hover:bg-white/10 transition"
            >
              Dashboard
            </Link>
          </li>

          <li>
            <Link
              to="/projects"
              className="block px-4 py-3 rounded-lg hover:bg-white/10 transition"
            >
              Projects
            </Link>
          </li>

          {currentUserRole !== "Client" && (
            <>
              <li>
                <Link
                  to="/tasks"
                  className="block px-4 py-3 rounded-lg hover:bg-white/10 transition"
                >
                  My Tasks
                </Link>
              </li>

              <li>
                <Link
                  to="/teams"
                  className="block px-4 py-3 rounded-lg hover:bg-white/10 transition"
                >
                  Teams
                </Link>
              </li>
            </>
          )}

          <li>
            <Link
              to="/calendar"
              className="block px-4 py-3 rounded-lg hover:bg-white/10 transition"
            >
              Calendar
            </Link>
          </li>

          <li>
            <Link
              to="/notifications"
              className="block px-4 py-3 rounded-lg hover:bg-white/10 transition"
            >
              Notifications
            </Link>
          </li>

          <li>
  <Link
    to="/reports"
    className="block px-4 py-3 rounded-lg hover:bg-white/10 transition"
  >
    Reports & Analytics
  </Link>
</li>

          <li>
            <Link
              to="/settings"
              className="block px-4 py-3 rounded-lg hover:bg-white/10 transition"
            >
              Settings
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}