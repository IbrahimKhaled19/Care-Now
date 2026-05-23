import { motion } from "motion/react";
import { Bell } from "lucide-react";
import DateRangePicker from "./DateRangePicker";


function DashboardHeader({ dateRange, onDateRangeChange }) {
  const today = new Date();
  const greeting =
    today.getHours() < 12
      ? "Good morning"
      : today.getHours() < 18
      ? "Good afternoon"
      : "Good evening";

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.header
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">
          {greeting}
        </h1>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <span>{formattedDate}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
        <button
          className="relative p-2.5 rounded-xl bg-white border border-gray-100 text-gray-600 hover:text-teal-700 hover:border-teal-200 transition-colors duration-150"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-500" />
        </button>
      </div>
    </motion.header>
  );
}

export default DashboardHeader;
