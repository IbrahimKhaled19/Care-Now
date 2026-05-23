import { motion } from "motion/react";

function BaseHeader({ title, subtitle, actions, className = "" }) {
  return (
    <motion.header
      className={`flex items-start justify-between ${className}`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">{actions}</div>
      )}
    </motion.header>
  );
}

export default BaseHeader;
