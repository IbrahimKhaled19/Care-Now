import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAnalyticsStats } from "../../hooks/useApi";
import Skeleton from "../common/Skeleton";

function TrendBadge({ trend, change, invertTrend }) {
  const isPositive = invertTrend ? trend === "down" : trend === "up";
  const Icon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isPositive ? "text-teal-600" : "text-error-500"
      }`}
    >
      <Icon size={13} />
      {change}
    </span>
  );
}

function DashboardStatistics({ dateRange }) {
  const { data: stats, loading, error, refetch } = useAnalyticsStats(dateRange);

  if (loading) {
    return (
      <div className="mb-8">
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-6 mb-4">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 text-center py-8">
        <p className="text-sm text-red-500 mb-3">Failed to load statistics</p>
        <button onClick={refetch} className="text-sm text-teal-600 underline cursor-pointer">Retry</button>
      </div>
    );
  }

  const heroStat = {
    title: "Total Requests",
    value: stats?.totalRequests?.value?.toLocaleString() || "0",
    change: stats?.totalRequests?.change || "+0%",
    trend: stats?.totalRequests?.change?.startsWith("-") ? "down" : "up",
    period: `last ${dateRange} days`,
  };

  const secondaryStats = [
    { title: "Active Providers", value: stats?.activeProviders?.value?.toString() || "0", change: stats?.activeProviders?.change || "+0%", trend: "up" },
    { title: "Completion Rate", value: stats?.completionRate?.value || "0%", change: stats?.completionRate?.change || "+0%", trend: "up" },
    { title: "Avg Response Time", value: stats?.avgResponseTime?.value || "N/A", change: stats?.avgResponseTime?.change || "-", trend: "down", invertTrend: true },
  ];

  return (
    <div className="mb-8">
      {/* Hero metric */}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-6 mb-4 animate-fadeIn">
        <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-2">
          {heroStat.title}
        </p>
        <div className="flex items-baseline gap-4">
          <span className="text-4xl font-bold text-gray-800">
            {heroStat.value}
          </span>
          <TrendBadge
            trend={heroStat.trend}
            change={heroStat.change}
          />
          <span className="text-xs text-gray-500">{heroStat.period}</span>
        </div>
      </div>

      {/* Secondary metrics strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {secondaryStats.map((stat, idx) => (
          <div
            key={stat.title}
            className="px-4 py-3 animate-fadeIn"
            style={{ animationDelay: `${80 + idx * 60}ms` }}
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              {stat.title}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-800">
                {stat.value}
              </span>
              <TrendBadge
                trend={stat.trend}
                change={stat.change}
                invertTrend={stat.invertTrend}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardStatistics;
