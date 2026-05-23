import { useState, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";

function SearchFilterBar({
  searchPlaceholder = "Search...",
  filterLabel = "Filter",
  filterOptions = [],
  searchValue,
  onSearch,
  statusFilter,
  onFilterChange,
}) {
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    if (!showFilter) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") setShowFilter(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showFilter]);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearch?.(e.target.value)}
          aria-label={searchPlaceholder}
          className="w-full py-2.5 pl-9 pr-4 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors duration-150"
        />
      </div>

      <div className="flex items-center gap-2">
        {statusFilter && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-xs font-medium">
            {statusFilter}
            <button
              onClick={() => onFilterChange?.(null)}
              className="hover:text-teal-900 cursor-pointer"
              aria-label={`Remove ${statusFilter} filter`}
            >
              <X size={12} />
            </button>
          </span>
        )}

        {filterOptions.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              aria-expanded={showFilter}
              aria-haspopup="true"
              className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 cursor-pointer ${
                statusFilter
                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              <Filter size={16} />
              {filterLabel}
            </button>
            {showFilter && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                <div
                  className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-20 min-w-[140px]"
                  role="menu"
                >
                  {filterOptions.map((option) => (
                    <button
                      key={option}
                      role="menuitem"
                      onClick={() => {
                        onFilterChange?.(statusFilter === option ? null : option);
                        setShowFilter(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-100 cursor-pointer ${
                        statusFilter === option ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchFilterBar;
