import React, { useState, useEffect } from 'react';
import { Bell, Search, RefreshCw } from 'lucide-react';
import { useSafetyStore } from '../../store/useSafetyStore';
import { useEnvStore } from '../../store/useEnvStore';

export const Header: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { getActivePermits } = useSafetyStore();
  const { getAlerts, refreshCurrentData } = useEnvStore();

  const activePermits = getActivePermits();
  const alerts = getAlerts();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800/50 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-3">
          <div className="text-sm">
            <p className="text-slate-400">{formatDate(currentTime)}</p>
            <p className="text-xl font-display font-bold text-gradient">
              {formatTime(currentTime)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="搜索船舶、许可证..."
            className="w-64 pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
          />
        </div>

        <button
          onClick={refreshCurrentData}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="刷新数据"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        <div className="relative">
          <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors relative">
            <Bell className="w-5 h-5" />
            {(activePermits.length > 0 || alerts.length > 0) && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full animate-pulse" />
            )}
          </button>
          
          {(activePermits.length > 0 || alerts.length > 0) && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4 hidden group-hover:block">
              <h4 className="text-sm font-medium text-slate-200 mb-3">通知</h4>
              {activePermits.length > 0 && (
                <div className="mb-3 p-2 rounded bg-primary-500/10 border border-primary-500/20">
                  <p className="text-xs text-primary-400">
                    {activePermits.length} 个作业许可正在生效
                  </p>
                </div>
              )}
              {alerts.length > 0 && (
                <div className="p-2 rounded bg-warning-500/10 border border-warning-500/20">
                  <p className="text-xs text-warning-400">
                    {alerts.length} 条环境监测预警
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-700/50" />

        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-slate-200">管理员</p>
            <p className="text-xs text-slate-500">admin@shipyard.com</p>
          </div>
          <div className="w-9 h-9 bg-gradient-to-br from-warning-500 to-warning-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-warning-900/30">
            管
          </div>
        </div>
      </div>
    </header>
  );
};
