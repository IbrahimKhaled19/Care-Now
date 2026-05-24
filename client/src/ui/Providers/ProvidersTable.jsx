import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProviders } from "../../hooks/useApi";
import { useToast } from "../common/Toast";
import { api } from "../../lib/api";
import BaseTable from "../common/BaseTable";
import StatusBadge from "../common/StatusBadge";
import InitialsAvatar from "../common/InitialsAvatar";
import { Star, Pencil, Pause, Play } from "lucide-react";
import { useIsAdmin } from "../../context/UserContext";

const columns = [
  { key: "name", label: "Provider" },
  { key: "specialty", label: "Specialty" },
  { key: "visits", label: "Visits" },
  { key: "credentials", label: "Credentials" },
  { key: "acceptRate", label: "Accept Rate" },
  { key: "rating", label: "Rating" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

function ProvidersTable({ filters = {} }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const { data: providers, loading, refetch } = useProviders(filters);
  const toast = useToast();
  const isAdmin = useIsAdmin();

  const handleToggleStatus = async (e, provider) => {
    e.stopPropagation();
    const newStatus = provider.status === "active" ? "suspended" : "active";
    try {
      await api.put(`/providers/${provider.id}`, { status: newStatus });
      toast.success(
        `Provider ${newStatus === "suspended" ? "suspended" : "activated"} successfully.`,
      );
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to update provider status.");
    }
  };

  const renderRow = useCallback(
    (provider) => (
      <tr
        key={provider.id}
        className="hover:bg-gray-50 cursor-pointer transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-inset"
        onClick={() => navigate(`/providers/${provider.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/providers/${provider.id}`);
          }
        }}
        tabIndex={0}
        role="link"
        aria-label={`View ${provider.name}`}
      >
        <td className="px-5 py-3.5 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <InitialsAvatar name={provider.name} src={provider.avatar} />
            <span className="text-sm font-medium text-gray-800">
              {provider.name}
            </span>
          </div>
        </td>
        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
          {provider.specialty}
        </td>
        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
          {provider.visits}
        </td>
        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
          {provider.credentials || "—"}
        </td>
        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
          {provider.accept_rate || "—"}
        </td>
        <td className="px-5 py-3.5 whitespace-nowrap">
          <div className="flex items-center gap-1">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-sm text-gray-700">{provider.rating}</span>
          </div>
        </td>
        <td className="px-5 py-3.5 whitespace-nowrap">
          <StatusBadge status={provider.status} />
        </td>
        <td className="px-5 py-3.5 whitespace-nowrap">
          {isAdmin && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/providers/${provider.id}`);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors duration-100 cursor-pointer"
                aria-label="Edit provider"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={(e) => handleToggleStatus(e, provider)}
                className={`p-1.5 rounded-lg transition-colors duration-100 cursor-pointer ${
                  provider.status === "active"
                    ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                    : "text-gray-400 hover:text-teal-600 hover:bg-teal-50"
                }`}
                aria-label={
                  provider.status === "active"
                    ? "Suspend provider"
                    : "Activate provider"
                }
              >
                {provider.status === "active" ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} />
                )}
              </button>
            </div>
          )}
        </td>
      </tr>
    ),
    [navigate],
  );

  return (
    <BaseTable
      header={
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className="px-5 py-3 text-xs font-medium tracking-wider text-gray-500 uppercase text-left"
            >
              {col.label}
            </th>
          ))}
        </tr>
      }
      colCount={columns.length}
      data={providers || []}
      rowRenderer={renderRow}
      isLoading={loading}
      currentPage={currentPage}
      totalPages={Math.ceil((providers?.length || 0) / 10)}
      onPageChange={setCurrentPage}
    />
  );
}

export default ProvidersTable;
