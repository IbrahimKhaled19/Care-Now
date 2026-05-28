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

const EMPTY = [];
const ITEMS_PER_PAGE = 10;
const columns = ["ID", "Name", "Email", "Amount", "Status", "Method", "Requested", "Processed"];
const STATUS_OPTIONS = ["pending", "completed", "failed"];

const header = (
  <tr>
    {columns.map((h) => (
      <th key={h} className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
    ))}
  </tr>
);

function WithdrawalsView() {
  const [statusFilter, setStatusFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const toast = useToast();
  const isAdmin = useIsAdmin();

  const { data: withdrawals, meta, loading, error, refetch } = useWithdrawals({
    ...(statusFilter ? { status: statusFilter } : {}),
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  });
  const rows = withdrawals || EMPTY;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-500 mb-3">Failed to load withdrawals</p>
        <button onClick={refetch} className="text-sm text-teal-600 underline cursor-pointer">Retry</button>
      </div>
    );
  }

  const handleExport = () => {
    exportCsv(
      "withdrawals.csv",
      columns,
      rows.map((w) => [w.id, w.user_name || w.name || "", w.user_email || w.email || "", `$${parseFloat(w.amount).toFixed(2)}`, w.status, w.method, formatDate(w.requested_date), formatDate(w.processed_date)])
    );
  };

  const handleStatusChange = useCallback(async (id, newStatus) => {
    try {
      setUpdatingId(id);
      await api.patch(`/withdrawals/${id}`, { status: newStatus });
      toast.success(`Withdrawal marked as ${newStatus}`);
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }, [refetch, toast]);

  const renderRow = useCallback((w) => {
    const busy = updatingId === w.id;
    return (
      <tr key={w.id} className="hover:bg-gray-50 transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-inset" tabIndex={0} role="row" aria-label={`Withdrawal ${w.id}`}>
        <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{w.id}</td>
        <td className="px-5 py-3.5 text-sm text-gray-600">{w.user_name || w.name || "—"}</td>
        <td className="px-5 py-3.5 text-sm text-gray-600">{w.user_email || w.email || "—"}</td>
        <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{w.amount}</td>
        <td className="px-5 py-3.5">
          {isAdmin ? (
            <select value={w.status} onChange={(e) => handleStatusChange(w.id, e.target.value)} disabled={busy}
              className="text-xs font-medium px-2 py-1 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer disabled:opacity-50">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : <StatusBadge status={w.status} />}
        </td>
        <td className="px-5 py-3.5 text-sm text-gray-600">{w.method}</td>
        <td className="px-5 py-3.5 text-sm text-gray-600">{formatDate(w.requested_date)}</td>
        <td className="px-5 py-3.5 text-sm text-gray-600">{formatDate(w.processed_date)}</td>
      </tr>
    );
  }, [handleStatusChange, updatingId, isAdmin]);

  return (
    <div>
      <div className="mb-4">
        <SearchFilterBar filterOptions={["completed", "pending", "failed"]} statusFilter={statusFilter} onFilterChange={(v) => { setStatusFilter(v); setCurrentPage(1); }} />
      </div>
      <BaseTable
        header={header}
        colCount={columns.length}
        data={rows}
        meta={meta}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        pageSize={ITEMS_PER_PAGE}
        rowRenderer={renderRow}
        emptyMessage="No withdrawals found."
        emptyActionLabel={statusFilter ? "Clear filter" : undefined}
        onEmptyAction={() => { setStatusFilter(null); setCurrentPage(1); }}
        isLoading={loading}
      />
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={handleExport} disabled={rows.length === 0}>
          <Download size={16} className="mr-2" /> Export
        </Button>
      </div>
    </div>
  );
}

export default WithdrawalsView;
