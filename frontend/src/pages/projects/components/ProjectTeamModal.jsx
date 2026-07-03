import { X, Mail, Briefcase } from "lucide-react";

export default function ProjectTeamModal({ open, onClose, members }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#171d33] p-6 shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Project Team</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={22} />
          </button>
        </div>

        {/* Roster */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {members.length === 0 && <p className="text-slate-400">No team members found.</p>}
          {members.map(member => (
            <div 
              key={member.id} 
              className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10"
            >
              {member.profile_image ? (
                <img src={member.profile_image.startsWith('http') ? member.profile_image : `${import.meta.env.VITE_API_URL}${member.profile_image}`} alt="Profile" className="w-12 h-12 rounded-full object-cover shadow-[0_0_10px_rgba(6,182,212,0.3)]" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white text-lg font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  {(member.full_name || member.name || member.email)[0].toUpperCase()}
                </div>
              )}
              <div className="flex flex-col flex-1 min-w-0">
                <p className="font-bold text-white truncate">{member.full_name || member.name || member.email}</p>
                
                <div className="flex items-center gap-2 mt-1">
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                    <Briefcase size={12} />
                    <span className="truncate">{member.role === "Client" ? "Client" : (member.company_role || "Member")}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
                  <Mail size={12} />
                  <a href={`mailto:${member.email}`} className="truncate hover:text-cyan-400 transition">{member.email}</a>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
