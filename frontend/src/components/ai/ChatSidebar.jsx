import {
  Menu,
  Plus,
  MessageSquare,
} from "lucide-react";

export default function ChatSidebar({
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  isSidebarOpen,
  setIsSidebarOpen,
}) {
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
        <span
  className={`truncate text-sm sm:text-base font-semibold text-white transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          Workspace AI
        </span>

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

      {/* Sidebar Content */}
      <div
        className={`flex flex-1 flex-col transition-opacity duration-300 ${
          isSidebarOpen
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* New Chat */}
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

        {/* Today */}
        <div className="px-4 pb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          Today
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`
                mb-1
                flex
                w-full
                items-center
                gap-2 sm:gap-3
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
              <MessageSquare size={16} />

              <span className="truncate text-sm sm:text-base">
                {chat.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}