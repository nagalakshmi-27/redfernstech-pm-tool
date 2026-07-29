import {
  Menu,
  Plus,
  Search,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  Trash2,
  Archive,
ArrowLeft,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ChatSidebar({
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  isSidebarOpen,
  setIsSidebarOpen,

  editingChatId,
  editingChatTitle,
  setEditingChatTitle,

  onRenameChat,
  onSaveChatTitle,
  onCancelRename,

  onTogglePinChat,
onToggleArchive,
onDeleteChat,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
const [searchTerm, setSearchTerm] = useState("");
const [showSearch, setShowSearch] = useState(false);
const [showArchiveView, setShowArchiveView] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
  if (editingChatId) {
    inputRef.current?.focus();
    inputRef.current?.select();
  }
}, [editingChatId]);
const menuRef = useRef(null);
useEffect(() => {
  function handleClickOutside(event) {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target)
    ) {
      setOpenMenuId(null);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, []);

const filteredChats = chats.filter(
  (chat) =>
    !chat.archived &&
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
);
const getGroup = (date) => {
  const today = new Date();

  const chatDate = new Date(date);

  const diff =
    Math.floor(
      (today - chatDate) / (1000 * 60 * 60 * 24)
    );

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff <= 7) return "Previous 7 Days";
  if (diff <= 30) return "Previous 30 Days";

  return "Older";
};

const pinnedChats = filteredChats.filter((chat) => chat.pinned);

const unPinnedChats = filteredChats.filter(
  (chat) => !chat.pinned
);

const groupedChats = unPinnedChats.reduce((acc, chat) => {
  const group = getGroup(chat.createdAt);

  if (!acc[group]) {
    acc[group] = [];
  }

  acc[group].push(chat);

  return acc;
}, {});
const archivedChats = chats.filter(
  (chat) =>
    chat.archived &&
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
);
  return (
    <div
  className={`
    absolute
    left-0
    top-0
    z-20
    h-full

    w-[85vw]
    sm:w-[320px]
    lg:w-[280px]

    border-r
    border-white/10
    bg-[#0A0F1A]

    flex
    flex-col

    transform
    transition-transform
    duration-300
    ease-in-out

    ${
      isSidebarOpen
        ? "translate-x-0"
        : "-translate-x-full"
    }
`}
>
      {/* Header */}
      <div className="flex h-[88px] items-center justify-between border-b border-white/10 px-3 sm:px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
  <span
    className={`truncate text-sm sm:text-base font-semibold text-white transition-opacity duration-300 ${
      isSidebarOpen ? "opacity-100" : "opacity-0"
    }`}
  >
    Workspace AI
  </span>
</div>

<div className="flex items-center gap-2">

  <button
    onClick={() => setShowSearch(!showSearch)}
    className="rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-white"
  >
    <Search size={18} />
  </button>
  <button
  onClick={() => setShowArchiveView(true)}
  className="rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-white"
>
  <Archive size={18} />
</button>

  <button
    onClick={() => setIsSidebarOpen(false)}
    className={`rounded-md p-2 text-slate-400 transition-all duration-300 hover:bg-white/5 hover:text-white ${
      isSidebarOpen
        ? "opacity-100"
        : "opacity-0 pointer-events-none"
    }`}
  >
    <Menu size={18} />
  </button>

</div>
      </div>

      {showSearch && (
  <div className="px-4 py-3 border-b border-white/10">
    <input
      type="text"
      placeholder="Search chats..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/40"
    />
  </div>
)}

      {/* Sidebar Content */}
      <div
        className={`flex flex-1 flex-col transition-opacity duration-300 ${
          isSidebarOpen
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* New Chat */}
        {/* New Chat */}
{!showArchiveView && (
  <div className="p-4">
    <button
      onClick={onNewChat}
      className="
        flex
        w-full
        items-center
        gap-2 sm:gap-3
        rounded-xl
        border
        border-white/10
        bg-white/[0.03]
        px-3 sm:px-4
        py-2.5 sm:py-3
        text-sm
        text-white
        transition-all
        hover:border-cyan-500/40
        hover:bg-cyan-500/10
      "
    >
      <Plus size={18} />
      New Chat
    </button>
  </div>
)}

        {/* Today */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {!showArchiveView && (
  <>

  {pinnedChats.length > 0 && (
    <>
      <div className="px-2 pb-2 pt-2 text-xs font-medium uppercase tracking-wider text-slate-500">
        Pinned
      </div>

      {pinnedChats.map((chat) => (
  <div
    key={chat.id}
    className="group relative mb-1"
  >
    {/* Chat Button */}
    <button
  onClick={() => {
    if (editingChatId === chat.id) return;

    setOpenMenuId(null);
    onSelectChat(chat.id);
  }}
      className={`
        flex
        w-full
        items-center
        rounded-xl
        px-3
        py-3
        text-left
        transition-all

        ${
          activeChat === chat.id
            ? "bg-cyan-500/15 text-cyan-400"
            : "text-slate-300 hover:bg-white/5"
        }
      `}
    >
      <div className="flex min-w-0 items-center gap-3">
        <MessageSquare size={16} />

        {editingChatId === chat.id ? (
  <input
    ref={inputRef}
    value={editingChatTitle}
    onChange={(e) =>
      setEditingChatTitle(e.target.value)
    }
    onClick={(e) => e.stopPropagation()}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        onSaveChatTitle();
      }

      if (e.key === "Escape") {
        onCancelRename();
      }
    }}
    onBlur={onSaveChatTitle}
    className="
      w-full
      rounded-md
      border
      border-cyan-500/40
      bg-slate-800
      px-2
      py-1
      text-sm
      text-white
      outline-none
    "
  />
) : (
  <span className="truncate text-sm sm:text-base">
    {chat.title}
  </span>
)}
      </div>
    </button>

    {/* Three Dot Button */}
    <button
      onClick={(e) => {
        e.stopPropagation();

        setOpenMenuId(
          openMenuId === chat.id ? null : chat.id
        );
      }}
      className={`
  absolute
  right-3
  top-1/2
  -translate-y-1/2

  rounded-md
  p-1.5

  ${
    openMenuId === chat.id
      ? "opacity-100"
      : "opacity-0 group-hover:opacity-100"
  }

  text-slate-400
  transition-all

  hover:bg-white/10
  hover:text-white
`}
    >
      <MoreHorizontal size={16} />
    </button>

    {/* Popup */}
    {openMenuId === chat.id && (
      <div
        className="
          absolute
          right-2
          top-12
          z-50
          w-48
          overflow-hidden
          rounded-xl
          border
          border-white/10
          bg-[#141B2D]
          shadow-2xl
        "
      >
        <button
  onClick={() => {
    onRenameChat(chat);
    setOpenMenuId(null);
  }}
  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-white/5"
>
  <Pencil size={16} />
  Rename
</button>

        <button
  onClick={() => {
    onTogglePinChat(chat.id);
    setOpenMenuId(null);
  }}
  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-white/5"
>
  <Pin size={16} />

  {chat.pinned ? "Unpin Chat" : "Pin Chat"}
</button>
<button
  onClick={() => {
    onToggleArchive(chat.id);
    setOpenMenuId(null);
  }}
  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-white/5"
>
  <Archive size={16} />
  Archive
</button>

        <button
  onClick={() => {
    onDeleteChat(chat.id);
    setOpenMenuId(null);
  }}
  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10"
>
  <Trash2 size={16} />
  Delete
</button>
      </div>
    )}
  </div>
      ))}
    </>
  )}
  {Object.entries(groupedChats).map(([group, chats]) => (
  <div key={group}>
    <div className="mt-4 px-2 pb-2 pt-2 text-xs font-medium uppercase tracking-wider text-slate-500">
      {group}
    </div>

    {chats.map((chat) => (
      <div key={chat.id} className="group relative mb-1">
        {/* Chat Button */}
        <button
          onClick={() => {
            if (editingChatId === chat.id) return;

            setOpenMenuId(null);
            onSelectChat(chat.id);
          }}
          className={`
            flex
            w-full
            items-center
            rounded-xl
            px-3
            py-3
            text-left
            transition-all

            ${
              activeChat === chat.id
                ? "bg-cyan-500/15 text-cyan-400"
                : "text-slate-300 hover:bg-white/5"
            }
          `}
        >
          <div className="flex min-w-0 items-center gap-3">
            <MessageSquare size={16} />

            {editingChatId === chat.id ? (
              <input
                ref={inputRef}
                value={editingChatTitle}
                onChange={(e) =>
                  setEditingChatTitle(e.target.value)
                }
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveChatTitle();
                  if (e.key === "Escape") onCancelRename();
                }}
                onBlur={onSaveChatTitle}
                className="w-full rounded-md border border-cyan-500/40 bg-slate-800 px-2 py-1 text-sm text-white outline-none"
              />
            ) : (
              <span className="truncate text-sm sm:text-base">
                {chat.title}
              </span>
            )}
          </div>
        </button>

        {/* Three Dot Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();

            setOpenMenuId(
              openMenuId === chat.id ? null : chat.id
            );
          }}
          className={`
            absolute
            right-3
            top-1/2
            -translate-y-1/2
            rounded-md
            p-1.5
            ${
              openMenuId === chat.id
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            }
            text-slate-400
            transition-all
            hover:bg-white/10
            hover:text-white
          `}
        >
          <MoreHorizontal size={16} />
        </button>

        {/* Popup */}
        {openMenuId === chat.id && (
          <div ref={menuRef} className="absolute right-2 top-12 z-50 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#141B2D] shadow-2xl">
            <button
              onClick={() => {
                onRenameChat(chat);
                setOpenMenuId(null);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-white/5"
            >
              <Pencil size={16} />
              Rename
            </button>

            <button
              onClick={() => {
                onTogglePinChat(chat.id);
                setOpenMenuId(null);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-white/5"
            >
              <Pin size={16} />
              {chat.pinned ? "Unpin Chat" : "Pin Chat"}
            </button>
            <button
  onClick={() => {
    onToggleArchive(chat.id);
    setOpenMenuId(null);
  }}
  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-white/5"
>
  <Archive size={16} />
  Archive
</button>

            <button
              onClick={() => {
                onDeleteChat(chat.id);
                setOpenMenuId(null);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>
    ))}
  </div>
))}
</>
  )}
   {showArchiveView && (
  <>
    <button
      onClick={() => setShowArchiveView(false)}
      className="mb-4 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
    >
      <ArrowLeft size={18} />
      Archived
    </button>

    {archivedChats.length === 0 ? (
      <div className="mt-10 text-center text-sm text-slate-500">
        No archived chats
      </div>
    ) : (
      archivedChats.map((chat) => (
        <div
  key={chat.id}
  className="group relative mb-1"
>
  <button
    onClick={() => {
      setOpenMenuId(null);
      onSelectChat(chat.id);
    }}
    className="flex w-full items-center rounded-xl px-3 py-3 text-left text-slate-300 transition hover:bg-white/5"
  >
    <div className="flex min-w-0 items-center gap-3">
      <MessageSquare size={16} />
      <span className="truncate text-sm sm:text-base">
        {chat.title}
      </span>
    </div>
  </button>

  <button
    onClick={(e) => {
      e.stopPropagation();
      setOpenMenuId(
        openMenuId === chat.id ? null : chat.id
      );
    }}
    className={`
      absolute
      right-3
      top-1/2
      -translate-y-1/2
      rounded-md
      p-1.5
      ${
        openMenuId === chat.id
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100"
      }
      text-slate-400
      transition-all
      hover:bg-white/10
      hover:text-white
    `}
  >
    <MoreHorizontal size={16} />
  </button>
  {openMenuId === chat.id && (
  <div ref={menuRef} className="absolute right-2 top-12 z-50 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#141B2D] shadow-2xl">

    <button
      onClick={() => {
        onToggleArchive(chat.id);
        setOpenMenuId(null);
      }}
      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-white/5"
    >
      <Archive size={16} />
      Restore Chat
    </button>

    <button
      onClick={() => {
        onDeleteChat(chat.id);
        setOpenMenuId(null);
      }}
      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10"
    >
      <Trash2 size={16} />
      Delete Forever
    </button>

  </div>
)}
</div>
      ))
    )}
  </>
)}

        </div>
      </div>
    </div>
  );
}