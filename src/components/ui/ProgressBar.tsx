import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showLabel = true,
  size = 'md',
  color = 'primary',
}) => {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  
  const getColorClass = () => {
    if (color === 'auto') {
      if (percentage >= 80) return 'bg-success-500';
      if (percentage >= 50) return 'bg-primary-500';
      if (percentage >= 20) return 'bg-warning-500';
      return 'bg-danger-500';
    }
    switch (color) {
      case 'success': return 'bg-success-500';
      case 'warning': return 'bg-warning-500';
      case 'danger': return 'bg-danger-500';
      default: return 'bg-primary-500';
    }
  };

  const getHeightClass = () => {
    switch (size) {
      case 'sm': return 'h-1.5';
      case 'lg': return 'h-3';
      default: return 'h-2';
    }
  };

  return (
    <div className="w-full">
      <div className={`w-full bg-slate-700/50 rounded-full overflow-hidden ${getHeightClass()}`}>
        <div
          className={`h-full ${getColorClass()} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-slate-400">
          <span>{percentage}%</span>
          <span>{value}/{max}</span>
        </div>
      )}
    </div>
  );
};
