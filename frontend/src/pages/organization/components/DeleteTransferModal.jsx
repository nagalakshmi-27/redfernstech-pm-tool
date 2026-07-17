import { useState } from "react";

export default function DeleteTransferModal({
  open,
  onClose,
  onTransfer,
  onDelete,
}) {
  const [selectedAction, setSelectedAction] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#171d31] w-full max-w-2xl rounded-xl border border-white/10 p-8">

        <h2 className="text-3xl font-bold text-white">
          Delete / Transfer Organization
        </h2>

        <p className="text-slate-400 mt-3">
          Choose what you would like to do with this organization.
        </p>

        {/* Transfer Card */}
        <div
          onClick={() => setSelectedAction("transfer")}
          className={`mt-8 cursor-pointer rounded-xl border p-5 transition ${
            selectedAction === "transfer"
              ? "border-cyan-500 bg-cyan-500/10"
              : "border-white/10 hover:border-cyan-400"
          }`}
        >
          <h3 className="text-xl font-semibold text-cyan-400">
            Transfer Ownership
          </h3>

          <p className="text-slate-400 mt-2 leading-7">
            Transfer ownership of this organization to another member.
            The selected member will become the new Owner and you
            will lose ownership privileges.
          </p>
        </div>

        {/* Delete Card */}
        <div
          onClick={() => setSelectedAction("delete")}
          className={`mt-5 cursor-pointer rounded-xl border p-5 transition ${
            selectedAction === "delete"
              ? "border-red-500 bg-red-500/10"
              : "border-white/10 hover:border-red-400"
          }`}
        >
          <h3 className="text-xl font-semibold text-red-400">
            Delete Organization
          </h3>

          <p className="text-slate-400 mt-2 leading-7">
            Permanently delete this organization.
            All workspaces, projects, tasks, members and organization
            data will be removed permanently and cannot be recovered.
          </p>
        </div>

        <div className="flex justify-end gap-4 mt-10">

          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg border border-white/20 text-white"
          >
            Cancel
          </button>

          <button
  disabled={!selectedAction}
  onClick={() => {
    if (selectedAction === "transfer") {
      onTransfer();
    } else if (selectedAction === "delete") {
      onDelete();
    }
  }}
  className={`px-6 py-3 rounded-lg text-white ${
    selectedAction
      ? "bg-gradient-to-r from-cyan-500 to-blue-500"
      : "bg-slate-600 cursor-not-allowed"
  }`}
>
  Continue
</button>

        </div>

      </div>
    </div>
  );
}