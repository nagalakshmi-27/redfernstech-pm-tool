import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">

  {/* Desktop Sidebar */}
  <div className="hidden md:block">
    <Sidebar />
  </div>

  {/* Mobile Sidebar */}
  {sidebarOpen && (
    <div className="fixed inset-0 z-50 flex">
      <div className="w-64 bg-white shadow-lg">
        <Sidebar />
      </div>

      <div
        className="flex-1 bg-black/50"
        onClick={() => setSidebarOpen(false)}
      />
    </div>
  )}

  <div className="flex-1 flex flex-col overflow-hidden">
    <TopNavbar
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    />

    <main className="flex-1 bg-slate-100 p-4 md:p-6 overflow-auto">
      {children}
    </main>
  </div>
</div>
  );
}
