import { useState } from "react";
import {
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  RotateCcw,
} from "lucide-react";

export default function ReportsHeader({
  isAdmin,
  onExportCSV,
  onExportExcel,
  onResetFilters,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      {/* Left Section */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Reports & Analytics
        </h1>

        <p className="text-slate-400 mt-2">
          Monitor project progress, task performance, and team productivity.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-start md:self-auto">

  {/* Reset Filters */}
  <button
    onClick={onResetFilters}
    className="flex items-center justify-center gap-2
    border border-white/10
    bg-white/5
    hover:bg-white/10
    text-white
    px-5 py-3
    rounded-xl
    transition-all duration-300"
  >
    <RotateCcw size={18} />
    <span>Reset Filters</span>
  </button>

  {/* Export */}
  {isAdmin && (
  <div className="relative">

    <button
      onClick={() => setOpen((prev) => !prev)}
      className="flex items-center justify-center gap-2
      bg-cyan-500
      hover:bg-cyan-600
      text-white
      px-5 py-3
      rounded-xl
      transition-all duration-300"
    >
      <Download size={18} />
      <span>Export Report</span>

      <ChevronDown
        size={18}
        className={`transition-transform duration-300 ${
          open ? "rotate-180" : ""
        }`}
      />
    </button>

    {open && (
      <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">

        <button
          onClick={() => {
            setOpen(false);
            onExportCSV();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-all"
        >
          <FileText
            size={18}
            className="text-cyan-400"
          />
          <span>Export as CSV</span>
        </button>

        <button
          onClick={() => {
            setOpen(false);
            onExportExcel();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-all"
        >
          <FileSpreadsheet
            size={18}
            className="text-green-400"
          />
          <span>Export as Excel</span>
        </button>

      </div>
    )}
  </div>
)}
    </div>
  </div>
  );
}