import { useState, useEffect, useRef } from "react";

// Exponential ease-out for natural deceleration
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function useAnimatedCounter(targetValue, { duration = 800, enabled = true } = {}) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    if (!enabled || targetValue == null || isNaN(targetValue)) return;

    // Cancel any running animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    startValueRef.current = displayValue;
    startTimeRef.current = null;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      const current = startValueRef.current + (targetValue - startValueRef.current) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, enabled]);

  return displayValue;
}

// Format animated number for display
export function formatAnimatedValue(value, format = "number") {
  if (format === "percent") {
    return `${Math.round(value)}%`;
  }
  if (format === "time") {
    return `${Math.round(value)}min`;
  }
  return Math.round(value).toLocaleString();
}
