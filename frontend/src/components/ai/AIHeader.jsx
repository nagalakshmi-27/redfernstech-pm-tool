import {
  Sparkles,
  X,
  Menu,
} from "lucide-react";

export default function AIHeader({
  onClose,
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  return (
    <div
  className={`
    flex
    items-center
    justify-between
    border-b
    border-white/10
    bg-white/[0.02]
    transition-all
    duration-300

    py-3 sm:py-4 lg:py-5
    ${isSidebarOpen ? "px-4 sm:px-6 lg:px-8" : "px-3 sm:px-4"}
  `}
>
      <div className="flex flex-1 items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">

  {!isSidebarOpen && (
    <button
  onClick={() => setIsSidebarOpen(true)}
  className="
  mr-1
  sm:mr-2
  flex
  h-9
  w-9
  sm:h-10
  sm:w-10
    items-center
    justify-center
    rounded-lg
    text-slate-400
    transition-all
    duration-300
    hover:bg-white/5
    hover:text-white
  "
>
      <Menu size={20} />
    </button>
  )}

        <div className="flex h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 items-center justify-center rounded-xl lg:rounded-2xl border border-cyan-500/20 bg-cyan-500/10 shrink-0">
          <Sparkles size={22} className="text-cyan-400" />
        </div>

        <div>
          <h2 className="truncate text-base sm:text-lg lg:text-xl font-semibold text-white">
            Workspace AI
          </h2>

          <p className="hidden sm:block truncate text-xs lg:text-sm text-slate-400">
            Intelligent assistant for project management
          </p>
        </div>

      </div>

      <button
        onClick={onClose}
        className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
      >
        <X size={20} className="text-slate-300" />
      </button>
    </div>
  );
}