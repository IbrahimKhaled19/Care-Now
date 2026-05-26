import { useState } from "react";
import { Download } from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import BaseTable from "../common/BaseTable";
import SearchFilterBar from "../common/SearchFilterBar";
import Button from "../common/Button";
import { useTransactions } from "../../hooks/useApi";
import { formatDate } from "../../lib/formatDate";
import { exportCsv } from "../../lib/exportCsv";

const columns = ["ID", "Date", "Patient", "Provider", "Service", "Amount", "Status"];

const header = (
  <tr>
    {columns.map((h) => (
      <th key={h} className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
    ))}
  </tr>
);

const renderRow = (tx) => (
  <tr key={tx.id} className="hover:bg-gray-50 transition-colors duration-100">
    <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{tx.id}</td>
    <td className="px-5 py-3.5 text-sm text-gray-600">{formatDate(tx.date)}</td>
    <td className="px-5 py-3.5 text-sm text-gray-600">{tx.patient_name || tx.patient || "—"}</td>
    <td className="px-5 py-3.5 text-sm text-gray-600">{tx.provider_name || tx.provider || "—"}</td>
    <td className="px-5 py-3.5 text-sm text-gray-600">{tx.service}</td>
    <td className="px-5 py-3.5 text-sm font-medium text-gray-800">${parseFloat(tx.amount).toFixed(2)}</td>
    <td className="px-5 py-3.5"><StatusBadge status={tx.status} /></td>
  </tr>
);

function TransactionsView() {
  const [statusFilter, setStatusFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const filters = statusFilter ? { status: statusFilter } : {};
  const { data: transactions, loading, error, refetch } = useTransactions(filters);

  const rows = transactions || [];

  const handleExport = () => {
    exportCsv(
      "transactions.csv",
      ["ID", "Date", "Patient", "Provider", "Service", "Amount", "Status"],
      rows.map((tx) => [tx.id, formatDate(tx.date), tx.patient_name || tx.patient || "", tx.provider_name || tx.provider || "", tx.service, `$${parseFloat(tx.amount).toFixed(2)}`, tx.status])
    );
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-500 mb-3">Failed to load transactions</p>
        <button onClick={refetch} className="text-sm text-teal-600 underline cursor-pointer">Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <SearchFilterBar
          filterOptions={["completed", "pending", "canceled"]}
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
        emptyMessage="No transactions found."
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

export default TransactionsView;
