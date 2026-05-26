import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import Skeleton from "./Skeleton";

function EmptyState({ message, actionLabel, onAction }) {
  return (
    <tr>
      <td colSpan={99} className="px-5 py-12">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
            <Inbox size={24} className="text-gray-300" aria-hidden="true" />
          </div>
          <p className="text-sm text-gray-500 mb-3">
            {message || "No data available"}
          </p>
          {actionLabel && (
            <button
              onClick={onAction}
              className="text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function LoadingRows({ colCount }) {
  return Array.from({ length: 5 }, (_, i) => (
    <tr key={i} className="border-b border-gray-50">
      <td colSpan={colCount} className="px-5 py-3.5">
        <Skeleton className="h-4 w-full" />
      </td>
    </tr>
  ));
}

function BaseTable({
  header,
  colCount = 1,
  data = [],
  meta = null,
  rowRenderer,
  showPagination = true,
  currentPage = 1,
  totalPages,
  onPageChange,
  isLoading = false,
  className = "",
  pageSize = 10,
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
}) {
  // Server-side pagination: use meta.total for display
  // Client-side pagination: slice data locally (backward compat)
  const isServerPaginated = meta !== null;
  const totalItems = isServerPaginated ? meta.total : data.length;
  const computedTotalPages = totalPages || Math.max(1, Math.ceil(totalItems / pageSize));
  const hasMore = isServerPaginated ? meta.hasMore : currentPage < computedTotalPages;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = isServerPaginated
    ? (Array.isArray(data) ? data : [])
    : (Array.isArray(data) ? data.slice(startIndex, endIndex) : []);

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            {header}
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <LoadingRows colCount={colCount} />
            ) : currentData.length === 0 ? (
              <EmptyState
                message={emptyMessage}
                actionLabel={emptyActionLabel}
                onAction={onEmptyAction}
              />
            ) : rowRenderer ? (
              currentData.map((item, index) => rowRenderer(item, index))
            ) : (
              <EmptyState message="No row renderer provided" />
            )}
          </tbody>
        </table>
      </div>

      {showPagination && totalItems > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{" "}
            {totalItems}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-100"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-600 px-2">
              {currentPage} / {computedTotalPages}
            </span>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={!hasMore || isLoading}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-100"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import PropTypes from "prop-types";

BaseTable.propTypes = {
  header: PropTypes.node,
  colCount: PropTypes.number,
  data: PropTypes.array,
  meta: PropTypes.shape({
    total: PropTypes.number,
    page: PropTypes.number,
    limit: PropTypes.number,
    hasMore: PropTypes.bool,
  }),
  rowRenderer: PropTypes.func,
  showPagination: PropTypes.bool,
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
  pageSize: PropTypes.number,
  emptyMessage: PropTypes.string,
  emptyActionLabel: PropTypes.string,
  onEmptyAction: PropTypes.func,
};

export default BaseTable;
