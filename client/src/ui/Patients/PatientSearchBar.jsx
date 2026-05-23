import { useState } from "react";
import SearchFilterBar from "../common/SearchFilterBar";

const PatientsSearchBar = ({ onSearch, onFilterChange }) => {
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
    <div>
      <SearchFilterBar
        searchPlaceholder="Search patients..."
        filterOptions={["active", "suspended"]}
        searchValue={searchQuery}
        onSearch={handleSearch}
        statusFilter={statusFilter}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
};

export default PatientsSearchBar;
