import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useProvider,
  useProviderTransactions,
  useProviderServices,
} from "../../hooks/useApi";
import { useToast } from "../common/Toast";
import { formatDate } from "../../lib/formatDate";
import { api } from "../../lib/api";
import {
  ArrowLeft,
  Heart,
  User,
  Baby,
  Calendar,
  Mail,
  Star,
  Pause,
  Play,
  Stethoscope,
} from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import Button from "../common/Button";
import BaseHeader from "../common/BaseHeader";
import BaseTable from "../common/BaseTable";
import PageContainer from "../common/PageContainer";
import Skeleton from "../common/Skeleton";
import CredentialsList from "../common/CredentialsList";
import InitialsAvatar from "../common/InitialsAvatar";
import { useIsAdmin } from "../../context/UserContext";

const credentials = [
  { label: "Front ID", required: true },
  { label: "Back ID", required: true },
  { label: "Police Clearance", required: true },
  { label: "Membership Card", required: false },
  { label: "Graduation Certificate", required: false },
];

const serviceIcons = [Heart, User, Baby, Stethoscope];

function ProviderDetails() {
  const { id } = useParams();
  const { data: provider, loading, error, refetch } = useProvider(id);
  const { data: transactions, loading: loadingTx } =
    useProviderTransactions(id);
  const { data: services, loading: loadingServices } = useProviderServices(id);
  const [toggling, setToggling] = useState(false);
  const toast = useToast();
  const isAdmin = useIsAdmin();

  const handleToggleStatus = async () => {
    const newStatus = provider.status === "active" ? "suspended" : "active";
    setToggling(true);
    try {
      await api.patch(`/providers/${id}`, { status: newStatus });
      toast.success(
        `Provider ${newStatus === "suspended" ? "suspended" : "activated"} successfully.`,
      );
      refetch();
    } catch (err) {
      toast.error(err.message || "Failed to update provider status.");
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
        <Link
          to="/providers"
          className="inline-flex items-center gap-2 mt-4 text-sm text-teal-600 hover:text-teal-800"
        >
          <ArrowLeft size={16} /> Back to Providers
        </Link>
      </PageContainer>
    );
  }

  if (!provider) {
    return (
      <PageContainer>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Provider Not Found
        </h1>
        <p className="text-sm text-gray-500">
          No provider found with ID "{id}".
        </p>
        <Link
          to="/providers"
          className="inline-flex items-center gap-2 mt-4 text-sm text-teal-600 hover:text-teal-800"
        >
          <ArrowLeft size={16} /> Back to Providers
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="border-b border-gray-100 pb-5 mb-8">
        <BaseHeader
          title="Provider Details"
          subtitle="View provider profile and activity"
          actions={
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button
                  variant={provider.status === "active" ? "secondary" : "primary"}
                  size="sm"
                  onClick={handleToggleStatus}
                  disabled={toggling}
                >
                  {provider.status === "active" ? (
                    <Pause size={14} className="mr-1.5" />
                  ) : (
                    <Play size={14} className="mr-1.5" />
                  )}
                  {toggling
                    ? "Updating..."
                    : provider.status === "active"
                      ? "Suspend"
                      : "Activate"}
                </Button>
              )}
              <Link
                to="/providers"
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-700 transition-colors duration-150"
              >
                <ArrowLeft size={16} /> Back to Providers
              </Link>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <InitialsAvatar
              name={provider.full_name}
              src={provider.avatar}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {provider.full_name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {provider.specialty}
                  </p>
                </div>
                <StatusBadge status={provider.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} className="text-gray-400" />
                  <span>{provider.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={14} className="text-gray-400" />
                  <span>Joined {formatDate(provider.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span>{provider.rating || "—"} rating</span>
                </div>
                {provider.visits > 0 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User size={14} className="text-gray-400" />
                    <span>{provider.visits} visits</span>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <CredentialsList items={credentials} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Services</h3>
          {loadingServices ? (
            <Skeleton className="h-32 w-full" />
          ) : (services || []).length === 0 ? (
            <p className="text-sm text-gray-500">No services listed.</p>
          ) : (
            <div className="space-y-3">
              {(services || []).map((service, idx) => {
                const ServiceIcon = serviceIcons[idx % serviceIcons.length];
                return (
                  <div
                    key={service.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-100"
                  >
                    <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                      <ServiceIcon size={18} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {service.name}
                      </p>
                      {service.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Transaction History
        </h3>
        {loadingTx ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <BaseTable
            header={
              <tr>
                {[
                  "Transaction ID",
                  "Patient",
                  "Date",
                  "Service",
                  "Amount",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            }
            colCount={6}
            data={transactions || []}
            currentPage={1}
            totalPages={1}
            emptyMessage="No transactions found for this provider."
            rowRenderer={(tx) => (
              <tr
                key={tx.id}
                className="hover:bg-gray-50 transition-colors duration-100"
              >
                <td className="px-5 py-3.5 text-sm font-medium text-gray-800">
                  {tx.id}
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600">
                  {tx.patient_name}
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600">
                  {formatDate(tx.date)}
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600">
                  {tx.service}
                </td>
                <td className="px-5 py-3.5 text-sm font-medium text-gray-800">
                  ${parseFloat(tx.amount).toFixed(2)}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={tx.status} />
                </td>
              </tr>
            )}
          />
        )}
      </div>
    </PageContainer>
  );
}

export default ProviderDetails;
