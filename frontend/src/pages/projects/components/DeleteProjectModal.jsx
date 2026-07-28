import { useState} from "react";
export default function DeleteProjectModal({
  open,
  onClose,
  onDelete,
  projectName,
  title = "Delete Project",
  description = "Are you sure you want to delete",
  confirmButtonText = "Delete Project",
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!open) return null;
  return (
    <div
  className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
  onClick={() => {
    setConfirmDelete(false);
    onClose();
  }}
>
      <div
  className="bg-slate-900/90 border border-white/20 rounded-2xl p-6 w-[95%] max-w-md"
  onClick={(e) => e.stopPropagation()}
>

        <h2 className="text-2xl font-bold text-white mb-3">
          {title}
        </h2>

        <p className="text-slate-300 leading-7">
          {description}
          <span className="font-semibold text-white">
            {" "}{projectName}
          </span>
          ?
        </p>

        <p className="text-red-400 text-sm mt-3">
          This action cannot be undone.
        </p>
        <label className="flex items-center gap-3 mt-5 cursor-pointer text-slate-300">
  <input
    type="checkbox"
    checked={confirmDelete}
    onChange={(e) => setConfirmDelete(e.target.checked)}
    className="h-4 w-4 rounded border-white/20 accent-red-600"
  />

  <span>
  I understand this action cannot be undone.
</span>
</label>

        <div className="flex justify-end gap-3 mt-8">
          <button
  onClick={() => {
    setConfirmDelete(false);
    onClose();
  }}
  className="px-4 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5"
>
  Cancel
</button>

          <button
  onClick={() => {
  setConfirmDelete(false);
  onDelete();
}}
  disabled={!confirmDelete}
  className={`px-4 py-2 rounded-lg text-white transition ${
    confirmDelete
      ? "bg-red-600 hover:bg-red-700"
      : "bg-red-600/40 cursor-not-allowed opacity-60"
  }`}
>
  {confirmButtonText}
</button>
        </div>

      </div>
    </div>
  );
}