import React from 'react';
import { TabItem } from '../../types';

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
  className?: string;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex border-b border-slate-700/50 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-5 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap ${
            activeTab === tab.key
              ? 'text-primary-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {tab.label}
          {activeTab === tab.key && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};
