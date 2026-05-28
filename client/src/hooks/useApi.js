import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

/**
 * Generic list query hook. Returns { data, meta } envelope from API,
 * flattened to { data, loading, error, refetch } for consumer compat.
 */
function useListQuery(key, path, filters = {}, options = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", filters.page);
  if (filters.limit) params.set("limit", filters.limit);
  const qs = params.toString() ? `?${params.toString()}` : "";

  const result = useQuery({
    queryKey: [key, filters],
    queryFn: () => api.get(`${path}${qs}`),
    ...options,
  });

  // Handle envelope: if response has { data, meta }, extract data
  const responseData = result.data?.data !== undefined ? result.data.data : result.data;
  const meta = result.data?.meta || null;

  return {
    data: responseData,
    meta,
    loading: result.isLoading,
    error: result.error?.message || null,
    refetch: result.refetch,
  };
}

/**
 * Generic detail query hook.
 */
function useDetailQuery(key, path, id, options = {}) {
  const result = useQuery({
    queryKey: [key, id],
    queryFn: () => api.get(`${path}/${id}`),
    enabled: !!id,
    ...options,
  });

  const responseData = result.data?.data !== undefined ? result.data.data : result.data;

  return {
    data: responseData,
    loading: result.isLoading,
    error: result.error?.message || null,
    refetch: result.refetch,
  };
}

// ============================================================
// List hooks
// ============================================================

export function useRequests(filters = {}) {
  return useListQuery("requests", "/requests", filters);
}

export function useProviders(filters = {}) {
  return useListQuery("providers", "/providers", filters);
}

export function usePatients(filters = {}) {
  return useListQuery("patients", "/patients", filters);
}

export function useTransactions(filters = {}) {
  return useListQuery("transactions", "/transactions", filters);
}

export function useWithdrawals(filters = {}) {
  return useListQuery("withdrawals", "/withdrawals", filters);
}

export function useWallets(filters = {}) {
  return useListQuery("wallets", "/wallets", filters);
}

export function useAdmins(filters = {}) {
  return useListQuery("admins", "/admins", filters);
}

// ============================================================
// Analytics hooks (semi-static, longer stale time)
// ============================================================

export function useAnalyticsStats(days = 30) {
  const result = useQuery({
    queryKey: ["analytics-stats", days],
    queryFn: () => api.get(`/analytics/stats?days=${days}`),
    staleTime: 60_000,
  });
  return { data: result.data, loading: result.isLoading, error: result.error?.message || null, refetch: result.refetch };
}

export function useRequestsOverTime(days = 30) {
  const result = useQuery({
    queryKey: ["analytics-requests-over-time", days],
    queryFn: () => api.get(`/analytics/requests-over-time?days=${days}`),
    staleTime: 60_000,
  });
  return { data: result.data, loading: result.isLoading, error: result.error?.message || null, refetch: result.refetch };
}

export function useRevenueByService(days = 30) {
  const result = useQuery({
    queryKey: ["analytics-revenue-by-service", days],
    queryFn: () => api.get(`/analytics/revenue-by-service?days=${days}`),
    staleTime: 60_000,
  });
  return { data: result.data, loading: result.isLoading, error: result.error?.message || null, refetch: result.refetch };
}

export function useStatusDistribution(days = 30) {
  const result = useQuery({
    queryKey: ["analytics-status-distribution", days],
    queryFn: () => api.get(`/analytics/status-distribution?days=${days}`),
    staleTime: 60_000,
  });
  return { data: result.data, loading: result.isLoading, error: result.error?.message || null, refetch: result.refetch };
}

export function useTopProviders() {
  const result = useQuery({
    queryKey: ["analytics-top-providers"],
    queryFn: () => api.get("/analytics/top-providers"),
    staleTime: 60_000,
  });
  return { data: result.data, loading: result.isLoading, error: result.error?.message || null, refetch: result.refetch };
}

export function useBillingSummary() {
  const result = useQuery({
    queryKey: ["analytics-billing-summary"],
    queryFn: () => api.get("/analytics/billing-summary"),
    staleTime: 60_000,
  });
  return { data: result.data, loading: result.isLoading, error: result.error?.message || null, refetch: result.refetch };
}

export function useEarningsOverTime() {
  const result = useQuery({
    queryKey: ["analytics-earnings-over-time"],
    queryFn: () => api.get("/analytics/earnings-over-time"),
    staleTime: 60_000,
  });
  return { data: result.data, loading: result.isLoading, error: result.error?.message || null, refetch: result.refetch };
}

export function useTransactionTypes() {
  const result = useQuery({
    queryKey: ["analytics-transaction-types"],
    queryFn: () => api.get("/analytics/transaction-types"),
    staleTime: 60_000,
  });
  return { data: result.data, loading: result.isLoading, error: result.error?.message || null, refetch: result.refetch };
}

// ============================================================
// Detail hooks
// ============================================================

export function useProvider(id) {
  return useDetailQuery("provider", "/providers", id);
}

export function useProviderTransactions(id) {
  const result = useQuery({
    queryKey: ["provider-transactions", id],
    queryFn: () => api.get(`/providers/${id}/transactions`),
    enabled: !!id,
  });
  return { data: result.data, loading: result.isLoading, error: result.error?.message || null, refetch: result.refetch };
}

export function useProviderRequests(id) {
  const result = useQuery({
    queryKey: ["provider-requests", id],
    queryFn: () => api.get(`/providers/${id}/requests`),
    enabled: !!id,
  });
  return { data: result.data, loading: result.isLoading, error: result.error?.message || null, refetch: result.refetch };
}

export function useProviderServices(id) {
  const result = useQuery({
    queryKey: ["provider-services", id],
    queryFn: () => api.get(`/providers/${id}/services`),
    enabled: !!id,
  });
  return { data: result.data, loading: result.isLoading, error: result.error?.message || null, refetch: result.refetch };
}

export function usePatient(id) {
  return useDetailQuery("patient", "/patients", id);
}

export function usePatientTransactions(id) {
  const result = useQuery({
    queryKey: ["patient-transactions", id],
    queryFn: () => api.get(`/patients/${id}/transactions`),
    enabled: !!id,
  });
  return { data: result.data, loading: result.isLoading, error: result.error?.message || null, refetch: result.refetch };
}

export function usePatientMedical(id) {
  const result = useQuery({
    queryKey: ["patient-medical", id],
    queryFn: () => api.get(`/patients/${id}/medical`),
    enabled: !!id,
  });
  return { data: result.data, loading: result.isLoading, error: result.error?.message || null, refetch: result.refetch };
}

export function useRequest(id) {
  return useDetailQuery("request", "/requests", id);
}
