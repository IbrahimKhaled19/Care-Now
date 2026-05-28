import TabNavigation from "../ui/common/TabNavigation";
import RequestsTable from "../ui/Requests/RequestsTable";
import { useRequests } from "../hooks/useApi";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, X } from "lucide-react";
import BaseHeader from "../ui/common/BaseHeader";
import PageContainer from "../ui/common/PageContainer";
import Button from "../ui/common/Button";
import { api } from "../lib/api";
import { useToast } from "../ui/common/Toast";
import { useIsAdmin } from "../context/UserContext";

// Tab ID → backend enum value for filtering
const STATUS_FILTER = {
  waiting: "waiting",
  inprogress: "in_progress",
  completed: "completed",
  canceled: "canceled",
};

const Requests = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeRequestTab, setActiveRequestTab] = useState(searchParams.get("tab") || "waiting");

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
  const { data: allRequests, refetch } = useRequests({});

  // Lazy fetch: only load patients/providers when form is open
  const { data: patientsRes } = useQuery({
    queryKey: ["patients-list"],
    queryFn: () => api.get("/patients?limit=100"),
    enabled: showForm,
    staleTime: 60_000,
  });
  const { data: providersRes } = useQuery({
    queryKey: ["providers-list"],
    queryFn: () => api.get("/providers?limit=100"),
    enabled: showForm,
    staleTime: 60_000,
  });
  const patients = patientsRes?.data || patientsRes || [];
  const providers = providersRes?.data || providersRes || [];
  const toast = useToast();
  const isAdmin = useIsAdmin();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    patient_id: "",
    provider_id: "",
    service: "",
    date: "",
    status: "Waiting",
  });

  const counts = useMemo(() => {
    const c = { waiting: 0, inprogress: 0, completed: 0, canceled: 0 };
    for (const r of allRequests || []) {
      const key = r.status === "in_progress" ? "inprogress" : r.status;
      if (key in c) c[key]++;
    }
    return c;
  }, [allRequests]);

  const filters = {
    status: activeRequestTab === "all" ? undefined : STATUS_FILTER[activeRequestTab],
  };

  const tabs = [
    { id: "waiting", label: "Waiting", count: counts.waiting },
    { id: "inprogress", label: "In Progress", count: counts.inprogress },
    { id: "completed", label: "Completed", count: counts.completed },
    { id: "canceled", label: "Canceled", count: counts.canceled },
  ];

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post("/requests", {
        patient_id: form.patient_id || null,
        provider_id: form.provider_id || null,
        service: form.service,
        date: form.date || null,
        status: "waiting",
      });
      toast.success("Request created");
      setShowForm(false);
      setForm({ patient_id: "", provider_id: "", service: "", date: "", status: "Waiting" });
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <BaseHeader
        title="Requests"
        subtitle="Manage and track care requests"
        actions={
          isAdmin && (
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} className="mr-1.5" />
              New Request
            </Button>
          )
        }
      />

      {showForm && (
        <div className="mt-4 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">New Request</h3>
            <button
              onClick={() => setShowForm(false)}
              className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label htmlFor="request-patient" className="block text-xs font-medium text-gray-600 mb-1">Patient</label>
              <select
                id="request-patient"
                required
                value={form.patient_id}
                onChange={(e) => setForm((f) => ({ ...f, patient_id: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
              >
                <option value="">Select patient...</option>
                {(patients || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="request-provider" className="block text-xs font-medium text-gray-600 mb-1">Provider</label>
              <select
                id="request-provider"
                value={form.provider_id}
                onChange={(e) => setForm((f) => ({ ...f, provider_id: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
              >
                <option value="">Select provider...</option>
                {(providers || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="request-service" className="block text-xs font-medium text-gray-600 mb-1">Service</label>
              <input
                id="request-service"
                type="text"
                required
                value={form.service}
                onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="e.g. Home Care, Physical Therapy"
              />
            </div>
            <div>
              <label htmlFor="request-date" className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input
                id="request-date"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Creating..." : "Create Request"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6">
        <TabNavigation
          tabs={tabs}
          activeTab={activeRequestTab}
          onTabChange={(v) => { setActiveRequestTab(v); updateUrl({ tab: v }); }}
        />
      </div>

      <div className="mt-4">
        <RequestsTable filters={filters} />
      </div>
    </PageContainer>
  );
};

export default Requests;
