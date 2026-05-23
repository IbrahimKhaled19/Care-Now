const StateItem = ({ icon, label, active }) => (
  <div
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
      active
        ? "bg-teal-50 text-teal-700 border border-teal-200"
        : "bg-gray-50 text-gray-500 border border-gray-100"
    }`}
  >
    {icon}
    <span>{label}</span>
  </div>
);

export default StateItem;
