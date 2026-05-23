function BaseHeader({ title, subtitle, actions, className = "" }) {
  return (
    <header
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
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
    </header>
  );
}

export default BaseHeader;
