import { useState } from "react";

const sizeMap = {
  sm: "w-8 h-8 text-sm rounded-full",
  md: "w-9 h-9 text-sm rounded-full",
  lg: "w-24 h-24 text-2xl rounded-xl",
};

export default function InitialsAvatar({ name, src, size = "md", className = "" }) {
  const s = sizeMap[size] || sizeMap.md;
  const [imgError, setImgError] = useState(false);
  const showImage = src && !imgError;

  return (
    <div className={`relative shrink-0 ${s} ${className}`}>
      {showImage && (
        <img
          src={src}
          alt={name || ""}
          className={`${s} object-cover absolute inset-0`}
          onError={() => setImgError(true)}
        />
      )}
      {!showImage && (
        <div className={`${s} bg-teal-100 flex items-center justify-center text-teal-700 font-semibold`}>
          {name?.charAt(0)?.toUpperCase() || "?"}
        </div>
      )}
    </div>
  );
}
