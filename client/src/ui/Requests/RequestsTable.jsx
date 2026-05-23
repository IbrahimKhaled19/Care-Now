import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import BaseTable from "../common/BaseTable";
import StatusBadge from "../common/StatusBadge";
import ConfirmationDialog from "../Admins Management/ConfirmationDialog";
import { useRequests } from "../../hooks/useApi";
import { formatDate } from "../../lib/formatDate";
import { api } from "../../lib/api";
import { useToast } from "../common/Toast";

const columns = [
  { key: "id", label: "Request ID" },
  { key: "patient", label: "Patient" },
  { key: "provider", label: "Provider" },
  { key: "service", label: "Service" },
  { key: "status", label: "Status" },
  { key: "date", label: "Date" },
  { key: "actions", label: "" },
];

// API returns lowercase enum: waiting, in_progress, completed, canceled
const NEXT_STATUS = {
  waiting: "in_progress",
  in_progress: "completed",
};

const CANCELABLE = new Set(["waiting", "in_progress"]);

export const RequestsTable = ({ filters = {} }) => {
  const { data: requests, loading, refetch } = useRequests(filters);
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const ITEMS_PER_PAGE = 10;
  const data = requests || [];
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const handleStatusChange = useCallback(
    async (id, newStatus) => {
      try {
        setUpdatingId(id);
        await api.put(`/requests/${id}`, { status: newStatus });
        toast.success(
          `Request ${newStatus === "in_progress" ? "started" : newStatus === "completed" ? "completed" : "canceled"}`,
        );
        refetch();
      } catch (err) {
        toast.error(err.message || "Failed to update status");
      } finally {
        setUpdatingId(null);
      }
    },
    [refetch, toast],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/requests/${deleteId}`);
      toast.success("Request deleted");
      setDeleteId(null);
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to delete request");
    }
  }, [deleteId, refetch, toast]);

  const renderRow = useCallback(
    (request) => {
      const nextStatus = NEXT_STATUS[request.status];
      const canCancel = CANCELABLE.has(request.status);
      const busy = updatingId === request.id;

      return (
        <tr
          key={request.id}
          className="hover:bg-gray-50 transition-colors duration-100"
        >
          <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium text-gray-800">
            #{request.id}
          </td>
          <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
            {request.patient_name}
          </td>
          <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
            {request.provider_name}
          </td>
          <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
            {request.service}
          </td>
          <td className="px-5 py-3.5 whitespace-nowrap">
            <StatusBadge status={request.status} />
          </td>
          <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">
            {formatDate(request.date)}
          </td>
          <td className="px-5 py-3.5 whitespace-nowrap">
            <div className="flex items-center gap-2">
              {nextStatus && (
                <button
                  onClick={() => handleStatusChange(request.id, nextStatus)}
                  disabled={busy}
                  className="text-xs font-medium px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {nextStatus === "in_progress" ? "Start" : "Complete"}
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => handleStatusChange(request.id, "canceled")}
                  disabled={busy}
                  className="text-xs font-medium px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <Link
                to={`/requests/${request.id}`}
                className="text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors duration-150"
              >
                Details
              </Link>
              <button
                onClick={() => setDeleteId(request.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                aria-label="Delete request"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </td>
        </tr>
      );
    },
    [handleStatusChange, updatingId],
  );

  return (
    <>
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
        data={data}
        rowRenderer={renderRow}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        isLoading={loading}
      />
      <ConfirmationDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Request"
        message="Are you sure you want to delete this request? This action cannot be undone."
      />
    </>
  );
};

export default RequestsTable;
