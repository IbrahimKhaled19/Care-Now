import { motion } from "motion/react";
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
  const { data: stats, loading } = useAnalyticsStats(dateRange);

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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-teal-50 border border-teal-100 rounded-xl p-6 mb-4"
      >
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
      </motion.div>

      {/* Secondary metrics strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {secondaryStats.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 + idx * 0.06 }}
            className="px-4 py-3"
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
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default DashboardStatistics;
