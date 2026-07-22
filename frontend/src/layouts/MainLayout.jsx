import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden text-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950">

  {/* Desktop Sidebar */}
  <div className="hidden md:block">
    <Sidebar />
  </div>

  {/* Mobile Sidebar */}
  {sidebarOpen && (
    <div className="fixed inset-0 z-[9999] flex">
      <div className="w-56 h-screen bg-slate-900/95 backdrop-blur-xl shadow-2xl border-r border-white/10">
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

    <main className="flex-1 p-4 md:p-6 overflow-auto">
      {children}
    </main>
  </div>
</div>
  );
}
