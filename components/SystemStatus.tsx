import React, { useEffect, useState } from 'react';
import { AlertTriangle, Wifi } from 'lucide-react';

export const SystemStatus: React.FC = () => {
  const [status, setStatus] = useState<'online' | 'cooling'>('online');
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const handleStatusChange = (e: CustomEvent) => {
      if (e.detail.status === 'cooling') {
        setStatus('cooling');
        setTimeLeft(e.detail.duration / 1000);
      } else {
        setStatus('online');
        setTimeLeft(0);
      }
    };

    window.addEventListener('gemini-status-change' as any, handleStatusChange);

    return () => {
      window.removeEventListener('gemini-status-change' as any, handleStatusChange);
    };
  }, []);

  useEffect(() => {
    if (status === 'cooling' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && status === 'cooling') {
        setStatus('online');
    }
  }, [status, timeLeft]);

  if (status === 'online') return null;

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-amber-500 text-white px-4 py-2 shadow-md flex justify-center items-center gap-2 transition-all duration-300">
      <AlertTriangle size={18} className="animate-pulse" />
      <span className="font-bold text-sm">
        AI Circuit Breaker Active: System cooling down to protect quota. Resuming in {timeLeft}s.
      </span>
    </div>
  );
};