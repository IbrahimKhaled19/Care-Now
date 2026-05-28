import { Download } from "lucide-react";
import { api } from "../../lib/api";

const exportMap = {
  "daily-operations": "/requests/export",
  "financial-reconciliation": "/transactions/export",
  "nurse-performance": "/providers/export",
  "customer-service": "/requests/export",
  "compliance-audit": "/patients/export",
};

const ReportComponent = ({ id, title, description }) => {
  const handleDownload = async () => {
    try {
      const path = exportMap[id] || "/requests/export";
      const blob = await api.download(path);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${id}-report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Report download error:", err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-colors duration-150">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-800 mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {description}
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors duration-150 cursor-pointer shrink-0"
        >
          <Download size={16} />
          Download
        </button>
      </div>
    </div>
  );
};

export default ReportComponent;
