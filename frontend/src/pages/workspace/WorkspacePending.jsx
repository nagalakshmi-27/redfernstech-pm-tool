import { Building2, Clock3 } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function WorkspacePending() {
  const navigate = useNavigate();
  useEffect(() => {
    const checkAssignment = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.workspaces && data.workspaces.length > 0) {
            navigate("/dashboard");
          }
        }
      } catch (error) {
        console.error("Error checking workspace assignment:", error);
      }
    };

    // Check immediately
    checkAssignment();

    // Poll every 5 seconds
    const interval = setInterval(checkAssignment, 5000);

    return () => clearInterval(interval);
  }, [navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 px-6">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center shadow-xl">

        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10">
          <Building2 className="h-10 w-10 text-cyan-400" />
        </div>

        <h1 className="text-4xl font-bold text-white">
  Welcome to{" "}
  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
    RedFerns Tech
  </span>
</h1>

        <p className="mt-8 text-lg text-slate-300">
          Your account has been created successfully.
        </p>

        <p className="mt-4 text-slate-400 leading-8">
          Please wait while the organization owner adds you to a workspace.
          Once you're assigned, you'll automatically gain access to projects,
          tasks, and collaboration features.
        </p>

        <div className="mt-10 flex justify-center items-center gap-3 text-cyan-400">
          <Clock3 size={22} />
          <span className="font-medium">
            Waiting for workspace assignment...
          </span>
        </div>
      </div>
    </div>
  );
}