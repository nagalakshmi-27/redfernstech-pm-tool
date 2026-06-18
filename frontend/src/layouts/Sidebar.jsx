import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 min-h-screen bg-slate-900 text-white">
      {/* Logo / App Name */}
      <div className="p-5 border-b border-slate-700 flex items-center">
        <h1 className="text-2xl font-bold">
          RedFerns PM
        </h1>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4">
        <ul className="space-y-4">
          <li>
            <Link
              to="/dashboard"
              className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition"
            >
              Dashboard
            </Link>
          </li>

          <li>
            <Link
              to="/projects"
              className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition"
            >
              Projects
            </Link>
          </li>

          <li>
            <Link
              to="/tasks"
              className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition"
            >
              My Tasks
            </Link>
          </li>

          <li>
            <Link
              to="/teams"
              className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition"
            >
              Teams
            </Link>
          </li>

          <li>
            <Link
              to="/calendar"
              className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition"
            >
              Calendar
            </Link>
          </li>

          <li>
            <Link
              to="/notifications"
              className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition"
            >
              Notifications
            </Link>
          </li>

          <li>
            <Link
              to="/settings"
              className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition"
            >
              Settings
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}