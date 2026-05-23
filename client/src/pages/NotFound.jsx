import { Link } from "react-router-dom";
import { ArrowLeft, Stethoscope } from "lucide-react";
import Button from "../ui/common/Button";

function NotFound() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-6">
          <Stethoscope size={32} className="text-teal-600" />
        </div>

        <h1 className="text-5xl font-bold text-gray-800 mb-3">404</h1>
        <p className="text-lg font-semibold text-gray-700 mb-2">
          Page not found
        </p>
        <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="secondary" className="px-4 py-2.5 text-sm">
              <ArrowLeft size={16} className="mr-1.5" />
              Back to Home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button className="px-4 py-2.5 text-sm">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
