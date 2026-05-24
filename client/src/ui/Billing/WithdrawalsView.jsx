import { useState, useCallback } from "react";
import { Download } from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import BaseTable from "../common/BaseTable";
import SearchFilterBar from "../common/SearchFilterBar";
import Button from "../common/Button";
import { useWithdrawals } from "../../hooks/useApi";
import { formatDate } from "../../lib/formatDate";
import { exportCsv } from "../../lib/exportCsv";
import { api } from "../../lib/api";
import { useToast } from "../common/Toast";
import { useIsAdmin } from "../../context/UserContext";

const columns = [
  "ID",
  "Name",
  "Email",
  "Amount",
  "Status",
  "Method",
  "Requested",
  "Processed",
];

const STATUS_OPTIONS = ["pending", "completed", "failed"];

const header = (
  <tr>
    {columns.map((h) => (
      <th
        key={h}
        className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
      >
        {h}
      </th>
    ))}
  </tr>
);

function WithdrawalsView() {
  const [statusFilter, setStatusFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const filters = statusFilter ? { status: statusFilter } : {};
  const { data: withdrawals, loading, refetch } = useWithdrawals(filters);
  const toast = useToast();
  const isAdmin = useIsAdmin();

  const rows = withdrawals || [];

  const handleExport = () => {
    exportCsv(
      "withdrawals.csv",
      ["ID", "Name", "Email", "Amount", "Status", "Method", "Requested", "Processed"],
      rows.map((w) => [w.id, w.name, w.email, `$${parseFloat(w.amount).toFixed(2)}`, w.status, w.method, formatDate(w.requestedDate), formatDate(w.processedDate)])
    );
  };

  const handleStatusChange = useCallback(
    async (id, newStatus) => {
      try {
        setUpdatingId(id);
        await api.put(`/withdrawals/${id}`, { status: newStatus });
        toast.success(`Withdrawal marked as ${newStatus}`);
        refetch();
      } catch (err) {
        toast.error(err.message || "Failed to update status");
      } finally {
        setUpdatingId(null);
      }
    },
    [refetch, toast],
  );

  const renderRow = useCallback(
    (w) => {
      const busy = updatingId === w.id;
      return (
        <tr
          key={w.id}
          className="hover:bg-gray-50 transition-colors duration-100"
        >
          <td className="px-5 py-3.5 text-sm font-medium text-gray-800">
            {w.id}
          </td>
          <td className="px-5 py-3.5 text-sm text-gray-600">{w.user_name || w.name}</td>
          <td className="px-5 py-3.5 text-sm text-gray-600">{w.user_email || w.email}</td>
          <td className="px-5 py-3.5 text-sm font-medium text-gray-800">
            {w.amount}
          </td>
          <td className="px-5 py-3.5">
            {isAdmin ? (
              <select
                value={w.status}
                onChange={(e) => handleStatusChange(w.id, e.target.value)}
                disabled={busy}
                className="text-xs font-medium px-2 py-1 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer disabled:opacity-50"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <StatusBadge status={w.status} />
            )}
          </td>
          <td className="px-5 py-3.5 text-sm text-gray-600">{w.method}</td>
          <td className="px-5 py-3.5 text-sm text-gray-600">
            {formatDate(w.requestedDate)}
          </td>
          <td className="px-5 py-3.5 text-sm text-gray-600">
            {formatDate(w.processedDate)}
          </td>
        </tr>
      );
    },
    [handleStatusChange, updatingId],
  );

  return (
    <div>
      <div className="mb-4">
        <SearchFilterBar
          filterOptions={["completed", "pending", "failed"]}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </div>

      <BaseTable
        header={header}
        colCount={columns.length}
        data={rows}
        currentPage={currentPage}
        totalPages={1}
        onPageChange={setCurrentPage}
        rowRenderer={renderRow}
        emptyMessage="No withdrawals found."
        emptyActionLabel={statusFilter ? "Clear filter" : undefined}
        onEmptyAction={() => setStatusFilter(null)}
        isLoading={loading}
      />

      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={handleExport} disabled={rows.length === 0}>
          <Download size={16} className="mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
}

export default WithdrawalsView;
