import React, { useEffect, useState, useRef } from 'react';
import { formatTaka } from '../../utils/formatters';

interface AnimatedNumberProps {
  valueMinor: number;
  privacy?: boolean;
  language?: 'en' | 'bn';
  showSymbol?: boolean;
  className?: string;
  durationMs?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  valueMinor,
  privacy = false,
  language = 'en',
  showSymbol = true,
  className = '',
  durationMs = 600,
}) => {
  const [displayMinor, setDisplayMinor] = useState(valueMinor);
  const prevValueRef = useRef(valueMinor);

  useEffect(() => {
    // If privacy is active or reduced motion is preferred, jump immediately
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (privacy || prefersReduced) {
      setDisplayMinor(valueMinor);
      prevValueRef.current = valueMinor;
      return;
    }

    const startValue = prevValueRef.current;
    const endValue = valueMinor;
    if (startValue === endValue) {
      setDisplayMinor(endValue);
      return;
    }

    const startTime = performance.now();
    let frameId: number;

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Smooth easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * ease);

      setDisplayMinor(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        prevValueRef.current = endValue;
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [valueMinor, privacy, durationMs]);

  const formatted = formatTaka(displayMinor, {
    privacy,
    language,
    showSymbol,
  });

  return (
    <span className={`font-mono-numbers tabular-nums inline-block ${className}`}>
      {formatted}
    </span>
  );
};
