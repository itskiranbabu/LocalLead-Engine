import React, { useState } from 'react';
import { Info, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';

interface InfoBannerProps {
  type?: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const InfoBanner: React.FC<InfoBannerProps> = ({
  type = 'info',
  title,
  message,
  dismissible = false,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const styles = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      message: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700',
      Icon: Info,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      message: 'text-yellow-700',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      Icon: AlertTriangle,
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      title: 'text-green-800',
      message: 'text-green-700',
      button: 'bg-green-600 hover:bg-green-700',
      Icon: CheckCircle,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      title: 'text-red-800',
      message: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700',
      Icon: XCircle,
    },
  };

  const style = styles[type];
  const IconComponent = style.Icon;

  return (
    <div className={`${style.bg} border ${style.border} rounded-lg p-4 mb-6`}>
      <div className="flex items-start gap-3">
        <div className={`${style.bg} p-2 rounded-lg`}>
          <IconComponent className={style.icon} size={20} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${style.title} mb-1`}>{title}</h3>
          <p className={`text-sm ${style.message} whitespace-pre-line`}>{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className={`mt-3 ${style.button} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
            >
              {action.label}
            </button>
          )}
        </div>
        {dismissible && (
          <button
            onClick={() => setIsVisible(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
