import { useState, useContext } from "react";
import AppContext from "../../context/AppContext";
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
  onProjectRedirect,
}) {
  const { currentUser } = useContext(AppContext);
  const userInitial = currentUser?.full_name?.charAt(0).toUpperCase() || currentUser?.username?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || "U";
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
              {userInitial}
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
  <div className="space-y-3 w-[80vw] sm:w-[400px] lg:w-[500px] max-w-full">
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
  <>
    <p className="break-words whitespace-pre-wrap text-sm sm:text-base leading-6 sm:leading-7">
      {message.content}
    </p>
    {message.files && message.files.length > 0 && (
      <div className="mt-3 flex flex-wrap gap-2">
        {message.files.map((f, idx) => (
          <div key={idx} className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-sm text-cyan-100 border border-cyan-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span className="truncate max-w-[150px]">{f.name}</span>
          </div>
        ))}
      </div>
    )}
  </>
)}

{message.new_project_id && (
  <div className="mt-4 border-t border-white/10 pt-4">
    <button
      onClick={() => onProjectRedirect && onProjectRedirect(message.new_project_id)}
      className="flex items-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-500/30 border border-cyan-500/50"
    >
      <Sparkles size={16} />
      View Created Project
    </button>
  </div>
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