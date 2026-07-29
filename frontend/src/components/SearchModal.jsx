import { Search, X, FolderKanban, CheckSquare, Users } from "lucide-react";

export default function SearchModal({
  open,
  onClose,
  searchText,
  setSearchText,
  filteredResults,
  handleSearchClick,
  modalRef,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4">

      <div
  ref={modalRef}
  className="w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 shadow-2xl transition-all duration-200 scale-100"
>

        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">

          <Search size={20} className="text-slate-400" />

          <input
            autoFocus
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search projects, tasks, members..."
            className="flex-1 bg-transparent outline-none text-white placeholder:text-slate-500"
          />

          <button onClick={onClose}>
            <X
              size={22}
              className="text-slate-400 hover:text-white"
            />
          </button>

        </div>

        {/* Results */}

        <div className="max-h-80 overflow-y-auto p-2">

          {!searchText.trim() ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              Start typing to search...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              No results found
            </div>
          ) : (
            filteredResults.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  handleSearchClick(item);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-left"
              >
                {item.type === "project" && (
                  <FolderKanban
                    size={18}
                    className="text-cyan-400"
                  />
                )}

                {item.type === "task" && (
                  <CheckSquare
                    size={18}
                    className="text-green-400"
                  />
                )}

                {item.type === "member" && (
                  <Users
                    size={18}
                    className="text-purple-400"
                  />
                )}

                <div>
                  <p className="text-white">{item.name}</p>
                  <p className="text-xs text-slate-400 capitalize">
                    {item.type}
                  </p>
                </div>
              </button>
            ))
          )}

        </div>

      </div>

    </div>
  );
}