import { useState } from "react";
import DashboardGraphs from "../ui/Analytics/DashboardGraphs";
import DashboardHeader from "../ui/Analytics/DashboardHeader";
import DashboardStatistics from "../ui/Analytics/DashboardStatistics";
import PageContainer from "../ui/common/PageContainer";

function Analytics() {
  const [dateRange, setDateRange] = useState(30);

  return (
    <PageContainer>
      <DashboardHeader dateRange={dateRange} onDateRangeChange={setDateRange} />
      <DashboardStatistics dateRange={dateRange} />
      <DashboardGraphs dateRange={dateRange} />
    </PageContainer>
  );
}

export default Analytics;
