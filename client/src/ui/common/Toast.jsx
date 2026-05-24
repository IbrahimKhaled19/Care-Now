import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: "bg-teal-50 border-teal-200 text-teal-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-gray-50 border-gray-200 text-gray-700",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

const iconStyles = {
  success: "text-teal-600",
  error: "text-red-500",
  info: "text-gray-500",
  warning: "text-amber-600",
};

const progressColors = {
  success: "bg-teal-400",
  error: "bg-red-400",
  info: "bg-gray-400",
  warning: "bg-amber-400",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useMemo(
    () => ({
      success: (msg, dur) => addToast(msg, "success", dur),
      error: (msg, dur) => addToast(msg, "error", dur),
      info: (msg, dur) => addToast(msg, "info", dur),
      warning: (msg, dur) => addToast(msg, "warning", dur),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`relative flex items-start gap-3 p-4 rounded-xl border overflow-hidden pointer-events-auto ${styles[t.type]}`}
              role="alert"
            >
              <Icon size={18} className={`shrink-0 mt-0.5 ${iconStyles[t.type]}`} />
              <p className="text-sm font-medium flex-1 leading-snug">{t.message}</p>
              <button
                onClick={() => onRemove(t.id)}
                className="shrink-0 p-0.5 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
              {t.duration > 0 && (
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: t.duration / 1000, ease: "linear" }}
                  className={`absolute bottom-0 left-0 right-0 h-0.5 origin-left ${progressColors[t.type]}`}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
