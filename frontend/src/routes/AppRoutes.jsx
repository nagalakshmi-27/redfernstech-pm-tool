import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ResetPassword from "../pages/auth/ResetPassword";
import ForgotPassword from "../pages/auth/ForgotPassword";
import AcceptInvite from "../pages/auth/AcceptInvite";
import VerifyAccount from "../pages/auth/VerifyAccount";
import Dashboard from "../pages/dashboard/Dashboard";
import Projects from "../pages/projects/Projects";
import ProjectWorkspace from "../pages/projects/ProjectWorkspace";
import Tasks from "../pages/tasks/Tasks";
import Teams from "../pages/teams/Teams";
import Calendar from "../pages/calendar/Calender";
import Notifications from "../pages/notifications/Notifications";
import Settings from "../pages/settings/Settings";
import Reports from "../pages/reports/Reports";
import Notebook from "../pages/notebook/Notebook";
import Integrations from "../pages/integrations/Integrations";
import ProtectedRoute from "./ProtectedRoute";
import CheckEmail from "../pages/auth/CheckEmail";
import VerifyOTP from "../pages/auth/VerifyOTP";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="/verify-account" element={<VerifyAccount />} />
        <Route path="/check-email" element={<CheckEmail />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectWorkspace />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notebook" element={<Notebook />} />
      </Routes>
    </BrowserRouter>
  );
}