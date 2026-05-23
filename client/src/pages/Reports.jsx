import { reportTypes } from "../data/content";
import ReportComponent from "../ui/Reports/ReportComponent";
import BaseHeader from "../ui/common/BaseHeader";
import PageContainer from "../ui/common/PageContainer";

const Reports = () => {
  return (
    <PageContainer>
      <BaseHeader
        title="Reports"
        subtitle="Download operational and financial reports"
      />

      <div className="mt-6 space-y-3">
        {reportTypes.map((report) => (
          <ReportComponent
            key={report.id}
            id={report.id}
            title={report.title}
            description={report.description}
          />
        ))}
      </div>
    </PageContainer>
  );
};

export default Reports;
