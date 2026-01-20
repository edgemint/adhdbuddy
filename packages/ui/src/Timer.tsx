import React, { useEffect, useState } from 'react';
import { formatTimeRemaining } from '@adhdbuddy/shared';

export interface TimerProps {
  endTime: Date;
  onComplete?: () => void;
  className?: string;
}

export function Timer({ endTime, onComplete, className = '' }: TimerProps) {
  const [remaining, setRemaining] = useState(() => endTime.getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const newRemaining = endTime.getTime() - Date.now();
      setRemaining(newRemaining);

      if (newRemaining <= 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onComplete]);

  const isLowTime = remaining < 5 * 60 * 1000; // Less than 5 minutes
  const isExpired = remaining <= 0;

  return (
    <div
      className={`text-4xl font-mono tabular-nums ${
        isExpired ? 'text-gray-400' : isLowTime ? 'text-red-600' : 'text-gray-900'
      } ${className}`}
    >
      {isExpired ? '00:00' : formatTimeRemaining(remaining)}
    </div>
  );
}
