import { Download } from "lucide-react";

const ReportComponent = ({ id, title, description }) => {
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
        <button className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors duration-150 cursor-pointer shrink-0">
          <Download size={16} />
          Download
        </button>
      </div>
    </div>
  );
};

export default ReportComponent;
