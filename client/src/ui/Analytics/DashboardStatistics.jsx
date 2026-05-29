import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAnalyticsStats } from "../../hooks/useApi";
import { useAnimatedCounter, formatAnimatedValue } from "../../hooks/useAnimatedCounter";
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

// Extract numeric value from formatted strings like "1,234", "85%", "12min"
function parseNumeric(str) {
  if (str == null) return 0;
  const num = parseFloat(String(str).replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 0 : num;
}

function detectFormat(str) {
  if (typeof str !== "string") return "number";
  if (str.includes("%")) return "percent";
  if (str.includes("min")) return "time";
  return "number";
}

function AnimatedStatValue({ value, className }) {
  const numericValue = parseNumeric(value);
  const format = detectFormat(value);
  const animated = useAnimatedCounter(numericValue, { duration: 900 });

  return (
    <span className={className}>
      {formatAnimatedValue(animated, format)}
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
    { title: "Active Providers", value: stats?.activeProviders?.value?.toString() || "0", rawValue: stats?.activeProviders?.value, change: stats?.activeProviders?.change || "+0%", trend: "up" },
    { title: "Completion Rate", value: stats?.completionRate?.value || "0%", rawValue: stats?.completionRate?.value, change: stats?.completionRate?.change || "+0%", trend: "up" },
    { title: "Avg Response Time", value: stats?.avgResponseTime?.value || "N/A", rawValue: stats?.avgResponseTime?.value, change: stats?.avgResponseTime?.change || "-", trend: "down", invertTrend: true },
  ];

  return (
    <div className="mb-8">
      {/* Hero metric */}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-6 mb-4 reveal-stagger">
        <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-2">
          {heroStat.title}
        </p>
        <div className="flex items-baseline gap-4">
          <AnimatedStatValue
            value={stats?.totalRequests?.value}
            className="text-4xl font-bold text-gray-800"
          />
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
            className="px-4 py-3 reveal-stagger"
            style={{ animationDelay: `${120 + idx * 80}ms` }}
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              {stat.title}
            </p>
            <div className="flex items-baseline gap-2">
              <AnimatedStatValue
                value={stat.rawValue}
                className="text-xl font-bold text-gray-800"
              />
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
