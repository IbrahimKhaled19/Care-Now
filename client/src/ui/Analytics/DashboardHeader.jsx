import { motion } from "motion/react";
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
      </div>
    </motion.header>
  );
}

export default DashboardHeader;
