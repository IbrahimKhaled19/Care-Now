import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Pause, Play } from "lucide-react";
import { usePatients } from "../../hooks/useApi";
import { formatDate } from "../../lib/formatDate";
import { useToast } from "../common/Toast";
import { api } from "../../lib/api";
import StatusBadge from "../common/StatusBadge";
import BaseTable from "../common/BaseTable";
import InitialsAvatar from "../common/InitialsAvatar";

const columns = ["Patient", "Status", "Location", "Date Joined", ""];

const PatientsTable = ({ filters = {} }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const { data: patients, loading, refetch } = usePatients(filters);
  const toast = useToast();

  const handleToggleStatus = async (e, patient) => {
    e.stopPropagation();
    const newStatus = patient.state === "active" ? "suspended" : "active";
    try {
      await api.put(`/patients/${patient.id}`, { status: newStatus });
      toast.success(`Patient ${newStatus === "suspended" ? "suspended" : "activated"} successfully.`);
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to update patient status.");
    }
  };

  const header = (
    <tr>
      {columns.map((h) => (
        <th key={h} className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
          {h}
        </th>
      ))}
    </tr>
  );

  const renderRow = (patient) => (
    <tr
      key={patient.id}
      className="hover:bg-gray-50 cursor-pointer transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-inset"
      onClick={() => navigate(`/patients/${patient.id}`)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(`/patients/${patient.id}`); }}}
      tabIndex={0}
      role="link"
      aria-label={`View ${patient.name}`}
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <InitialsAvatar name={patient.name} />
          <div>
            <p className="text-sm font-medium text-gray-800">{patient.name}</p>
            <p className="text-xs text-gray-500">{patient.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <StatusBadge status={patient.state} />
      </td>
      <td className="px-5 py-3.5 text-sm text-gray-600">{patient.location}</td>
      <td className="px-5 py-3.5 text-sm text-gray-600">{formatDate(patient.date)}</td>
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient.id}`); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors duration-100 cursor-pointer"
            aria-label="View patient"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => handleToggleStatus(e, patient)}
            className={`p-1.5 rounded-lg transition-colors duration-100 cursor-pointer ${
              patient.state === "active"
                ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                : "text-gray-400 hover:text-teal-600 hover:bg-teal-50"
            }`}
            aria-label={patient.state === "active" ? "Suspend patient" : "Activate patient"}
          >
            {patient.state === "active" ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <BaseTable
      header={header}
      colCount={columns.length}
      data={patients || []}
      rowRenderer={renderRow}
      isLoading={loading}
      currentPage={currentPage}
      totalPages={Math.ceil((patients?.length || 0) / 10)}
      onPageChange={setCurrentPage}
    />
  );
};

export default PatientsTable;
