import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Ship,
  CalendarClock,
  Biohazard,
  Package,
  ShieldAlert,
  Leaf,
  BarChart3,
  Anchor,
} from 'lucide-react';

const navItems = [
  { key: 'ships', label: '船舶档案', icon: Ship, path: '/ships' },
  { key: 'plans', label: '拆解计划', icon: CalendarClock, path: '/plans' },
  { key: 'hazmat', label: '危废处置', icon: Biohazard, path: '/hazmat' },
  { key: 'materials', label: '物料回收', icon: Package, path: '/materials' },
  { key: 'safety', label: '安全作业', icon: ShieldAlert, path: '/safety' },
  { key: 'environment', label: '环保监测', icon: Leaf, path: '/env' },
  { key: 'statistics', label: '产销统计', icon: BarChart3, path: '/statistics' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-40">
      <div className="p-5 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-lg shadow-primary-900/30">
            <Anchor className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-slate-100 leading-tight">
              船舶拆解管理
            </h1>
            <p className="text-xs text-slate-500">SHIP DISMANTLE SYSTEM</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-4 mb-2">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">
            业务模块
          </p>
        </div>
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <li key={item.key}>
                <NavLink
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    active
                      ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30 shadow-lg shadow-primary-900/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span>{item.label}</span>
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 bg-primary-400 rounded-full shadow-glow" />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800/50">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-warning-500 to-warning-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              管
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">管理员</p>
              <p className="text-xs text-slate-500">系统管理员</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
            系统运行正常
          </div>
        </div>
      </div>
    </aside>
  );
};
