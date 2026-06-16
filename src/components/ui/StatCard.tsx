import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'slate';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  className = '',
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'from-success-500/20 to-success-900/20 border-success-500/30 text-success-400';
      case 'warning':
        return 'from-warning-500/20 to-warning-900/20 border-warning-500/30 text-warning-400';
      case 'danger':
        return 'from-danger-500/20 to-danger-900/20 border-danger-500/30 text-danger-400';
      case 'slate':
        return 'from-slate-500/20 to-slate-900/20 border-slate-500/30 text-slate-400';
      default:
        return 'from-primary-500/20 to-primary-900/20 border-primary-500/30 text-primary-400';
    }
  };

  return (
    <div className={`industrial-card p-5 bg-gradient-to-br ${getColorClasses()} ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold font-display text-slate-100">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${trend.isUp ? 'text-success-400' : 'text-danger-400'}`}>
              {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="text-slate-500 ml-1">vs 上月</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-slate-800/50 border border-slate-700/50`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
