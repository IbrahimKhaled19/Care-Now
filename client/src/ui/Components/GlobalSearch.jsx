import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Users, Stethoscope, ClipboardList, CreditCard } from "lucide-react";
import { useDebounce } from "../../hooks/useDebounce";
import { api } from "../../lib/api";

const typeConfig = {
  patients: { icon: Users, label: "Patients", color: "text-blue-600", path: (id) => `/patients/${id}` },
  providers: { icon: Stethoscope, label: "Providers", color: "text-teal-600", path: (id) => `/providers/${id}` },
  requests: { icon: ClipboardList, label: "Requests", color: "text-amber-600", path: (id) => `/requests/${id}` },
  transactions: { icon: CreditCard, label: "Transactions", color: "text-purple-600", path: (id) => `/billing` },
};

export default function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((data) => { if (!cancelled) setResults(data); })
      .catch(() => { if (!cancelled) setResults(null); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const handleSelect = (type, id) => {
    const config = typeConfig[type];
    if (config) {
      navigate(config.path(id));
      onClose();
    }
  };

  const hasResults = results && Object.values(results).some((arr) => arr.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-lg bg-[var(--bg-secondary)] rounded-xl shadow-2xl border border-[var(--border-color)] overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)]">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, providers, requests..."
            className="flex-1 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none bg-transparent"
          />
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer" aria-label="Close search">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Searching...</div>
          )}

          {!loading && debouncedQuery.length >= 2 && !hasResults && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No results found for "{debouncedQuery}"
            </div>
          )}

          {!loading && hasResults && Object.entries(results).map(([type, items]) => {
            if (!items.length) return null;
            const config = typeConfig[type];
            const Icon = config.icon;
            return (
              <div key={type}>
                <div className="px-4 py-2 bg-[var(--bg-tertiary)]">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{config.label}</span>
                </div>
                {items.map((item) => (
                  <button
                    key={`${type}-${item.id}`}
                    onClick={() => handleSelect(type, item.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer text-left"
                  >
                    <Icon size={16} className={config.color} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.name}</p>
                      {item.specialty && <p className="text-xs text-gray-400">{item.specialty}</p>}
                      {item.status && <p className="text-xs text-gray-400">{item.status}</p>}
                    </div>
                  </button>
                ))}
              </div>
            );
          })}

          {!loading && !debouncedQuery && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
