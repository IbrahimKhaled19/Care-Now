import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import LinesChart from "./LinesChart";
import PieCharts from "./PieCharts";
import BarsChart from "./BarsChart";
import PatientSatisfactionLevel from "./PatientSatisfactionLevel";
import RequestBarsChart from "./RequestBarCharts";
import TopProviders from "./TopProviders";
import DashboardMap from "./DashboardMap";
import Card from "../common/Card";
import Skeleton from "../common/Skeleton";
import { useRequestsOverTime, useRevenueByService, useTopProviders, useStatusDistribution, useAnalyticsStats } from "../../hooks/useApi";

function ChartCard({ title, className, children }) {
  return (
    <Card className={className} padding={false}>
      <div className="p-6 pb-0">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      </div>
      <div className="px-6 pb-6">{children}</div>
    </Card>
  );
}

function DashboardGraphs({ dateRange }) {
  const [expanded, setExpanded] = useState(false);
  const { data: requestsData, loading: loadingRequests, error: errorRequests, refetch: refetchRequests } = useRequestsOverTime(dateRange);
  const { data: revenueData, loading: loadingRevenue, error: errorRevenue, refetch: refetchRevenue } = useRevenueByService(dateRange);
  const { data: topProviders, loading: loadingProviders, error: errorProviders, refetch: refetchProviders } = useTopProviders();
  const { data: statusDist } = useStatusDistribution(dateRange);
  const { data: stats } = useAnalyticsStats(dateRange);

  const linesData = (requestsData || []).map((r) => ({
    name: r.month,
    total: r.requests,
    completed: r.completed,
    cancelled: r.canceled,
  }));

  // Transform requests-over-time for the breakdown bar chart
  const breakdownData = (requestsData || []).map((r) => ({
    name: r.month,
    completed: r.completed,
    cancelled: r.canceled,
  }));

  // Use status distribution for pie chart
  const pieData = (statusDist || []).map((d) => ({
    name: d.name.charAt(0).toUpperCase() + d.name.slice(1).replace("_", " "),
    value: d.value,
  }));

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-800 mb-5">
        Performance Metrics
      </h2>

      {/* Default visible charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Request Volume & Trends" className="lg:col-span-2">
          {loadingRequests ? (
            <Skeleton className="h-[320px] w-full" />
          ) : errorRequests ? (
            <div className="text-center py-8"><p className="text-sm text-red-500 mb-2">Failed to load</p><button onClick={refetchRequests} className="text-sm text-teal-600 underline cursor-pointer">Retry</button></div>
          ) : (
            <LinesChart data={linesData.length > 0 ? linesData : undefined} />
          )}
        </ChartCard>

        <ChartCard title="Revenue by Service">
          {loadingRevenue ? (
            <Skeleton className="h-[260px] w-full" />
          ) : errorRevenue ? (
            <div className="text-center py-8"><p className="text-sm text-red-500 mb-2">Failed to load</p><button onClick={refetchRevenue} className="text-sm text-teal-600 underline cursor-pointer">Retry</button></div>
          ) : (
            <BarsChart data={revenueData.length > 0 ? revenueData : undefined} />
          )}
        </ChartCard>

        <ChartCard title="Patient Satisfaction">
          <PatientSatisfactionLevel satisfaction={stats?.patientSatisfaction?.value || 0} />
        </ChartCard>
      </div>

      {/* Progressive disclosure toggle */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 transition-colors duration-150 cursor-pointer"
        >
          {expanded ? "Show fewer metrics" : "Show more metrics"}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Expandable charts */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
              <ChartCard title="Service Type Distribution">
                <PieCharts data={pieData.length > 0 ? pieData : undefined} />
              </ChartCard>

              <ChartCard title="Requests Breakdown">
                <RequestBarsChart data={breakdownData.length > 0 ? breakdownData : undefined} />
              </ChartCard>

              <ChartCard title="Top Performing Providers" className="lg:col-span-2">
                {loadingProviders ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <TopProviders data={topProviders} />
                )}
              </ChartCard>

              <ChartCard title="Service Coverage" className="lg:col-span-2">
                <DashboardMap />
              </ChartCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default DashboardGraphs;
