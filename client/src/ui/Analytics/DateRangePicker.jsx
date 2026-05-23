import { useState } from "react";
import { Calendar } from "lucide-react";

const presets = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1y", days: 365 },
];

export default function DateRangePicker({ value, onChange }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [error, setError] = useState("");

  const activePreset = presets.find((p) => p.days === value);

  const handlePreset = (days) => {
    setShowCustom(false);
    setError("");
    onChange(days);
  };

  const handleCustomApply = () => {
    setError("");
    if (!customStart || !customEnd) return;

    const start = new Date(customStart);
    const end = new Date(customEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError("Invalid date");
      return;
    }

    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (diff <= 0) {
      setError("End must be after start");
      return;
    }

    onChange(diff);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center bg-gray-50 rounded-lg p-0.5">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePreset(preset.days)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 cursor-pointer ${
              activePreset?.label === preset.label && !showCustom
                ? "bg-white text-teal-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowCustom(!showCustom)}
        className={`p-2 rounded-lg transition-colors duration-150 cursor-pointer ${
          showCustom
            ? "bg-teal-50 text-teal-700"
            : "text-gray-500 hover:text-gray-600 hover:bg-gray-50"
        }`}
        aria-label="Custom date range"
      >
        <Calendar size={16} />
      </button>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => { setCustomStart(e.target.value); setError(""); }}
            className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <span className="text-xs text-gray-500">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => { setCustomEnd(e.target.value); setError(""); }}
            className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button
            onClick={handleCustomApply}
            disabled={!customStart || !customEnd}
            className="px-3 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
          >
            Apply
          </button>
          {error && (
            <span className="text-xs text-error-500">{error}</span>
          )}
        </div>
      )}
    </div>
  );
}
