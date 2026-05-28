import { useState } from "react";
import { ChevronDown, ChevronUp, Download } from "lucide-react";

export default function CredentialsList({ items, showLabel = "View Credentials", hideLabel = "Hide Credentials" }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors duration-150 cursor-pointer"
      >
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {open ? hideLabel : showLabel}
      </button>
      {open && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-3">
          {items.map((cred) => (
            <div key={cred.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">{cred.label}</span>
                {cred.required && <span className="text-xs text-error-600">Required</span>}
              </div>
              {cred.url ? (
                <a
                  href={cred.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-800 transition-colors duration-150"
                >
                  <Download size={14} />
                  Download
                </a>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Download size={14} />
                  No file attached
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
