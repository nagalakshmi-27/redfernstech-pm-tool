import { useState, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import AIHeader from "./AIHeader";
import PromptInput from "./PromptInput";
import ConversationPanel from "./ConversationPanel";
import TypingIndicator from "./TypingIndicator";
import ChatMessage from "./ChatMessage";
import ChatSidebar from "./ChatSidebar";

export default function WorkspaceAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
const [view, setView] = useState("home");
const [copied, setCopied] = useState(false);
const [editingId, setEditingId] = useState(null);
const [editedText, setEditedText] = useState("");
const [isTyping, setIsTyping] = useState(false);
const [activeChat, setActiveChat] = useState(1);
const [isSidebarOpen, setIsSidebarOpen] = useState(true);

const [chats, setChats] = useState([
  {
    id: 1,
    title: "CRM Project",
    messages: [],
  },
  {
    id: 2,
    title: "Login Module",
    messages: [],
  },
  {
    id: 3,
    title: "Dashboard UI",
    messages: [],
  },
]);
const currentChat = chats.find(
  (chat) => chat.id === activeChat
);
const messagesEndRef = useRef(null);
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [currentChat?.messages, isTyping]);
const handleCopy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);

  } catch (error) {
    console.error(error);
  }
};
const handleEdit = (message) => {
  setEditingId(message.id);
  setEditedText(message.content);
};
const handleSave = () => {
  setChats((prev) =>
  prev.map((chat) =>
    chat.id === activeChat
      ? {
          ...chat,
          messages: chat.messages.map((msg) =>
            msg.id === editingId
              ? {
                  ...msg,
                  content: editedText,
                }
              : msg
          ),
        }
      : chat
  )
);

  setEditingId(null);
  setEditedText("");
};
const handleCancel = () => {
  setEditingId(null);
  setEditedText("");
};
const handleNewChat = () => {
  const newChat = {
  id: Date.now(),
  title: "New Chat",
  messages: [],
};

  setChats((prev) => [newChat, ...prev]);

  setActiveChat(newChat.id);

  setPrompt("");

  setView("home");

  setEditingId(null);

  setEditedText("");
};
const handleSelectChat = (chatId) => {
  setActiveChat(chatId);

  const selectedChat = chats.find(
    (chat) => chat.id === chatId
  );

  if (!selectedChat) return;

  if (selectedChat.messages.length === 0) {
    setView("home");
  } else {
    setView("chat");
  }

  setEditingId(null);
  setEditedText("");
};
  const handleGenerate = () => {
  if (!prompt.trim()) return;

  if (editingId !== null) {
  setChats((prev) =>
    prev.map((chat) =>
      chat.id === activeChat
        ? {
            ...chat,
            messages: chat.messages.map((msg) =>
              msg.id === editingId
                ? {
                    ...msg,
                    content: prompt.trim(),
                  }
                : msg
            ),
          }
        : chat
    )
  );

  setEditingId(null);
  setEditedText("");
} else {
  const userMessage = {
  id: Date.now(),
  role: "user",
  content: prompt.trim(),
};

setChats((prev) =>
  prev.map((chat) => {
    if (chat.id !== activeChat) return chat;

    return {
      ...chat,

      title:
        chat.title === "New Chat"
          ? prompt.trim().length > 30
            ? prompt.trim().slice(0, 30) + "..."
            : prompt.trim()
          : chat.title,

      messages: [...chat.messages, userMessage],
    };
  })
);
setIsTyping(true);

setTimeout(() => {
  const assistantMessage = {
    id: Date.now() + 1,
    role: "assistant",
    content: "This is a dummy AI response. Later this will come from the backend.",
  };

  setChats((prev) =>
    prev.map((chat) =>
      chat.id === activeChat
        ? {
            ...chat,
            messages: [...chat.messages, assistantMessage],
          }
        : chat
    )
  );

  setIsTyping(false);
}, 1500);
}

setPrompt("");
setView("chat");
};

  return (
    <>
      {/* Floating AI Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="
          fixed
          bottom-4 right-4
sm:bottom-6
sm:right-6
h-12
w-12
sm:h-14
sm:w-14
          z-50
          rounded-2xl
          border
          border-white/10
          bg-slate-900/90
          backdrop-blur-xl
          shadow-xl
          flex
          items-center
          justify-center
          transition-all
          duration-300
          hover:scale-105
          hover:border-cyan-400/40
          hover:shadow-cyan-500/20
        "
      >
        <Sparkles
          size={24}
          className="text-cyan-400"
        />
      </button>

      {/* AI Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999]">
          {/* Background Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div
  className="
    relative
    flex
    h-screen
    w-screen
    lg:h-[90vh]
    lg:w-[95vw]
    lg:max-w-[1500px]
    flex-col
    overflow-hidden
    bg-slate-900/95
    lg:rounded-3xl
    border
    border-white/10
    backdrop-blur-xl
    shadow-2xl
  "
>
  <div className="relative flex h-full">

  <ChatSidebar
    chats={chats}
    activeChat={activeChat}
    onSelectChat={handleSelectChat}
    onNewChat={handleNewChat}
    isSidebarOpen={isSidebarOpen}
    setIsSidebarOpen={setIsSidebarOpen}
  />

  <div
  className={`
    flex
    flex-1
    flex-col
    transition-all
    duration-300
    ease-in-out

    ${
      isSidebarOpen
        ? "lg:ml-[280px]"
        : "ml-0"
    }
  `}
>

    <AIHeader
  onClose={() => setIsOpen(false)}
  isSidebarOpen={isSidebarOpen}
  setIsSidebarOpen={setIsSidebarOpen}
/>

    {copied && (
      <div
        className="
          fixed
          top-4 sm:top-8
          left-1/2
          -translate-x-1/2
          z-[10000]
          flex
          items-center
          gap-2
          rounded-full
          border
          border-white/10
          bg-slate-800/95
          backdrop-blur-xl
          px-4
          py-2
          text-sm
          font-medium
          text-white
          shadow-2xl
        "
      >
        <span className="text-green-400">✓</span>
        Copied
      </div>
    )}

    <PromptInput
  prompt={prompt}
  setPrompt={setPrompt}
  onGenerate={handleGenerate}
  isTyping={isTyping}
/>

    <div className="flex-1 overflow-y-auto">

      {view === "home" ? (
        <ConversationPanel setPrompt={setPrompt} />
      ) : (
        <div className="p-4 sm:p-6 lg:p-8">
          {currentChat?.messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onCopy={handleCopy}
              onEdit={handleEdit}
              editingId={editingId}
              editedText={editedText}
              setEditedText={setEditedText}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ))}

          {isTyping && <TypingIndicator />}

<div ref={messagesEndRef} />
        </div>
      )}

    </div>

  </div>

</div>
              
            </div>
          </div>
        </div>
      )}
    </>
  );
}