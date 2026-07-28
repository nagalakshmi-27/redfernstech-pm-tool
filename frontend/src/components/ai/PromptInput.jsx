import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

export default function PromptInput({
  prompt,
  setPrompt,
  onGenerate,
  isTyping,
  selectedModel,
  setSelectedModel,
}) {
    const textareaRef = useRef(null);
    useEffect(() => {
  const textarea = textareaRef.current;

  if (!textarea) return;

  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
}, [prompt]);
  return (
<div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">

      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <label className="block text-xs sm:text-sm font-semibold text-slate-300">
          Ask Workspace AI
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel && setSelectedModel(e.target.value)}
          className="text-xs bg-[#1e293b] border border-white/10 rounded-lg px-2 py-1 text-slate-300 outline-none focus:border-cyan-500/50"
        >
          <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
          <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
        </select>
      </div>

      <div
        className="
  flex
  items-end
  rounded-2xl
  sm:rounded-3xl
          border
          border-white/10
          bg-white/[0.03]
          p-1.5
          transition-all
          duration-300
          focus-within:border-cyan-400/40
          focus-within:shadow-[0_0_30px_rgba(34,211,238,0.15)]
        "
      >

        <textarea
        ref={textareaRef}
  value={prompt}
  disabled={isTyping}
  rows={1}
  placeholder="Ask Workspace AI anything..."
  onChange={(e) => {
  setPrompt(e.target.value);

  const textarea = textareaRef.current;
  if (textarea) {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }
}}
  onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onGenerate();
    }
  }}
  className="
  min-w-0
  flex-1
  resize-none
  overflow-hidden
  border-none
  bg-transparent
  px-3 sm:px-4
  py-2
  text-sm
  sm:text-base
  text-white
  outline-none
  placeholder:text-slate-500
  leading-6
  sm:leading-7
"
/>

        <button
          onClick={onGenerate}
          disabled={isTyping}
          className={`
  flex
  shrink-0
  items-center
  gap-2
  rounded-xl
  sm:rounded-2xl
  px-3
  sm:px-5
  lg:px-6
  py-2
  sm:py-2.5
  text-sm
  sm:text-base
  font-medium
  text-white
  transition-all
  duration-300

  ${
    isTyping
      ? "cursor-not-allowed bg-slate-700 opacity-60"
      : "bg-cyan-500 hover:bg-cyan-400 hover:shadow-lg"
  }
`}
        >
          <Sparkles className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />

          <span className="hidden sm:inline">
  Generate
</span>
        </button>

      </div>

    </div>
  );
}