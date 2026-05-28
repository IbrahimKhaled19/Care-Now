import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import PatientsSearchBar from "../ui/Patients/PatientSearchBar";
import PatientsTable from "../ui/Patients/PatientTable";
import BaseHeader from "../ui/common/BaseHeader";
import PageContainer from "../ui/common/PageContainer";
import Button from "../ui/common/Button";
import { useToast } from "../ui/common/Toast";
import { api } from "../lib/api";
import { UserPlus, X } from "lucide-react";
import { useIsAdmin } from "../context/UserContext";

function Patient() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const updateUrl = (updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(updates)) {
        if (v) next.set(k, v); else next.delete(k);
      }
      return next;
    });
  };
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    location: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();
  const isAdmin = useIsAdmin();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/patients", {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        location: formData.location.trim() || undefined,
      });
      toast.success("Patient created successfully.");
      setShowForm(false);
      setFormData({ full_name: "", email: "", location: "" });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    } catch (err) {
      toast.error(err.message || "Failed to create patient.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <BaseHeader
        title="Patients"
        subtitle="Manage patient records and activity"
        actions={
          isAdmin && (
            <Button onClick={() => setShowForm((v) => !v)}>
              {showForm ? (
                <X size={16} className="mr-2" />
              ) : (
                <UserPlus size={16} className="mr-2" />
              )}
              {showForm ? "Cancel" : "New Patient"}
            </Button>
          )
        }
      />

      {isAdmin && showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-5 bg-white rounded-xl border border-gray-100 p-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="patient-full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                id="patient-full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="patient-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                id="patient-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label htmlFor="patient-location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                id="patient-location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="New York, NY"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Patient"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-5">
        <PatientsSearchBar
          onSearch={(v) => { setSearchQuery(v); updateUrl({ search: v }); }}
          onFilterChange={(v) => { setStatusFilter(v); updateUrl({ status: v }); }}
        />
      </div>
      <div className="mt-5">
        <PatientsTable
          filters={{ status: statusFilter, search: searchQuery }}
        />
      </div>
    </PageContainer>
  );
}

export default Patient;
