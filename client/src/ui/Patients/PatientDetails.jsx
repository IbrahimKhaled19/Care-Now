import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Heart,
  Pill,
  AlertTriangle,
  Accessibility,
  MapPin,
  Calendar,
  Mail,
  ArrowLeft,
  Pause,
  Play,
} from "lucide-react";
import { usePatient, usePatientTransactions, usePatientMedical } from "../../hooks/useApi";
import { useToast } from "../common/Toast";
import { formatDate } from "../../lib/formatDate";
import { api } from "../../lib/api";
import InitialsAvatar from "../common/InitialsAvatar";
import StatusBadge from "../common/StatusBadge";
import Button from "../common/Button";
import BaseHeader from "../common/BaseHeader";
import BaseTable from "../common/BaseTable";
import PageContainer from "../common/PageContainer";
import Skeleton from "../common/Skeleton";
import CredentialsList from "../common/CredentialsList";
import { useIsAdmin } from "../../context/UserContext";

const medicalIcons = {
  "Chronic Conditions": Heart,
  "Current Medications": Pill,
  "Allergies": AlertTriangle,
  "Disabilities": Accessibility,
};

const documents = [
  { label: "Front ID", required: true },
  { label: "Back ID", required: true },
  { label: "Medical Records", required: false },
];

function PatientDetails() {
  const { id } = useParams();
  const { data: patient, loading, error, refetch } = usePatient(id);
  const { data: transactions, loading: loadingTx } = usePatientTransactions(id);
  const { data: medicalInfo, loading: loadingMed } = usePatientMedical(id);
  const [toggling, setToggling] = useState(false);
  const toast = useToast();
  const isAdmin = useIsAdmin();

  const handleToggleStatus = async () => {
    const newStatus = patient.status === "active" ? "suspended" : "active";
    setToggling(true);
    try {
      await api.patch(`/patients/${id}`, { status: newStatus });
      toast.success(`Patient ${newStatus === "suspended" ? "suspended" : "activated"} successfully.`);
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to update patient status.");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-100 rounded w-64" />
          <div className="h-48 bg-gray-100 rounded-xl mt-6" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
        <p className="text-sm text-gray-500">{error}</p>
        <Link to="/patients" className="inline-flex items-center gap-2 mt-4 text-sm text-teal-600 hover:text-teal-800">
          <ArrowLeft size={16} /> Back to Patients
        </Link>
      </PageContainer>
    );
  }

  if (!patient) {
    return (
      <PageContainer>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Patient Not Found</h1>
        <p className="text-sm text-gray-500">No patient found with ID "{id}".</p>
        <Link to="/patients" className="inline-flex items-center gap-2 mt-4 text-sm text-teal-600 hover:text-teal-800">
          <ArrowLeft size={16} /> Back to Patients
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="border-b border-gray-100 pb-5 mb-8">
        <BaseHeader
          title="Patient Details"
          subtitle="View patient profile and care history"
          actions={
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button
                  variant={patient.status === "active" ? "secondary" : "primary"}
                  size="sm"
                  onClick={handleToggleStatus}
                  disabled={toggling}
                >
                  {patient.status === "active" ? <Pause size={14} className="mr-1.5" /> : <Play size={14} className="mr-1.5" />}
                  {toggling ? "Updating..." : patient.status === "active" ? "Suspend" : "Activate"}
                </Button>
              )}
              <Link to="/patients" className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-700 transition-colors duration-150">
                <ArrowLeft size={16} /> Back to Patients
              </Link>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <InitialsAvatar name={patient.full_name} src={patient.avatar} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{patient.full_name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Patient</p>
                </div>
                <StatusBadge status={patient.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} className="text-gray-400" />
                  <span>{patient.email}</span>
                </div>
                {patient.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{patient.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={14} className="text-gray-400" />
                  <span>Joined {formatDate(patient.date_joined)}</span>
                </div>
              </div>

              <div className="mt-4">
                <CredentialsList items={documents} showLabel="View Documents" hideLabel="Hide Documents" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Medical Info</h3>
          {loadingMed ? (
            <Skeleton className="h-32 w-full" />
          ) : (medicalInfo || []).length === 0 ? (
            <p className="text-sm text-gray-500">No medical info on file.</p>
          ) : (
            <div className="space-y-4">
              {(medicalInfo || []).map((info) => {
                const InfoIcon = medicalIcons[info.category] || Heart;
                return (
                  <div key={info.id}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <InfoIcon size={14} className="text-teal-600" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{info.category}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 ml-6">
                      {info.items.map((item) => (
                        <span key={item} className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs rounded-lg">{item}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Transaction History</h3>
        {loadingTx ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <BaseTable
            header={
              <tr>
                {["Transaction ID", "Provider", "Date", "Service", "Amount", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            }
            colCount={6}
            data={transactions || []}
            currentPage={1}
            totalPages={1}
            emptyMessage="No transactions found for this patient."
            rowRenderer={(tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors duration-100">
                <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{tx.id}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{tx.provider_name}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{formatDate(tx.date)}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{tx.service}</td>
                <td className="px-5 py-3.5 text-sm font-medium text-gray-800">${parseFloat(tx.amount).toFixed(2)}</td>
                <td className="px-5 py-3.5"><StatusBadge status={tx.status} /></td>
              </tr>
            )}
          />
        )}
      </div>
    </PageContainer>
  );
}

export default PatientDetails;
