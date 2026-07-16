import { Building2, Clock3 } from "lucide-react";

export default function WorkspacePending() {
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