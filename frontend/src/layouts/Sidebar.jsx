import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-slate-900 text-white">
      {/* Logo / App Name */}
      <div className="p-5 border-b border-slate-700">
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
              className="block p-2 rounded hover:bg-slate-800"
            >
              Dashboard
            </Link>
          </li>

          <li>
            <Link
              to="/projects"
              className="block p-2 rounded hover:bg-slate-800"
            >
              Projects
            </Link>
          </li>

          <li>
            <Link
              to="/tasks"
              className="block p-2 rounded hover:bg-slate-800"
            >
              My Tasks
            </Link>
          </li>

          <li>
            <Link
              to="/teams"
              className="block p-2 rounded hover:bg-slate-800"
            >
              Teams
            </Link>
          </li>

          <li>
            <Link
              to="/calendar"
              className="block p-2 rounded hover:bg-slate-800"
            >
              Calendar
            </Link>
          </li>

          <li>
            <Link
              to="/notifications"
              className="block p-2 rounded hover:bg-slate-800"
            >
              Notifications
            </Link>
          </li>

          <li>
            <Link
              to="/settings"
              className="block p-2 rounded hover:bg-slate-800"
            >
              Settings
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}