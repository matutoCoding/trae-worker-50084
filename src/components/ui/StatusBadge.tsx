import React from 'react';
import { getStatusText } from '../../utils/format';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const getStatusClass = () => {
    switch (status) {
      case 'pending':
      case 'not_started':
      case 'stored':
      case 'draft':
        return 'badge-pending';
      case 'in_progress':
      case 'processing':
      case 'transferred':
      case 'approved':
      case 'warning':
      case 'shipped':
        return 'badge-in-progress';
      case 'completed':
      case 'received':
      case 'normal':
      case 'running':
        return 'badge-completed';
      case 'delayed':
      case 'exceeded':
      case 'rejected':
      case 'expired':
      case 'cancelled':
      case 'danger':
        return 'badge-danger';
      default:
        return 'bg-slate-600 text-slate-200';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'text-xs px-2 py-0.5';
      case 'lg': return 'text-sm px-3 py-1';
      default: return '';
    }
  };

  return (
    <span className={`badge ${getStatusClass()} ${getSizeClass()} ${className}`}>
      {getStatusText(status)}
    </span>
  );
};
