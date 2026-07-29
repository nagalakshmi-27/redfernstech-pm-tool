import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Plus,
  FileText,
  Image,
  X,
  FileSpreadsheet,
  FileCode,
  Presentation,
} from "lucide-react";

export default function PromptInput({
  prompt,
  setPrompt,
  onGenerate,
  isTyping,
  selectedModel,
  setSelectedModel,
  selectedFiles,
  setSelectedFiles,
}) {
    const textareaRef = useRef(null);
    const imageInputRef = useRef(null);
const documentInputRef = useRef(null);
    const [showUploadMenu, setShowUploadMenu] = useState(false);
const [previewImage, setPreviewImage] = useState(null);
const getFileIcon = (file) => {
  if (!file) return <FileText className="h-5 w-5 text-cyan-400" />;

  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "pdf":
    case "doc":
    case "docx":
    case "txt":
      return <FileText className="h-5 w-5 text-cyan-400" />;

    case "xls":
    case "xlsx":
    case "csv":
      return <FileSpreadsheet className="h-5 w-5 text-green-400" />;

    case "ppt":
    case "pptx":
      return <Presentation className="h-5 w-5 text-orange-400" />;

    case "json":
    case "xml":
      return <FileCode className="h-5 w-5 text-violet-400" />;

    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
      return <Image className="h-5 w-5 text-pink-400" />;

    default:
      return <FileText className="h-5 w-5 text-cyan-400" />;
  }
};
    useEffect(() => {
  const textarea = textareaRef.current;

  if (!textarea) return;

  textarea.style.height = "auto";
textarea.style.height = `${Math.min(textarea.scrollHeight, 250)}px`;
textarea.style.overflowY =
  textarea.scrollHeight > 250 ? "auto" : "hidden";
}, [prompt]);
  return (
<div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">

      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <label className="block text-xs sm:text-sm font-semibold text-slate-300">
          Ask Workspace AI
        </label>
      </div>

      <div
  className="
    rounded-2xl
    sm:rounded-3xl
    border
    border-white/10
    bg-white/[0.03]
    p-3
    transition-all
    duration-300
    focus-within:border-cyan-400/40
    focus-within:shadow-[0_0_30px_rgba(34,211,238,0.15)]
  "
>

  {selectedFiles.length > 0 && (
    <div className="mb-3 flex flex-wrap items-center gap-2">

      {selectedFiles.map((file, index) => (

        <div
  key={index}
  onClick={() => {
    if (file.type.startsWith("image/")) {
      setPreviewImage(URL.createObjectURL(file));
    }
  }}
  className="flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-500/20 bg-slate-800 px-3 py-2"
>

          <div className="rounded-lg bg-cyan-500/10 p-2">
            {getFileIcon(file)}
          </div>

          <div className="flex flex-col">
            <span className="max-w-[140px] truncate text-sm text-white">
              {file.name}
            </span>

            <span className="text-xs text-slate-400">
              {(file.size / 1024).toFixed(1)} KB
            </span>
          </div>

          <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();

    setSelectedFiles((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }}
  className="rounded-full p-1 hover:bg-red-500/10"
>
            <X className="h-4 w-4 text-slate-400 hover:text-red-400" />
          </button>

        </div>

      ))}

    </div>
  )}

  <div className="flex items-end">
        <div className="relative mb-1 ml-2 mr-2">
  <button
    type="button"
    onClick={() => setShowUploadMenu(!showUploadMenu)}
    className="
      flex
      h-10
      w-10
      shrink-0
      items-center
      justify-center
      rounded-full
      text-slate-400
      transition
      hover:bg-white/10
      hover:text-white
    "
  >
    <Plus
  className={`h-5 w-5 transition-transform duration-200 ${
    showUploadMenu ? "rotate-45" : ""
  }`}
/>
  </button>

  {showUploadMenu && (
    <div
      className="
        absolute
        bottom-12
        left-0
        w-64
        overflow-hidden
        rounded-2xl
        border
        border-white/10
        bg-[#141B2D]
        shadow-2xl
        z-50
      "
    >
      <button
  onClick={() => {
    setShowUploadMenu(false);
    documentInputRef.current?.click();
  }}
  className="flex w-full items-center gap-3 px-4 py-3 text-slate-200 hover:bg-cyan-500/10 transition"
>
  <FileText className="h-5 w-5 text-cyan-400" />
  <span>Upload Document</span>
</button>



<button
  onClick={() => {
    setShowUploadMenu(false);
    imageInputRef.current?.click();
  }}
  className="flex w-full items-center gap-3 px-4 py-3 text-slate-200 hover:bg-cyan-500/10 transition"
>
  <Image className="h-5 w-5 text-emerald-400" />
  <span>Upload Image</span>
</button>

<div className="border-t border-white/10" />
    </div>
  )}
</div>

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
textarea.style.height = `${Math.min(textarea.scrollHeight, 250)}px`;
textarea.style.overflowY =
  textarea.scrollHeight > 250 ? "auto" : "hidden";
  }
}}
  onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onGenerate();
    }
  }}
  onPaste={(e) => {
  const items = e.clipboardData?.items;

  if (!items) return;

  const pastedFiles = [];

  for (const item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();

      if (file) {
        pastedFiles.push(file);
      }
    }
  }

  if (pastedFiles.length > 0) {
    e.preventDefault();
    setSelectedFiles((prev) => [...prev, ...pastedFiles]);
  }
}}
  className="
  custom-scrollbar
  flex-1
  min-w-0
  resize-none
  overflow-y-auto
  border-none
  bg-transparent
  px-3
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

        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="
            hidden sm:block
            ml-auto
            mr-2
            bg-slate-800
            border border-white/10
            rounded-xl
            px-3
            py-2.5
            text-sm
            text-white
            outline-none
            focus:border-cyan-500/50
            transition-colors
            cursor-pointer
          "
        >
          <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
          <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
        </select>
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

      <input
  ref={documentInputRef}
  type="file"
  multiple
  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.json,.xml"
  className="hidden"
  onChange={(e) => {
  const files = Array.from(e.target.files || []);

  if (files.length > 0) {
    setSelectedFiles((prev) => [...prev, ...files]);
  }

  e.target.value = "";
}}
/>

      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
  const files = Array.from(e.target.files || []);

if (files.length > 0) {
  setSelectedFiles((prev) => [...prev, ...files]);
}

e.target.value = "";
}}
      />

    {previewImage && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6"
    onClick={() => setPreviewImage(null)}
  >
    <div
      className="relative max-h-[90vh] max-w-[90vw]"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setPreviewImage(null)}
        className="absolute -right-3 -top-3 rounded-full bg-slate-800 p-2 text-white hover:bg-slate-700"
      >
        <X className="h-5 w-5" />
      </button>

      <img
        src={previewImage}
        alt="Preview"
        className="max-h-[85vh] rounded-xl object-contain"
      />
    </div>
  </div>
)}

</div>
  );
}