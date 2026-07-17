import { useState } from "react";

export default function TransferOwnershipModal({
  open,
  onClose,
}) {
  const [selectedMember, setSelectedMember] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [agree, setAgree] = useState(false);

  if (!open) return null;

  const canTransfer =
    selectedMember &&
    confirmText === "TRANSFER" &&
    agree;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">

      <div className="bg-[#171d31] w-full max-w-xl rounded-xl border border-white/10 p-8">

        <h2 className="text-3xl font-bold text-white">
          Transfer Ownership
        </h2>

        <p className="text-slate-400 mt-4 leading-8">
          Transfer ownership of this organization to another member.
          The selected member will become the new Owner and you will
          no longer have ownership privileges.
        </p>

        <div className="mt-6 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
  <p className="text-cyan-300 text-sm leading-6">
    After confirming the transfer, the selected member will become the new
    <strong> Owner</strong>. You will lose all owner privileges for this organization.
  </p>
</div>

        {/* Member */}

        <div className="mt-8">

          <label className="block text-slate-300 mb-2">
            Select New Owner
          </label>

          <div className="relative">
  <select
    value={selectedMember}
    onChange={(e) => setSelectedMember(e.target.value)}
    className="w-full appearance-none rounded-lg border border-white/10 bg-[#161b2e] px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
  >
    <option value="" className="bg-[#161b2e] text-white">
      Select Member
    </option>

    <option value="Rahul Sharma" className="bg-[#161b2e] text-white">
      Rahul Sharma
    </option>

    <option value="Priya Reddy" className="bg-[#161b2e] text-white">
      Priya Reddy
    </option>

    <option value="Akansha" className="bg-[#161b2e] text-white">
      Akansha
    </option>
  </select>

  <svg
    className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
</div>

        </div>

        {/* Confirm */}

        <div className="mt-6">

          <label className="block text-slate-300 mb-2">
            Type <span className="text-cyan-400 font-semibold">TRANSFER</span> to continue
          </label>

          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type TRANSFER"
            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white"
          />

        </div>

        {/* Checkbox */}

        <div className="flex items-center gap-3 mt-6">

          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />

          <p className="text-slate-300">
            I understand ownership will be transferred permanently.
          </p>

        </div>

        {/* Buttons */}

        <div className="flex justify-end gap-4 mt-10">

          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg border border-white/20 text-white"
          >
            Back
          </button>

          <button
            disabled={!canTransfer}
            className={`px-6 py-3 rounded-lg text-white ${
              canTransfer
                ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                : "bg-slate-600 cursor-not-allowed"
            }`}
          >
            Confirm Transfer
          </button>

        </div>

      </div>

    </div>
  );
}