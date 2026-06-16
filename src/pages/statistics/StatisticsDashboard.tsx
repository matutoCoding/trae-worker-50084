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
  Filter,
  X,
  Eye,
  ArrowRight,
  Warehouse,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useShipStore } from '../../store/useShipStore';
import { usePlanStore } from '../../store/usePlanStore';
import { useMaterialStore } from '../../store/useMaterialStore';
import { useHazmatStore } from '../../store/useHazmatStore';
import { StatCard } from '../../components/ui/StatCard';
import { LineChartCard } from '../../components/charts/LineChartCard';
import { BarChartCard } from '../../components/charts/BarChartCard';
import { TabNavigation } from '../../components/ui/TabNavigation';
import { Modal } from '../../components/ui/Modal';
import { TabItem, Sale } from '../../types';
import { formatCurrency, formatWeight, getMaterialCategoryText, getWasteTypeText, getStatusText } from '../../utils/format';

const tabs: TabItem[] = [
  { key: 'overview', label: '综合概览' },
  { key: 'production', label: '生产统计' },
  { key: 'sales', label: '销售统计' },
];

export const StatisticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { ships, getShipById } = useShipStore();
  const { plans } = usePlanStore();
  const { materials, sales, getInventoryStats, getSalesStats } = useMaterialStore();
  const { wastes, getWasteStats } = useHazmatStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('month');
  const [salesTimeRange, setSalesTimeRange] = useState('month');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const materialCategories = useMemo(() => {
    const categories = new Set(materials.map(m => m.category));
    return Array.from(categories).map(cat => ({
      value: cat,
      label: getMaterialCategoryText(cat),
    }));
  }, [materials]);

  const customerList = useMemo(() => {
    const customers = new Set(sales.map(s => s.customer));
    return Array.from(customers).map(customer => ({
      value: customer,
      label: customer,
    }));
  }, [sales]);

  const getDateRange = (range: string): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let start = new Date();

    switch (range) {
      case 'week':
        const dayOfWeek = now.getDay() || 7;
        start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek + 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1, 0, 0, 0, 0);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          const customEnd = new Date(customEndDate);
          customEnd.setHours(23, 59, 59, 999);
          return { start, end: customEnd };
        }
        break;
    }
    return { start, end };
  };

  const filteredSales = useMemo(() => {
    let result = sales.filter(s => s.status !== 'cancelled');

    const { start, end } = getDateRange(salesTimeRange);
    result = result.filter(s => {
      const saleDate = new Date(s.saleDate);
      return saleDate >= start && saleDate <= end;
    });

    if (selectedCustomer) {
      result = result.filter(s => s.customer === selectedCustomer);
    }

    if (selectedCategory) {
      const categoryMaterials = materials.filter(m => m.category === selectedCategory).map(m => m.id);
      result = result.filter(s => categoryMaterials.includes(s.materialId));
    }

    return result;
  }, [sales, salesTimeRange, selectedCustomer, selectedCategory, materials, customStartDate, customEndDate]);

  const filteredSalesStats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);

    const byCustomer: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byMonth: Record<string, number> = {};

    const materialIdToCategory: Record<string, string> = {};
    materials.forEach(m => {
      materialIdToCategory[m.id] = m.category;
    });

    filteredSales.forEach(s => {
      byCustomer[s.customer] = (byCustomer[s.customer] || 0) + s.totalAmount;

      const category = materialIdToCategory[s.materialId] || 'other';
      const categoryLabel = getMaterialCategoryText(category);
      byCategory[categoryLabel] = (byCategory[categoryLabel] || 0) + s.totalAmount;

      const saleDate = new Date(s.saleDate);
      const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
      byMonth[monthKey] = (byMonth[monthKey] || 0) + s.totalAmount;
    });

    const topCustomers = Object.entries(byCustomer)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const categoryDistribution = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const categoryTotal = categoryDistribution.reduce((sum, c) => sum + c.value, 0);
    const categoryPercentage = categoryDistribution.map(c => ({
      name: c.name,
      value: categoryTotal > 0 ? Math.round((c.value / categoryTotal) * 100) : 0,
    }));

    const monthlyTrend = Object.entries(byMonth)
      .map(([name, value]) => ({ name: name.substring(5) + '月', value }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      totalRevenue,
      byCustomer,
      topCustomers,
      orderCount: filteredSales.length,
      customerCount: Object.keys(byCustomer).length,
      categoryDistribution,
      categoryPercentage,
      monthlyTrend,
      categorySalesByMonth: (() => {
        const categoryMonthData: Record<string, Record<string, number>> = {};
        filteredSales.forEach(s => {
          const category = materialIdToCategory[s.materialId] || 'other';
          const categoryLabel = getMaterialCategoryText(category);
          const saleDate = new Date(s.saleDate);
          const monthKey = `${saleDate.getMonth() + 1}月`;
          if (!categoryMonthData[categoryLabel]) {
            categoryMonthData[categoryLabel] = {};
          }
          categoryMonthData[categoryLabel][monthKey] = (categoryMonthData[categoryLabel][monthKey] || 0) + s.totalAmount;
        });
        const allMonths = Array.from(new Set(filteredSales.map(s => {
          const d = new Date(s.saleDate);
          return `${d.getMonth() + 1}月`;
        }))).sort();
        return Object.entries(categoryMonthData).map(([category, monthData]) => ({
          name: category,
          data: allMonths.map(month => ({
            name: month,
            value: monthData[month] || 0,
          })),
        }));
      })(),
    };
  }, [filteredSales, materials]);

  const handleViewSaleDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSale(null);
  };

  const handleResetFilters = () => {
    setSalesTimeRange('month');
    setSelectedCustomer('');
    setSelectedCategory('');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleNavigateToMaterials = () => {
    handleCloseModal();
    navigate('/materials');
  };

  const selectedSaleMaterial = useMemo(() => {
    if (!selectedSale) return null;
    return materials.find(m => m.id === selectedSale.materialId) || null;
  }, [selectedSale, materials]);

  const selectedSaleShipName = useMemo(() => {
    if (!selectedSaleMaterial?.shipId) return '未知';
    const ship = getShipById(selectedSaleMaterial.shipId);
    return ship?.name || selectedSaleMaterial.shipName || selectedSaleMaterial.shipId;
  }, [selectedSaleMaterial, getShipById]);

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
          color="primary"
          trend={{ value: 12, isUp: true }}
        />
        <StatCard
          title="总拆解进度"
          value={`${overallStats.totalDisassemblyProgress}%`}
          icon={<BarChart3 className="w-6 h-6" />}
          color="success"
          trend={{ value: 8.5, isUp: true }}
        />
        <StatCard
          title="累计销售额"
          value={`${(overallStats.totalSalesAmount / 1000000).toFixed(1)} M`}
          icon={<DollarSign className="w-6 h-6" />}
          color="warning"
          trend={{ value: 15.2, isUp: true }}
        />
        <StatCard
          title="物料回收量"
          value={`${(overallStats.totalMaterialsRecovered / 1000).toFixed(1)} kt`}
          icon={<Scale className="w-6 h-6" />}
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
          <div className="industrial-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                筛选条件
              </h3>
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                重置筛选
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">时间范围</label>
                <select
                  value={salesTimeRange}
                  onChange={(e) => setSalesTimeRange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  <option value="week">本周</option>
                  <option value="month">本月</option>
                  <option value="quarter">本季</option>
                  <option value="year">本年</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
              {salesTimeRange === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">开始日期</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">结束日期</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm text-slate-400 mb-2">客户</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  <option value="">全部客户</option>
                  {customerList.map(customer => (
                    <option key={customer.value} value={customer.value}>
                      {customer.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">物料类别</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  <option value="">全部类别</option>
                  {materialCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="industrial-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">筛选后销售额</p>
                  <p className="text-2xl font-bold text-success-400 mt-1">
                    {(filteredSalesStats.totalRevenue / 10000).toFixed(0)} 万
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    共 {filteredSalesStats.orderCount} 笔订单
                  </p>
                </div>
                <div className="w-12 h-12 bg-success-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success-400" />
                </div>
              </div>
            </div>
            <div className="industrial-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">累计销售额</p>
                  <p className="text-2xl font-bold text-primary-400 mt-1">
                    {(filteredSalesStats.totalRevenue / 10000).toFixed(0)} 万
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    筛选范围内累计
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
                  <p className="text-2xl font-bold text-warning-400 mt-1">{filteredSalesStats.orderCount}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    筛选范围内
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
                    {filteredSalesStats.customerCount}
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
            <BarChartCard
              title="客户销售排行"
              data={filteredSalesStats.topCustomers.map(d => ({ ...d, value: d.value / 10000 }))}
              unit="万元"
              horizontal
            />
            <BarChartCard
              title="物料类别销售占比"
              data={filteredSalesStats.categoryPercentage.length > 0 ? filteredSalesStats.categoryPercentage : [{ name: '暂无数据', value: 0 }]}
              unit="%"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChartCard
              title="按月销售额趋势"
              data={filteredSalesStats.monthlyTrend.length > 0 ? filteredSalesStats.monthlyTrend.map(d => ({ ...d, value: d.value / 10000 })) : [{ name: '暂无数据', value: 0 }]}
              unit="万元"
              color="#10b981"
            />
            {filteredSalesStats.categorySalesByMonth.length > 0 && filteredSalesStats.categorySalesByMonth[0].data.length > 0 ? (
              filteredSalesStats.categorySalesByMonth.map((category, idx) => (
                <LineChartCard
                  key={category.name}
                  title={`${category.name}销售额趋势`}
                  data={category.data.map(d => ({ ...d, value: d.value / 10000 }))}
                  color={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5]}
                  unit="万元"
                />
              ))
            ) : (
              <BarChartCard
                title="按物料类别销售额趋势"
                data={[{ name: '暂无数据', value: 0 }]}
                unit="万元"
              />
            )}
          </div>

          {filteredSalesStats.categorySalesByMonth.length > 1 && (
            <div className="industrial-card p-5">
              <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                各物料类别月度销售额对比（万元）
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">物料类别</th>
                      {filteredSalesStats.categorySalesByMonth[0]?.data.map(d => (
                        <th key={d.name} className="text-right py-3 px-4 text-sm font-medium text-slate-400">{d.name}</th>
                      ))}
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">合计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalesStats.categorySalesByMonth.map(category => {
                      const total = category.data.reduce((sum, d) => sum + d.value, 0);
                      return (
                        <tr key={category.name} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-medium text-slate-200">{category.name}</td>
                          {category.data.map(d => (
                            <td key={d.name} className="py-3 px-4 text-right text-slate-300">
                              {(d.value / 10000).toFixed(0)}
                            </td>
                          ))}
                          <td className="py-3 px-4 text-right text-success-400 font-medium">
                            {(total / 10000).toFixed(0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length > 0 ? (
                    filteredSales.map(sale => (
                      <tr key={sale.id} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-200">{sale.materialName}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{sale.customer}</td>
                        <td className="py-3 px-4 text-slate-300">{formatWeight(sale.quantity, 't')}</td>
                        <td className="py-3 px-4 text-slate-300">{formatCurrency(sale.unitPrice)}/t</td>
                        <td className="py-3 px-4 text-success-400 font-medium">{formatCurrency(sale.totalAmount)}</td>
                        <td className="py-3 px-4 text-slate-300">{sale.saleDate}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded ${
                            sale.status === 'completed' ? 'bg-success-500/20 text-success-400' :
                            sale.status === 'shipped' ? 'bg-primary-500/20 text-primary-400' :
                            sale.status === 'cancelled' ? 'bg-danger-500/20 text-danger-400' :
                            'bg-warning-500/20 text-warning-400'
                          }`}>
                            {getStatusText(sale.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleViewSaleDetail(sale)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-400 bg-primary-500/10 rounded-lg hover:bg-primary-500/20 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            查看详情
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        暂无符合筛选条件的销售数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="销售单详情"
        width="max-w-3xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              onClick={handleNavigateToMaterials}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              跳转到物料管理
            </button>
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
            >
              关闭
            </button>
          </div>
        }
      >
        {selectedSale && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/30 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">销售单号</p>
                <p className="text-lg font-semibold text-slate-200 font-mono">{selectedSale.id}</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">状态</p>
                <span className={`inline-block px-3 py-1 text-sm rounded ${
                  selectedSale.status === 'completed' ? 'bg-success-500/20 text-success-400' :
                  selectedSale.status === 'shipped' ? 'bg-primary-500/20 text-primary-400' :
                  selectedSale.status === 'cancelled' ? 'bg-danger-500/20 text-danger-400' :
                  'bg-warning-500/20 text-warning-400'
                }`}>
                  {getStatusText(selectedSale.status)}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-700/50 pt-4">
              <h4 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" />
                关联物料信息
              </h4>
              {selectedSaleMaterial ? (
                <div className="bg-slate-800/30 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">物料名称</p>
                      <p className="text-slate-200 font-medium">{selectedSaleMaterial.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">物料类别</p>
                      <p className="text-slate-200">{getMaterialCategoryText(selectedSaleMaterial.category)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">当前库存状态</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        selectedSaleMaterial.status === 'in_stock' ? 'bg-primary-500/20 text-primary-400' :
                        selectedSaleMaterial.status === 'sold' ? 'bg-success-500/20 text-success-400' :
                        'bg-warning-500/20 text-warning-400'
                      }`}>
                        {getStatusText(selectedSaleMaterial.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">存放仓库</p>
                      <p className="text-slate-200 flex items-center gap-1">
                        <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                        {selectedSaleMaterial.warehouse}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">当前库存重量</p>
                      <p className="text-slate-200 font-medium">{formatWeight(selectedSaleMaterial.weight, selectedSaleMaterial.unit)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">物料单价</p>
                      <p className="text-slate-200 font-medium text-success-400">{formatCurrency(selectedSaleMaterial.price)}/{selectedSaleMaterial.unit}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-700/50 pt-4">
                    <p className="text-xs text-slate-500 mb-1">来源船舶</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-500/20 rounded flex items-center justify-center">
                        <Ship className="w-4 h-4 text-primary-400" />
                      </div>
                      <div>
                        <p className="text-slate-200 font-medium">{selectedSaleShipName}</p>
                        <p className="text-xs text-slate-500">Ship ID: {selectedSaleMaterial.shipId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/30 rounded-lg p-4 text-center text-slate-500">
                  未找到关联物料信息 (Material ID: {selectedSale.materialId})
                </div>
              )}
            </div>

            <div className="border-t border-slate-700/50 pt-4">
              <h4 className="text-sm font-medium text-slate-400 mb-4">基本信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">物料名称</p>
                  <p className="text-slate-200">{selectedSale.materialName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">物料ID</p>
                  <p className="text-slate-200 font-mono">{selectedSale.materialId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">客户名称</p>
                  <p className="text-slate-200">{selectedSale.customer}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">销售日期</p>
                  <p className="text-slate-200">{selectedSale.saleDate}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700/50 pt-4">
              <h4 className="text-sm font-medium text-slate-400 mb-4">数量与金额</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/30 rounded-lg p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">销售数量</p>
                  <p className="text-xl font-bold text-slate-200">{formatWeight(selectedSale.quantity, 't')}</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">单价</p>
                  <p className="text-xl font-bold text-slate-200">{formatCurrency(selectedSale.unitPrice)}/t</p>
                </div>
                <div className="bg-success-500/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">总金额</p>
                  <p className="text-xl font-bold text-success-400">{formatCurrency(selectedSale.totalAmount)}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700/50 pt-4">
              <h4 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                发票信息
              </h4>
              <div className="bg-slate-800/30 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">发票号码</p>
                    <p className="text-slate-200 font-mono">
                      {selectedSale.invoiceNumber || <span className="text-slate-500">未开具</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">开票日期</p>
                    <p className="text-slate-200">
                      {selectedSale.invoiceDate || <span className="text-slate-500">未开票</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">开票状态</p>
                    {selectedSale.invoiceStatus ? (
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        selectedSale.invoiceStatus === 'received' ? 'bg-success-500/20 text-success-400' :
                        selectedSale.invoiceStatus === 'sent' ? 'bg-primary-500/20 text-primary-400' :
                        selectedSale.invoiceStatus === 'issued' ? 'bg-warning-500/20 text-warning-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {getStatusText(selectedSale.invoiceStatus)}
                      </span>
                    ) : (
                      <span className="text-slate-500">未开具</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700/50 pt-4">
              <h4 className="text-sm font-medium text-slate-400 mb-4">金额明细</h4>
              <div className="bg-slate-800/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">销售数量</span>
                  <span className="text-slate-200">{selectedSale.quantity} t</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">单价</span>
                  <span className="text-slate-200">{formatCurrency(selectedSale.unitPrice)}/t</span>
                </div>
                <div className="border-t border-slate-700/50 my-2"></div>
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">合计金额</span>
                  <span className="text-success-400 font-bold text-lg">{formatCurrency(selectedSale.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
