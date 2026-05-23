import { useState } from "react";
import SearchFilterBar from "../common/SearchFilterBar";

function ProvidersFilter({ activeTab, onTabChange, onSearch, onFilterChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  const handleSearch = (value) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    onFilterChange?.(status);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {[
          { id: "all-providers", label: "All Providers" },
          { id: "applications", label: "Applications" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 cursor-pointer ${
              activeTab === tab.id
                ? "bg-teal-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <SearchFilterBar
        searchPlaceholder="Search providers..."
        filterOptions={["active", "suspended"]}
        searchValue={searchQuery}
        onSearch={handleSearch}
        statusFilter={statusFilter}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}

export default ProvidersFilter;
