import {
  MapPin,
  Truck,
  CheckCircle,
  Clipboard,
  Clock,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StateItem from "./StateItem";
import ProfileCard from "./ProfileCard";
import BaseHeader from "../common/BaseHeader";
import PageContainer from "../common/PageContainer";
import Skeleton from "../common/Skeleton";
import { useRequest } from "../../hooks/useApi";
import { api } from "../../lib/api";
import { useToast } from "../common/Toast";
import { useIsAdmin } from "../../context/UserContext";

const STATUS_STEPS = [
  { key: "waiting", label: "Waiting", icon: <Clock size={16} /> },
  { key: "in_progress", label: "In Progress", icon: <Truck size={16} /> },
  { key: "completed", label: "Completed", icon: <CheckCircle size={16} /> },
];

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: request, loading, error } = useRequest(id);
  const [updating, setUpdating] = useState(false);
  const isAdmin = useIsAdmin();

  // Fetch individual patient/provider for avatars (not full lists)
  const { data: patient } = useQuery({
    queryKey: ["patient", request?.patient_id],
    queryFn: () => api.get(`/patients/${request.patient_id}`),
    enabled: !!request?.patient_id,
  });
  const { data: provider } = useQuery({
    queryKey: ["provider", request?.provider_id],
    queryFn: () => api.get(`/providers/${request.provider_id}`),
    enabled: !!request?.provider_id,
  });

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      await api.patch(`/requests/${id}`, { status: newStatus });
      toast.success(
        `Request ${newStatus === "in_progress" ? "started" : newStatus === "completed" ? "completed" : "canceled"}`,
      );
      navigate("/requests");
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const patientData = request
    ? { name: request.patient_name, email: "", location: "", dateJoined: "", avatar: patient?.avatar }
    : null;
  const providerData = request
    ? { name: request.provider_name, email: "", location: "", dateJoined: "", avatar: provider?.avatar }
    : null;

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-5">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-24" />
        </div>
      </PageContainer>
    );
  }

  if (error || !request) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-sm text-gray-500">Request not found.</p>
          <Link to="/requests" className="text-sm font-medium text-teal-600 hover:text-teal-800">
            Back to Requests
          </Link>
        </div>
      </PageContainer>
    );
  }

  const status = request.status;
  const showStart = status === "waiting";
  const showComplete = status === "in_progress";
  const showCancel = status === "waiting" || status === "in_progress";
  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === status);

  return (
    <PageContainer>
      <div className="border-b border-gray-100 pb-5 mb-8">
        <BaseHeader
          title="Request Details"
          subtitle={`Service: ${request.service || "N/A"}`}
          actions={
            <div className="flex items-center gap-2">
              {isAdmin && showStart && (
                <button onClick={() => handleStatusChange("in_progress")} disabled={updating}
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer">
                  Start
                </button>
              )}
              {isAdmin && showComplete && (
                <button onClick={() => handleStatusChange("completed")} disabled={updating}
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer">
                  Complete
                </button>
              )}
              {isAdmin && showCancel && (
                <button onClick={() => handleStatusChange("canceled")} disabled={updating}
                  className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer">
                  Cancel
                </button>
              )}
              <Link to="/requests" className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-700 transition-colors duration-150">
                <ArrowLeft size={16} />
                Back to Requests
              </Link>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <ProfileCard profile={patientData} type="patient" />
        <ProfileCard profile={providerData} type="provider" />
      </div>

      {/* Status timeline — real status from DB */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Status</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {STATUS_STEPS.map((step, idx) => (
            <span key={step.key} className="flex items-center gap-3">
              <StateItem icon={step.icon} label={step.label} active={idx <= currentStepIdx} />
              {idx < STATUS_STEPS.length - 1 && <ArrowIcon />}
            </span>
          ))}
        </div>
      </div>

      {/* Request info — real data or N/A */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Service</span>
            <p className="text-gray-700 font-medium">{request.service || "N/A"}</p>
          </div>
          <div>
            <span className="text-gray-500">Date</span>
            <p className="text-gray-700 font-medium">{request.date || "N/A"}</p>
          </div>
          <div>
            <span className="text-gray-500">Created</span>
            <p className="text-gray-700 font-medium">{request.created_at ? new Date(request.created_at).toLocaleDateString() : "N/A"}</p>
          </div>
          <div>
            <span className="text-gray-500">Request ID</span>
            <p className="text-gray-700 font-medium">#{request.id}</p>
          </div>
        </div>
      </div>

      {/* Location — show if available, otherwise N/A */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Location</h4>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
            <MapPin size={20} className="text-teal-600" />
          </div>
          <div>
            <p className="text-sm text-gray-700">{request.location || "No location assigned"}</p>
            {request.location_url ? (
              <a href={request.location_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors duration-150 mt-1">
                View map <ArrowRight size={14} />
              </a>
            ) : (
              <span className="text-xs text-gray-400 mt-1 block">Map not available</span>
            )}
          </div>
        </div>
      </div>

      {/* Notes — real data or empty state */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Notes</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          {request.notes || "No notes added yet."}
        </p>
      </div>
    </PageContainer>
  );
};

const ArrowIcon = () => (
  <ArrowRight size={16} className="text-gray-300 shrink-0" />
);

export default RequestDetails;
