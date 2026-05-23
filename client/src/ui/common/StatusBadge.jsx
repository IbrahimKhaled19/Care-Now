const statusStyles = {
  active: "bg-teal-50 text-teal-700",
  completed: "bg-teal-50 text-teal-700",
  pending: "bg-amber-50 text-amber-700",
  inprogress: "bg-amber-50 text-amber-700",
  in_progress: "bg-amber-50 text-amber-700",
  "in progress": "bg-amber-50 text-amber-700",
  waiting: "bg-gray-100 text-gray-700",
  canceled: "bg-error-50 text-error-600",
  suspended: "bg-error-50 text-error-600",
  inactive: "bg-gray-100 text-gray-700",
  failed: "bg-error-50 text-error-600",
  "on-hold": "bg-amber-50 text-amber-700",
  "on_hold": "bg-amber-50 text-amber-700",
  frozen: "bg-gray-100 text-gray-700",
};

// Normalize enum values to display labels
const displayLabels = {
  in_progress: "In Progress",
  on_hold: "On-Hold",
};

function StatusBadge({ status, className = "" }) {
  const key = status?.toLowerCase?.() || "";
  const label = displayLabels[key] || status;

  return (
    <span
      role="status"
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
        statusStyles[key] || statusStyles.waiting
      } ${className}`}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
