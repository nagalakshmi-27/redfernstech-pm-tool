import { Sparkles } from "lucide-react";
import {
  FolderPlus,
  ListTodo,
  BarChart3,
  UserCheck,
} from "lucide-react";

export default function ConversationPanel({
  setPrompt,
}) {
  return (
<div className="flex min-h-full flex-col items-center px-4 sm:px-6 lg:px-10 py-5 sm:py-6 lg:py-8">
      {/* AI Icon */}
      <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
        <Sparkles
  className="h-8 w-8 sm:h-10 sm:w-10 lg:h-[42px] lg:w-[42px] text-cyan-400"
/>
      </div>

      {/* Title */}
      <h1 className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
        What would you like to build today?
      </h1>

      {/* Subtitle */}
      <p className="mt-2 max-w-2xl text-center text-sm sm:text-base leading-6 text-slate-400">
        Workspace AI can create projects, generate tasks,
        answer workspace questions and help you manage
        your projects faster.
      </p>

      {/* Suggestions */}

      <div className="mt-5 w-full max-w-5xl">

  <p className="mb-5 sm:mb-6 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-slate-500">
    POPULAR PROMPTS
  </p>

  <div className="grid gap-4 sm:gap-5 md:grid-cols-2">

    <button
  onClick={() =>
    setPrompt("Create a Project Management Tool")
  }
  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.05]"
>
  <div className="flex items-start gap-4">

    <FolderPlus className="mt-1 h-6 w-6 text-cyan-400 shrink-0" />

    <div>
      <h3 className="text-base sm:text-lg font-semibold text-white">
        Create Project
      </h3>

      <p className="mt-1 text-sm leading-6 text-slate-400">
        Create a complete project with modules,
        milestones and workflow.
      </p>
    </div>

  </div>
</button>

    <button
  onClick={() =>
    setPrompt("Generate Login Module Tasks")
  }
  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.05]"
>
  <div className="flex items-start gap-4">

    <ListTodo className="mt-1 h-6 w-6 text-cyan-400 shrink-0" />

    <div>
      <h3 className="text-base sm:text-lg font-semibold text-white">
        Generate Tasks
      </h3>

      <p className="mt-1 text-sm leading-6 text-slate-400">
        Convert requirements into structured
        development tasks.
      </p>
    </div>

  </div>
</button>

    <button
  onClick={() =>
    setPrompt("Show Project Health")
  }
  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.05]"
>
  <div className="flex items-start gap-4">

    <BarChart3 className="mt-1 h-6 w-6 text-cyan-400 shrink-0" />

    <div>
      <h3 className="text-base sm:text-lg font-semibold text-white">
        Project Status
      </h3>

      <p className="mt-1 text-sm leading-6 text-slate-400">
        Review project progress,
        blockers and overall health.
      </p>
    </div>

  </div>
</button>

    <button
  onClick={() =>
    setPrompt("What are my pending tasks?")
  }
  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.05]"
>
  <div className="flex items-start gap-4">

    <UserCheck className="mt-1 h-6 w-6 text-cyan-400 shrink-0" />

    <div>
      <h3 className="text-base sm:text-lg font-semibold text-white">
        My Tasks
      </h3>

      <p className="mt-1 text-sm leading-6 text-slate-400">
        View your assigned work
        with AI-powered insights.
      </p>
    </div>

  </div>
</button>

  </div>

</div>

    </div>
  );
}