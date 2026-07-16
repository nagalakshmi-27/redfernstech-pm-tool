import { Building2 } from "lucide-react";
import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreateWorkspaceModal from "../../components/CreateWorkspaceModal";
import AppContext from "../../context/AppContext";

export default function Organization() {
  const { currentUser, fetchCurrentUser } = useContext(AppContext);
  
  useEffect(() => {
    if (!currentUser && fetchCurrentUser) {
      fetchCurrentUser();
    }
  }, [currentUser, fetchCurrentUser]);

  const organizationName = currentUser?.organization_name || "Loading...";
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 px-6">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl p-12">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/15 border border-cyan-500/20">
            <Building2 className="h-10 w-10 text-cyan-400" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="mt-8 text-center text-4xl font-bold text-white">
          Welcome to your organization
        </h1>

        {/* Organization Name */}
        <h2 className="mt-3 text-center text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
          {organizationName}
        </h2>

        {/* Status */}
        <p className="mt-8 text-center text-lg font-medium text-slate-300">
          Your organization is ready.
        </p>

        {/* Description */}
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-400 leading-7">
          Create your first workspace to start managing projects,
          tasks, and your team members.
        </p>

        {/* Button */}
        <div className="mt-10 flex justify-center">
          <button
  onClick={() => setShowCreateModal(true)}
  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-[0_0_25px_rgba(6,182,212,0.45)]"
>
  Create Workspace
</button>
        </div>

      </div>
      <CreateWorkspaceModal
  open={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  onSuccess={() => {
    navigate("/dashboard");
    // We'll redirect in the next step
  }}
/>
    </div>
    
  );
}