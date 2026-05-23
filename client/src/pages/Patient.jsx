import { useState } from "react";
import PatientsSearchBar from "../ui/Patients/PatientSearchBar";
import PatientsTable from "../ui/Patients/PatientTable";
import BaseHeader from "../ui/common/BaseHeader";
import PageContainer from "../ui/common/PageContainer";
import Button from "../ui/common/Button";
import { useToast } from "../ui/common/Toast";
import { api } from "../lib/api";
import { UserPlus, X } from "lucide-react";

function Patient() {
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    location: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();

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
      setRefreshKey((k) => k + 1);
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
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? (
              <X size={16} className="mr-2" />
            ) : (
              <UserPlus size={16} className="mr-2" />
            )}
            {showForm ? "Cancel" : "New Patient"}
          </Button>
        }
      />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-5 bg-white rounded-xl border border-gray-100 p-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
          onSearch={setSearchQuery}
          onFilterChange={setStatusFilter}
        />
      </div>
      <div className="mt-5">
        <PatientsTable
          key={refreshKey}
          filters={{ status: statusFilter, search: searchQuery }}
        />
      </div>
    </PageContainer>
  );
}

export default Patient;
