import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <TopNavbar />

        <main className="flex-1 bg-slate-100 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
