import { useState } from "react";
import { Calendar, Sparkles, X } from "lucide-react";

const SmartSummaryModal = ({ isOpen, onClose }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

      {/* Modal */}
      <div className="w-full max-w-4xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
              <Sparkles className="h-6 w-6 text-yellow-400" />
              Catch Up Summary
            </h2>

            <p className="mt-1 text-sm text-gray-300">
              Generate an AI summary for one day or a custom date range.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-300 hover:bg-white/10 hover:text-white transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* Date Inputs */}
          <div className="grid gap-5 md:grid-cols-2">

            {/* Start Date */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-200">
                <Calendar size={16} />
                Start Date *
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none backdrop-blur-lg"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-200">
                <Calendar size={16} />
                End Date (Optional)
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none backdrop-blur-lg"
              />
            </div>

          </div>

          {/* Generate Button */}
          <div className="mt-6">
            <button
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-105"
            >
              <Sparkles className="animate-pulse" size={18} />
              Generate Catch-Up Summary
            </button>
          </div>

          {/* Summary Area */}
          <div className="mt-6 h-[350px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-5">

            {!loading && !summary && (
              <div className="flex h-full items-center justify-center text-gray-400">
                Your AI summary will appear here...
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                <div className="h-5 w-3/4 animate-pulse rounded bg-white/10"></div>
                <div className="h-5 w-full animate-pulse rounded bg-white/10"></div>
                <div className="h-5 w-5/6 animate-pulse rounded bg-white/10"></div>
                <div className="h-5 w-2/3 animate-pulse rounded bg-white/10"></div>
                <div className="h-5 w-full animate-pulse rounded bg-white/10"></div>
              </div>
            )}

            {summary && (
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: summary }}
              />
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default SmartSummaryModal;