import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <ShieldX size={28} className="text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Access Denied
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          You don't have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
        <Link
          to="/dashboard"
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors inline-block"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
