const sizeMap = {
  sm: "w-8 h-8 text-sm rounded-full",
  md: "w-9 h-9 text-sm rounded-full",
  lg: "w-24 h-24 text-2xl rounded-xl",
};

export default function InitialsAvatar({ name, size = "md", className = "" }) {
  const s = sizeMap[size] || sizeMap.md;
  return (
    <div className={`${s} bg-teal-100 flex items-center justify-center text-teal-700 font-semibold shrink-0 ${className}`}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}
