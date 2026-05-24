import { useState } from "react";
import ProvidersFilter from "../ui/Providers/ProvidersFilter";
import ProvidersTable from "../ui/Providers/ProvidersTable";
import BaseHeader from "../ui/common/BaseHeader";
import PageContainer from "../ui/common/PageContainer";
import Button from "../ui/common/Button";
import { useToast } from "../ui/common/Toast";
import { api } from "../lib/api";
import { UserPlus, X } from "lucide-react";

function Providers() {
  const [activeTab, setActiveTab] = useState("all-providers");
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ full_name: "", email: "", specialty: "", credentials: "" });
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
      await api.post("/providers", {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        specialty: formData.specialty.trim() || undefined,
        credentials: formData.credentials.trim() || undefined,
      });
      toast.success("Provider created successfully.");
      setShowForm(false);
      setFormData({ full_name: "", email: "", specialty: "", credentials: "" });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message || "Failed to create provider.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <BaseHeader
        title="Providers"
        subtitle="Manage and oversee healthcare providers"
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X size={16} className="mr-2" /> : <UserPlus size={16} className="mr-2" />}
            {showForm ? "Cancel" : "New Provider"}
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-5 bg-white rounded-xl border border-gray-100 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Dr. Jane Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
              <input
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Cardiology"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credentials</label>
              <input
                name="credentials"
                value={formData.credentials}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="MD, Board Certified"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Provider"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 mb-5">
        <ProvidersFilter
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSearch={setSearchQuery}
          onFilterChange={setStatusFilter}
        />
      </div>

      <ProvidersTable key={refreshKey} filters={{ status: statusFilter, search: searchQuery }} />
    </PageContainer>
  );
}

export default Providers;
