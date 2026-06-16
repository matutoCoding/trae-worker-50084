import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Ship,
  Package,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Scale,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Users,
} from 'lucide-react';
import { useShipStore } from '../../store/useShipStore';
import { usePlanStore } from '../../store/usePlanStore';
import { useMaterialStore } from '../../store/useMaterialStore';
import { useHazmatStore } from '../../store/useHazmatStore';
import { StatCard } from '../../components/ui/StatCard';
import { LineChartCard } from '../../components/charts/LineChartCard';
import { BarChartCard } from '../../components/charts/BarChartCard';
import { TabNavigation } from '../../components/ui/TabNavigation';
import { TabItem } from '../../types';
import { formatCurrency, formatWeight, getMaterialCategoryText, getWasteTypeText } from '../../utils/format';

const tabs: TabItem[] = [
  { key: 'overview', label: '综合概览' },
  { key: 'production', label: '生产统计' },
  { key: 'sales', label: '销售统计' },
];

export const StatisticsDashboard: React.FC = () => {
  const { ships } = useShipStore();
  const { plans } = usePlanStore();
  const { materials, sales, getInventoryStats, getSalesStats } = useMaterialStore();
  const { wastes, getWasteStats } = useHazmatStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('month');

  const inventoryStats = useMemo(() => getInventoryStats(), [getInventoryStats]);
  const salesStats = useMemo(() => getSalesStats(), [getSalesStats]);
  const wasteStats = useMemo(() => getWasteStats(), [getWasteStats]);

  const overallStats = useMemo(() => {
    const totalShips = ships.length;
    const completedShips = ships.filter(s => s.status === 'completed').length;
    const inProgressShips = ships.filter(s => s.status === 'in_progress').length;
    const pendingShips = ships.filter(s => s.status === 'pending').length;

    const totalDisassemblyProgress = plans.length > 0
      ? Math.round(plans.reduce((sum, p) => sum + p.progress, 0) / plans.length)
      : 0;

    const totalMaterialsRecovered = materials.reduce((sum, m) => sum + m.weight, 0);
    const totalSalesAmount = sales.filter(s => s.status !== 'cancelled').reduce((sum, s) => sum + s.totalAmount, 0);

    return {
      totalShips,
      completedShips,
      inProgressShips,
      pendingShips,
      totalDisassemblyProgress,
      totalMaterialsRecovered,
      totalSalesAmount,
    };
  }, [ships, plans, materials, sales]);

  const monthlyData = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
    return months.map(month => ({
      name: month,
      value: Math.floor(Math.random() * 5000 + 2000),
    }));
  }, []);

  const salesTrendData = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
    return months.map(month => ({
      name: month,
      value: Math.floor(Math.random() * 30000000 + 10000000),
    }));
  }, []);

  const materialByCategory = useMemo(() => {
    const categories = ['steel', 'non_ferrous', 'other'];
    return categories.map(cat => ({
      name: getMaterialCategoryText(cat),
      value: inventoryStats.byCategory[cat]?.weight || 0,
    }));
  }, [inventoryStats]);

  const salesByCustomer = useMemo(() => {
    return Object.entries(salesStats.byCustomer)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [salesStats]);

  const wasteByType = useMemo(() => {
    return Object.entries(wasteStats.byType)
      .map(([type, value]) => ({ name: getWasteTypeText(type), value }));
  }, [wasteStats]);

  const shipProgressData = useMemo(() => {
    return ships.slice(0, 5).map(ship => {
      const shipPlans = plans.filter(p => p.shipId === ship.id);
      const progress = shipPlans.length > 0
        ? Math.round(shipPlans.reduce((sum, p) => sum + p.progress, 0) / shipPlans.length)
        : 0;
      return {
        name: ship.name,
        value: progress,
      };
    });
  }, [ships, plans]);

  const recentSales = useMemo(() => {
    return [...sales]
      .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
      .slice(0, 5);
  }, [sales]);

  const recentShips = useMemo(() => {
    return [...ships]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [ships]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 font-display">产销统计</h1>
          <p className="text-slate-400 mt-1">生产拆解、物料回收、销售数据综合统计分析</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'quarter', 'year'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {range === 'week' ? '本周' : range === 'month' ? '本月' : range === 'quarter' ? '本季' : '本年'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="在拆船舶"
          value={overallStats.inProgressShips}
          icon={<Ship className="w-6 h-6" />}
          gradient="from-primary-500/20 to-primary-700/20"
          color="primary"
          trend={{ value: 12, isUp: true }}
        />
        <StatCard
          title="总拆解进度"
          value={`${overallStats.totalDisassemblyProgress}%`}
          icon={<BarChart3 className="w-6 h-6" />}
          gradient="from-success-500/20 to-success-700/20"
          color="success"
          trend={{ value: 8.5, isUp: true }}
        />
        <StatCard
          title="累计销售额"
          value={`${(overallStats.totalSalesAmount / 1000000).toFixed(1)} M`}
          icon={<DollarSign className="w-6 h-6" />}
          gradient="from-warning-500/20 to-warning-700/20"
          color="warning"
          trend={{ value: 15.2, isUp: true }}
        />
        <StatCard
          title="物料回收量"
          value={`${(overallStats.totalMaterialsRecovered / 1000).toFixed(1)} kt`}
          icon={<Scale className="w-6 h-6" />}
          gradient="from-slate-500/20 to-slate-700/20"
          color="slate"
          trend={{ value: 5.3, isUp: true }}
        />
      </div>

      <TabNavigation tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChartCard
              title="销售趋势"
              data={salesTrendData}
              color="#10b981"
              unit="元"
            />
            <LineChartCard
              title="物料回收趋势"
              data={monthlyData}
              color="#3b82f6"
              unit="t"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <BarChartCard
              title="物料类别分布"
              data={materialByCategory}
              unit="t"
            />
            <BarChartCard
              title="危废类型分布"
              data={wasteByType}
              unit="t"
            />
            <BarChartCard
              title="客户销售排行"
              data={salesByCustomer.map(d => ({ ...d, value: d.value / 10000 }))}
              unit="万元"
              horizontal
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="industrial-card p-5">
              <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                最近销售记录
              </h3>
              <div className="space-y-3">
                {recentSales.map(sale => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-success-500/20 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-success-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{sale.materialName}</p>
                        <p className="text-xs text-slate-500">{sale.customer}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-success-400">{formatCurrency(sale.totalAmount)}</p>
                      <p className="text-xs text-slate-500">{sale.saleDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="industrial-card p-5">
              <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                <Ship className="w-4 h-4" />
                最近登记船舶
              </h3>
              <div className="space-y-3">
                {recentShips.map(ship => (
                  <div key={ship.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                        <Ship className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{ship.name}</p>
                        <p className="text-xs text-slate-500">{ship.type} · {ship.imoNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-200">{formatWeight(ship.grossTonnage, 't')}</p>
                      <p className="text-xs text-slate-500">{ship.arrivalDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'production' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="industrial-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">待拆解船舶</p>
                  <p className="text-2xl font-bold text-warning-400 mt-1">{overallStats.pendingShips}</p>
                </div>
                <div className="w-12 h-12 bg-warning-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning-400" />
                </div>
              </div>
            </div>
            <div className="industrial-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">拆解中船舶</p>
                  <p className="text-2xl font-bold text-primary-400 mt-1">{overallStats.inProgressShips}</p>
                </div>
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary-400" />
                </div>
              </div>
            </div>
            <div className="industrial-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">已完成船舶</p>
                  <p className="text-2xl font-bold text-success-400 mt-1">{overallStats.completedShips}</p>
                </div>
                <div className="w-12 h-12 bg-success-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success-400" />
                </div>
              </div>
            </div>
            <div className="industrial-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">累计处理危废</p>
                  <p className="text-2xl font-bold text-danger-400 mt-1">{wasteStats.total.toFixed(1)} t</p>
                </div>
                <div className="w-12 h-12 bg-danger-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-danger-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChartCard
              title="各船拆解进度"
              data={shipProgressData}
              unit="%"
              color="#3b82f6"
            />
            <LineChartCard
              title="月度危废产生量"
              data={monthlyData.map(d => ({ ...d, value: Math.floor(d.value * 0.05) }))}
              color="#ef4444"
              unit="t"
            />
          </div>

          <div className="industrial-card p-5">
            <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              船舶拆解详情
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">船舶名称</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">船舶类型</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">总吨位</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">到港日期</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">拆解进度</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {ships.map(ship => {
                    const shipPlans = plans.filter(p => p.shipId === ship.id);
                    const progress = shipPlans.length > 0
                      ? Math.round(shipPlans.reduce((sum, p) => sum + p.progress, 0) / shipPlans.length)
                      : 0;
                    return (
                      <tr key={ship.id} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-500/20 rounded flex items-center justify-center">
                              <Ship className="w-4 h-4 text-primary-400" />
                            </div>
                            <span className="font-medium text-slate-200">{ship.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{ship.type}</td>
                        <td className="py-3 px-4 text-slate-300">{formatWeight(ship.grossTonnage, 't')}</td>
                        <td className="py-3 px-4 text-slate-300">{ship.arrivalDate}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  progress === 100 ? 'bg-success-500' :
                                  progress > 50 ? 'bg-primary-500' : 'bg-warning-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-400">{progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded ${
                            ship.status === 'completed' ? 'bg-success-500/20 text-success-400' :
                            ship.status === 'in_progress' ? 'bg-primary-500/20 text-primary-400' :
                            'bg-warning-500/20 text-warning-400'
                          }`}>
                            {ship.status === 'completed' ? '已完成' :
                             ship.status === 'in_progress' ? '拆解中' : '待拆解'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="industrial-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">本月销售额</p>
                  <p className="text-2xl font-bold text-success-400 mt-1">
                    {(salesStats.thisMonthRevenue / 10000).toFixed(0)} 万
                  </p>
                  <p className="text-xs text-success-400 mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    +23.5% 同比
                  </p>
                </div>
                <div className="w-12 h-12 bg-success-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success-400" />
                </div>
              </div>
            </div>
            <div className="industrial-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">累计销售额</p>
                  <p className="text-2xl font-bold text-primary-400 mt-1">
                    {(salesStats.totalRevenue / 1000000).toFixed(1)} M
                  </p>
                  <p className="text-xs text-success-400 mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    +18.2% 环比
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary-400" />
                </div>
              </div>
            </div>
            <div className="industrial-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">订单数量</p>
                  <p className="text-2xl font-bold text-warning-400 mt-1">{sales.length}</p>
                  <p className="text-xs text-success-400 mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    +5 新增
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning-500/20 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-warning-400" />
                </div>
              </div>
            </div>
            <div className="industrial-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">合作客户</p>
                  <p className="text-2xl font-bold text-slate-200 mt-1">
                    {Object.keys(salesStats.byCustomer).length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    家优质客户
                  </p>
                </div>
                <div className="w-12 h-12 bg-slate-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChartCard
              title="月度销售额趋势"
              data={salesTrendData.map(d => ({ ...d, value: d.value / 10000 }))}
              color="#10b981"
              unit="万元"
            />
            <BarChartCard
              title="物料类别销售占比"
              data={[
                { name: '重型废钢', value: 45 },
                { name: '中型废钢', value: 30 },
                { name: '紫铜', value: 12 },
                { name: '铝合金', value: 8 },
                { name: '不锈钢', value: 5 },
              ]}
              unit="%"
            />
          </div>

          <div className="industrial-card p-5">
            <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              销售明细
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">物料名称</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">客户</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">数量</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">单价</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">总金额</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">销售日期</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">发票号</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(sale => (
                    <tr key={sale.id} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-200">{sale.materialName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{sale.customer}</td>
                      <td className="py-3 px-4 text-slate-300">{formatWeight(sale.quantity, 't')}</td>
                      <td className="py-3 px-4 text-slate-300">{formatCurrency(sale.unitPrice)}/t</td>
                      <td className="py-3 px-4 text-success-400 font-medium">{formatCurrency(sale.totalAmount)}</td>
                      <td className="py-3 px-4 text-slate-300">{sale.saleDate}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono">{sale.invoiceNumber || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded ${
                          sale.status === 'completed' ? 'bg-success-500/20 text-success-400' :
                          sale.status === 'shipped' ? 'bg-primary-500/20 text-primary-400' :
                          sale.status === 'cancelled' ? 'bg-danger-500/20 text-danger-400' :
                          'bg-warning-500/20 text-warning-400'
                        }`}>
                          {sale.status === 'completed' ? '已完成' :
                           sale.status === 'shipped' ? '已出库' :
                           sale.status === 'cancelled' ? '已取消' : '待确认'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
