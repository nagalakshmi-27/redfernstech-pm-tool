import { useState } from "react";
import {
  Sparkles,
  Copy,
  Pencil,
} from "lucide-react";

export default function ChatMessage({
  message,
  onCopy,
  onEdit,
  editingId,
  editedText,
  setEditedText,
  onSave,
  onCancel,
}) {
  const isUser = message.role === "user";
  const isEditing = editingId === message.id;


  return (
    <div
      className={`mb-8 flex ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
  className={`group flex w-full max-w-[95%] sm:max-w-[85%] lg:max-w-[70%] items-start gap-2 sm:gap-3 lg:gap-4 ${
    isUser ? "flex-row-reverse" : ""
  }`}
>
        {/* Avatar */}

        <div
  className={`flex h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-full ${
            isUser
              ? "bg-cyan-500 text-white"
              : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
          }`}
        >
          {isUser ? (
            <span className="text-sm font-semibold">
              N
            </span>
          ) : (
            <Sparkles size={18} />
          )}
        </div>

        {/* Message + Actions */}

<div className="min-w-0">

  <div
  className={`rounded-2xl lg:rounded-3xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm ${
    isUser
      ? "border border-cyan-400/20 bg-cyan-500/15 text-white"
      : "border border-white/10 bg-white/[0.03] text-white"
  }`}
>
  {isEditing ? (
  <div className="space-y-3">
    <textarea
      value={editedText}
      onChange={(e) => setEditedText(e.target.value)}
      rows={3}
      className="
    w-full
    min-h-[90px]
    resize-none
    rounded-xl
    border
    border-white/10
    bg-transparent
    p-3
    text-sm
    sm:text-base
    text-white
    outline-none
  "
    />

    <div className="flex justify-end gap-2">

      <button
        onClick={onCancel}
        className="rounded-lg px-3 py-2 text-slate-400 hover:text-white"
      >
        Cancel
      </button>

      <button
        onClick={onSave}
        className="
          rounded-lg
          bg-cyan-500
          px-4
          py-2
          text-white
          hover:bg-cyan-400
        "
      >
        Save
      </button>

    </div>

  </div>
) : (
  <p className="break-words whitespace-pre-wrap text-sm sm:text-base leading-6 sm:leading-7">
    {message.content}
  </p>
)}
</div>

  {isUser && !isEditing && (
    <div className="mt-2 flex justify-end gap-2 opacity-100 sm:opacity-0 transition-all duration-200 sm:group-hover:opacity-100">

      <button
  onClick={() => onCopy(message.content)}
  className="rounded-md p-1.5 text-slate-500 transition-all duration-200 hover:bg-white/10 hover:text-cyan-400"
  title="Copy"
>
        <Copy size={15} />
      </button>

      <button
  onClick={() => onEdit(message)}
  className="rounded-md p-1.5 text-slate-500 transition-all duration-200 hover:bg-white/10 hover:text-cyan-400"
  title="Edit"
>
  <Pencil size={15} />
</button>

    </div>
  )}

</div>
      </div>
    </div>
  );
}