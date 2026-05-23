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
import StateItem from "./StateItem";
import ProfileCard from "./ProfileCard";
import BaseHeader from "../common/BaseHeader";
import PageContainer from "../common/PageContainer";
import { useRequest } from "../../hooks/useApi";
import { api } from "../../lib/api";
import { useToast } from "../common/Toast";

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: request, loading, error } = useRequest(id);
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      await api.put(`/requests/${id}`, { status: newStatus });
      toast.success(`Request ${newStatus === "in_progress" ? "started" : newStatus === "completed" ? "completed" : "canceled"}`);
      navigate("/requests");
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const patientData = request
    ? { name: request.patient_name, email: "", location: "", dateJoined: "" }
    : null;
  const providerData = request
    ? { name: request.provider_name, email: "", location: "", dateJoined: "" }
    : null;

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-500">Loading request details...</p>
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

  return (
    <PageContainer>
      <div className="border-b border-gray-100 pb-5 mb-8">
        <BaseHeader
          title="Request Details"
          subtitle="Track request status and manage care delivery"
          actions={
            <div className="flex items-center gap-2">
              {showStart && (
                <button
                  onClick={() => handleStatusChange("in_progress")}
                  disabled={updating}
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Start
                </button>
              )}
              {showComplete && (
                <button
                  onClick={() => handleStatusChange("completed")}
                  disabled={updating}
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Complete
                </button>
              )}
              {showCancel && (
                <button
                  onClick={() => handleStatusChange("canceled")}
                  disabled={updating}
                  className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <Link
                to="/requests"
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-700 transition-colors duration-150"
              >
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

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Current State
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          <StateItem icon={<CheckCircle size={16} />} label="Accepted" active />
          <ArrowIcon />
          <StateItem icon={<Truck size={16} />} label="On the way" />
          <ArrowIcon />
          <StateItem icon={<MapPin size={16} />} label="Arrived" />
          <ArrowIcon />
          <StateItem icon={<Clock size={16} />} label="In progress" />
          <ArrowIcon />
          <StateItem icon={<Clipboard size={16} />} label="Take Notes" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Accepted</h4>
        <div className="flex items-center justify-between bg-teal-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
              <MapPin size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">3.2 km</span> &middot;{" "}
                <span className="font-semibold">12 mins</span> ETA
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Al Khalyfa Al Zafer St
              </p>
            </div>
          </div>
          <a
            href="#"
            className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors duration-150"
          >
            View map
            <ArrowRight size={14} />
          </a>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Notes</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          I need someone to come now to take blood samples for routine lab tests
          (CBC and blood sugar). Please make sure the samples are labeled
          correctly and handled carefully for delivery to the lab.
        </p>
      </div>
    </PageContainer>
  );
};

const ArrowIcon = () => (
  <ArrowRight size={16} className="text-gray-300 shrink-0" />
);

export default RequestDetails;
