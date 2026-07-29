import { Sparkles } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="mt-6 sm:mt-8 flex items-start gap-2 sm:gap-3 lg:gap-4">
      {/* AI Avatar */}
      <div className="flex h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10">
        <Sparkles className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-cyan-400" />
      </div>

      {/* Typing Animation */}
      <div className="rounded-2xl lg:rounded-3xl border border-white/10 bg-white/[0.03] px-3 sm:px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce"></span>

          <span
            className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></span>

          <span
            className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></span>
        </div>
      </div>
    </div>
  );
}