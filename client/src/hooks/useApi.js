import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export function useApi(path, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.get(path);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useRequests(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return useApi(`/requests${qs}`);
}

export function useProviders(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return useApi(`/providers${qs}`);
}

export function usePatients(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return useApi(`/patients${qs}`);
}

export function useTransactions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return useApi(`/transactions${qs}`);
}

export function useWithdrawals(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return useApi(`/withdrawals${qs}`);
}

export function useWallets() {
  return useApi("/wallets");
}

export function useAdmins(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return useApi(`/admins${qs}`);
}

export function useAnalyticsStats(days = 30) {
  return useApi(`/analytics/stats?days=${days}`);
}

export function useRequestsOverTime(days = 30) {
  return useApi(`/analytics/requests-over-time?days=${days}`);
}

export function useRevenueByService(days = 30) {
  return useApi(`/analytics/revenue-by-service?days=${days}`);
}

export function useStatusDistribution(days = 30) {
  return useApi(`/analytics/status-distribution?days=${days}`);
}

export function useTopProviders() {
  return useApi(`/analytics/top-providers`);
}

export function useBillingSummary() {
  return useApi(`/analytics/billing-summary`);
}

export function useEarningsOverTime() {
  return useApi(`/analytics/earnings-over-time`);
}

export function useTransactionTypes() {
  return useApi(`/analytics/transaction-types`);
}

export function useProvider(id) {
  return useApi(`/providers/${id}`);
}

export function useProviderTransactions(id) {
  return useApi(`/providers/${id}/transactions`);
}

export function useProviderRequests(id) {
  return useApi(`/providers/${id}/requests`);
}

export function useProviderServices(id) {
  return useApi(`/providers/${id}/services`);
}

export function usePatient(id) {
  return useApi(`/patients/${id}`);
}

export function usePatientTransactions(id) {
  return useApi(`/patients/${id}/transactions`);
}

export function usePatientMedical(id) {
  return useApi(`/patients/${id}/medical`);
}

export function useRequest(id) {
  return useApi(`/requests/${id}`);
}
