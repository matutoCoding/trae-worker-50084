import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Droplets,
  Wind,
  Volume2,
  Search,
  MapPin,
  Clock,
  Gauge,
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { EnvMonitoring as EnvMonitoringType, TabItem } from '../../types';
import { useEnvStore } from '../../store/useEnvStore';
import { StatCard } from '../../components/ui/StatCard';
import { TabNavigation } from '../../components/ui/TabNavigation';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LineChartCard } from '../../components/charts/LineChartCard';
import { BarChartCard } from '../../components/charts/BarChartCard';
import { GaugeChart } from '../../components/charts/GaugeChart';
import { formatDate, formatNumber } from '../../utils/format';

const tabs: TabItem[] = [
  { key: 'realtime', label: '实时监测' },
  { key: 'dust-noise', label: '扬尘噪声' },
  { key: 'treatment', label: '油污水处理' },
];

const monitorTypeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'dust', label: '扬尘监测' },
  { value: 'noise', label: '噪声监测' },
  { value: 'water', label: '水质监测' },
  { value: 'air', label: '空气质量' },
];

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'normal', label: '正常' },
  { value: 'warning', label: '预警' },
  { value: 'exceeded', label: '超标' },
];

export const EnvMonitoring: React.FC = () => {
  const { monitorings, currentData, fetchMonitorings, refreshCurrentData, getAlerts } = useEnvStore();
  const [activeTab, setActiveTab] = useState('realtime');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const stats = useMemo(() => {
    const locations = new Set(monitorings.map(m => m.location));
    const normalCount = monitorings.filter(m => m.status === 'normal').length;
    const warningCount = monitorings.filter(m => m.status === 'warning').length;
    const exceededCount = monitorings.filter(m => m.status === 'exceeded').length;
    
    return {
      totalPoints: locations.size,
      normal: normalCount,
      warning: warningCount,
      exceeded: exceededCount,
    };
  }, [monitorings]);

  const alerts = useMemo(() => getAlerts(), [getAlerts]);

  const alertStats = useMemo(() => {
    const byType = {
      dust: alerts.filter(a => a.type === 'dust').length,
      noise: alerts.filter(a => a.type === 'noise').length,
      water: alerts.filter(a => a.type === 'water').length,
      air: alerts.filter(a => a.type === 'air').length,
    };
    const byStatus = {
      warning: alerts.filter(a => a.status === 'warning').length,
      exceeded: alerts.filter(a => a.status === 'exceeded').length,
    };
    return { byType, byStatus };
  }, [alerts]);

  const filteredMonitorings = useMemo(() => {
    return monitorings.filter(m => {
      const matchKeyword = !searchKeyword ||
        m.location.includes(searchKeyword) ||
        m.deviceId.includes(searchKeyword);
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchKeyword && matchType && matchStatus;
    });
  }, [monitorings, searchKeyword, typeFilter, statusFilter]);

  const paginatedMonitorings = useMemo(() => {
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    return filteredMonitorings.slice(start, start + pageSize);
  }, [filteredMonitorings, page]);

  const treatmentRecords = useMemo(() => {
    return [
      {
        id: 'treat-001',
        date: '2026-06-17',
        inflow: 25.5,
        outflow: 24.8,
        processingRate: 97.3,
        codBefore: 420,
        codAfter: 42.5,
        oilBefore: 35.2,
        oilAfter: 3.2,
        ssBefore: 280,
        ssAfter: 28.6,
        status: 'normal',
        operator: '张三',
      },
      {
        id: 'treat-002',
        date: '2026-06-16',
        inflow: 28.2,
        outflow: 27.5,
        processingRate: 97.5,
        codBefore: 380,
        codAfter: 38.2,
        oilBefore: 32.5,
        oilAfter: 2.8,
        ssBefore: 260,
        ssAfter: 25.3,
        status: 'normal',
        operator: '李四',
      },
      {
        id: 'treat-003',
        date: '2026-06-15',
        inflow: 32.1,
        outflow: 31.2,
        processingRate: 97.2,
        codBefore: 450,
        codAfter: 48.5,
        oilBefore: 38.0,
        oilAfter: 3.5,
        ssBefore: 310,
        ssAfter: 30.1,
        status: 'normal',
        operator: '张三',
      },
      {
        id: 'treat-004',
        date: '2026-06-14',
        inflow: 26.8,
        outflow: 25.9,
        processingRate: 96.6,
        codBefore: 520,
        codAfter: 55.2,
        oilBefore: 42.0,
        oilAfter: 4.2,
        ssBefore: 350,
        ssAfter: 35.8,
        status: 'warning',
        operator: '王五',
      },
      {
        id: 'treat-005',
        date: '2026-06-13',
        inflow: 24.5,
        outflow: 23.8,
        processingRate: 97.1,
        codBefore: 360,
        codAfter: 36.5,
        oilBefore: 28.5,
        oilAfter: 2.5,
        ssBefore: 240,
        ssAfter: 24.2,
        status: 'normal',
        operator: '李四',
      },
    ];
  }, []);

  const monitoringColumns = [
    {
      key: 'type',
      title: '监测类型',
      render: (m: EnvMonitoringType) => (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            m.type === 'dust' ? 'bg-warning-500/20 text-warning-400' :
            m.type === 'noise' ? 'bg-primary-500/20 text-primary-400' :
            m.type === 'water' ? 'bg-cyan-500/20 text-cyan-400' :
            'bg-success-500/20 text-success-400'
          }`}>
            {m.type === 'dust' && <Wind className="w-4 h-4" />}
            {m.type === 'noise' && <Volume2 className="w-4 h-4" />}
            {m.type === 'water' && <Droplets className="w-4 h-4" />}
            {m.type === 'air' && <Activity className="w-4 h-4" />}
          </div>
          <span className="text-slate-200">
            {m.type === 'dust' ? '扬尘监测' :
             m.type === 'noise' ? '噪声监测' :
             m.type === 'water' ? '水质监测' : '空气质量'}
          </span>
        </div>
      ),
    },
    {
      key: 'location',
      title: '监测位置',
      render: (m: EnvMonitoringType) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <MapPin className="w-3 h-3 text-slate-500" />
          {m.location}
        </div>
      ),
    },
    {
      key: 'value',
      title: '监测值',
      render: (m: EnvMonitoringType) => (
        <div>
          <p className={`font-medium ${
            m.status === 'exceeded' ? 'text-danger-400' :
            m.status === 'warning' ? 'text-warning-400' : 'text-success-400'
          }`}>
            {formatNumber(m.value)} {m.unit}
          </p>
          <p className="text-xs text-slate-500">阈值: {m.threshold} {m.unit}</p>
        </div>
      ),
    },
    {
      key: 'deviceId',
      title: '设备编号',
      dataIndex: 'deviceId' as const,
      className: 'font-mono text-sm',
    },
    {
      key: 'monitorTime',
      title: '监测时间',
      render: (m: EnvMonitoringType) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <Clock className="w-3 h-3 text-slate-500" />
          {formatDate(m.monitorTime)}
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (m: EnvMonitoring) => <StatusBadge status={m.status} />,
    },
  ];

  const treatmentColumns = [
    {
      key: 'date',
      title: '处理日期',
      dataIndex: 'date' as const,
    },
    {
      key: 'inflow',
      title: '进水量',
      render: (r: any) => <span className="text-slate-200">{formatNumber(r.inflow)} m³</span>,
    },
    {
      key: 'outflow',
      title: '出水量',
      render: (r: any) => <span className="text-slate-200">{formatNumber(r.outflow)} m³</span>,
    },
    {
      key: 'processingRate',
      title: '处理率',
      render: (r: any) => (
        <span className="text-success-400 font-medium">{formatNumber(r.processingRate)}%</span>
      ),
    },
    {
      key: 'cod',
      title: 'COD (mg/L)',
      render: (r: any) => (
        <div>
          <p className="text-slate-200">
            {r.codBefore} → <span className={r.codAfter > 50 ? 'text-danger-400' : 'text-success-400'}>{r.codAfter}</span>
          </p>
          <p className="text-xs text-slate-500">排放标准: ≤50</p>
        </div>
      ),
    },
    {
      key: 'oil',
      title: '石油类 (mg/L)',
      render: (r: any) => (
        <div>
          <p className="text-slate-200">
            {r.oilBefore} → <span className={r.oilAfter > 5 ? 'text-danger-400' : 'text-success-400'}>{r.oilAfter}</span>
          </p>
          <p className="text-xs text-slate-500">排放标准: ≤5</p>
        </div>
      ),
    },
    {
      key: 'ss',
      title: 'SS (mg/L)',
      render: (r: any) => (
        <div>
          <p className="text-slate-200">
            {r.ssBefore} → <span className={r.ssAfter > 30 ? 'text-danger-400' : 'text-success-400'}>{r.ssAfter}</span>
          </p>
          <p className="text-xs text-slate-500">排放标准: ≤30</p>
        </div>
      ),
    },
    {
      key: 'operator',
      title: '操作人员',
      dataIndex: 'operator' as const,
    },
    {
      key: 'status',
      title: '达标状态',
      render: (r: any) => (
        <div className="flex items-center gap-1">
          {r.status === 'normal' ? (
            <CheckCircle className="w-4 h-4 text-success-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-warning-400" />
          )}
          <span className={r.status === 'normal' ? 'text-success-400' : 'text-warning-400'}>
            {r.status === 'normal' ? '达标' : '接近阈值'}
          </span>
        </div>
      ),
    },
  ];

  const dustTrendData = useMemo(() => {
    return currentData.dust.trend.map((value, index) => ({
      name: currentData.dust.timeLabels[index],
      value,
    }));
  }, [currentData]);

  const noiseTrendData = useMemo(() => {
    return currentData.noise.trend.map((value, index) => ({
      name: currentData.noise.timeLabels[index],
      value,
    }));
  }, [currentData]);

  const waterTrendData = useMemo(() => {
    return currentData.water.trend.map((value, index) => ({
      name: currentData.water.timeLabels[index],
      value,
    }));
  }, [currentData]);

  const alertTypeData = useMemo(() => [
    { name: '扬尘', value: alertStats.byType.dust },
    { name: '噪声', value: alertStats.byType.noise },
    { name: '水质', value: alertStats.byType.water },
    { name: '空气', value: alertStats.byType.air },
  ], [alertStats]);

  const alertStatusData = useMemo(() => [
    { name: '预警', value: alertStats.byStatus.warning },
    { name: '超标', value: alertStats.byStatus.exceeded },
  ], [alertStats]);

  const handleRefresh = () => {
    fetchMonitorings();
    refreshCurrentData();
  };

  const getMonitorTypeIcon = (type: string) => {
    switch (type) {
      case 'dust': return <Wind className="w-6 h-6" />;
      case 'noise': return <Volume2 className="w-6 h-6" />;
      case 'water': return <Droplets className="w-6 h-6" />;
      case 'air': return <Activity className="w-6 h-6" />;
      default: return <Gauge className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 font-display">环保监测中心</h1>
          <p className="text-slate-400 mt-1">实时监测扬尘、噪声、水质等环境指标</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="监测点数量"
          value={stats.totalPoints}
          icon={<MapPin className="w-6 h-6" />}
          gradient="from-primary-500/20 to-primary-700/20"
          color="primary"
        />
        <StatCard
          title="正常运行"
          value={stats.normal}
          icon={<CheckCircle className="w-6 h-6" />}
          gradient="from-success-500/20 to-success-700/20"
          color="success"
        />
        <StatCard
          title="预警数量"
          value={stats.warning}
          icon={<AlertTriangle className="w-6 h-6" />}
          gradient="from-warning-500/20 to-warning-700/20"
          color="warning"
        />
        <StatCard
          title="超标数量"
          value={stats.exceeded}
          icon={<XCircle className="w-6 h-6" />}
          gradient="from-danger-500/20 to-danger-700/20"
          color="danger"
        />
      </div>

      <TabNavigation tabs={tabs} activeTab={activeTab} onChange={(key) => { setActiveTab(key); setPage(1); }} />

      {activeTab === 'realtime' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="industrial-card p-5">
              <GaugeChart
                value={currentData.dust.pm2_5}
                max={75}
                label="PM2.5"
                unit="μg/m³"
                threshold={35}
                size={160}
              />
            </div>
            <div className="industrial-card p-5">
              <GaugeChart
                value={currentData.dust.pm10}
                max={150}
                label="PM10"
                unit="μg/m³"
                threshold={70}
                size={160}
              />
            </div>
            <div className="industrial-card p-5">
              <GaugeChart
                value={currentData.noise.current}
                max={120}
                label="噪声"
                unit="dB"
                threshold={75}
                size={160}
              />
            </div>
            <div className="industrial-card p-5">
              <GaugeChart
                value={currentData.water.cod}
                max={100}
                label="COD"
                unit="mg/L"
                threshold={50}
                size={160}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <LineChartCard
              title="PM2.5 趋势图"
              data={dustTrendData}
              color="#f97316"
              unit="μg/m³"
              showThreshold
              thresholdValue={35}
            />
            <LineChartCard
              title="噪声趋势图"
              data={noiseTrendData}
              color="#3b82f6"
              unit="dB"
              showThreshold
              thresholdValue={75}
            />
            <LineChartCard
              title="水质COD趋势图"
              data={waterTrendData}
              color="#06b6d4"
              unit="mg/L"
              showThreshold
              thresholdValue={50}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BarChartCard
              title="告警类型统计"
              data={alertTypeData}
              unit="次"
            />
            <BarChartCard
              title="告警状态统计"
              data={alertStatusData}
              unit="次"
            />
          </div>

          {alerts.length > 0 && (
            <div className="industrial-card p-5">
              <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning-400" />
                实时告警
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {alerts.slice(0, 10).map(alert => (
                  <div
                    key={alert.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border ${
                      alert.status === 'exceeded'
                        ? 'bg-danger-500/10 border-danger-500/30'
                        : 'bg-warning-500/10 border-warning-500/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      alert.type === 'dust' ? 'bg-warning-500/20 text-warning-400' :
                      alert.type === 'noise' ? 'bg-primary-500/20 text-primary-400' :
                      alert.type === 'water' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-success-500/20 text-success-400'
                    }`}>
                      {getMonitorTypeIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">
                          {alert.type === 'dust' ? '扬尘超标' :
                           alert.type === 'noise' ? '噪声超标' :
                           alert.type === 'water' ? '水质超标' : '空气质量异常'}
                        </span>
                        <StatusBadge status={alert.status} size="sm" />
                      </div>
                      <p className="text-sm text-slate-400">
                        {alert.location} - {formatNumber(alert.value)} {alert.unit}
                        <span className="text-slate-500"> (阈值: {alert.threshold} {alert.unit})</span>
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      {formatDate(alert.monitorTime)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'dust-noise' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="industrial-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-400">PM2.5 当前值</h4>
                <Wind className="w-5 h-5 text-warning-400" />
              </div>
              <p className="text-3xl font-bold font-display text-slate-100">
                {currentData.dust.pm2_5}
                <span className="text-sm font-normal text-slate-500 ml-1">μg/m³</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">阈值: 35 μg/m³</p>
            </div>
            <div className="industrial-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-400">PM10 当前值</h4>
                <Wind className="w-5 h-5 text-warning-400" />
              </div>
              <p className="text-3xl font-bold font-display text-slate-100">
                {currentData.dust.pm10}
                <span className="text-sm font-normal text-slate-500 ml-1">μg/m³</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">阈值: 70 μg/m³</p>
            </div>
            <div className="industrial-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-400">噪声当前值</h4>
                <Volume2 className="w-5 h-5 text-primary-400" />
              </div>
              <p className="text-3xl font-bold font-display text-slate-100">
                {currentData.noise.current}
                <span className="text-sm font-normal text-slate-500 ml-1">dB</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">阈值: 75 dB</p>
            </div>
            <div className="industrial-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-400">噪声峰值</h4>
                <Volume2 className="w-5 h-5 text-danger-400" />
              </div>
              <p className="text-3xl font-bold font-display text-slate-100">
                {currentData.noise.peak}
                <span className="text-sm font-normal text-slate-500 ml-1">dB</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">阈值: 85 dB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LineChartCard
              title="扬尘趋势 (PM2.5)"
              data={dustTrendData}
              color="#f97316"
              unit="μg/m³"
              showThreshold
              thresholdValue={35}
            />
            <LineChartCard
              title="噪声趋势"
              data={noiseTrendData}
              color="#3b82f6"
              unit="dB"
              showThreshold
              thresholdValue={75}
            />
          </div>

          <div className="industrial-card p-5">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">监测点位分布</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['拆解作业区A', '拆解作业区B', '油污水处理站', '危废暂存区', '物料堆场', '厂区边界'].map((location, idx) => (
                <div key={location} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{location}</p>
                      <p className="text-xs text-slate-500">设备在线</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-slate-500">PM10</p>
                      <p className={`font-medium ${idx % 3 === 0 ? 'text-warning-400' : 'text-success-400'}`}>
                        {(50 + idx * 8).toFixed(1)} μg/m³
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">噪声</p>
                      <p className={`font-medium ${idx % 2 === 0 ? 'text-primary-400' : 'text-success-400'}`}>
                        {(65 + idx * 3).toFixed(1)} dB
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'treatment' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="industrial-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-400">今日进水量</h4>
                <Droplets className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-3xl font-bold font-display text-slate-100">
                {currentData.treatment.inflow}
                <span className="text-sm font-normal text-slate-500 ml-1">m³</span>
              </p>
            </div>
            <div className="industrial-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-400">今日出水量</h4>
                <Droplets className="w-5 h-5 text-success-400" />
              </div>
              <p className="text-3xl font-bold font-display text-slate-100">
                {currentData.treatment.outflow}
                <span className="text-sm font-normal text-slate-500 ml-1">m³</span>
              </p>
            </div>
            <div className="industrial-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-400">处理率</h4>
                <TrendingUp className="w-5 h-5 text-success-400" />
              </div>
              <p className="text-3xl font-bold font-display text-success-400">
                {currentData.treatment.processingRate}
                <span className="text-sm font-normal text-slate-500 ml-1">%</span>
              </p>
            </div>
            <div className="industrial-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-400">运行状态</h4>
                <Activity className="w-5 h-5 text-success-400" />
              </div>
              <p className="text-3xl font-bold font-display text-success-400">运行中</p>
              <p className="text-xs text-slate-500 mt-2">
                启动时间: {formatDate(currentData.treatment.startTime)}
              </p>
            </div>
          </div>

          <div className="industrial-card p-5">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">药剂储量</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'PAC', value: currentData.treatment.chemicals.pac, color: 'primary' },
                { name: 'PAM', value: currentData.treatment.chemicals.pam, color: 'success' },
                { name: '活性炭', value: currentData.treatment.chemicals.activatedCarbon, color: 'warning' },
              ].map(item => (
                <div key={item.name} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">{item.name}</span>
                    <span className={`text-2xl font-bold font-display ${
                      item.value < 30 ? 'text-danger-400' :
                      item.value < 60 ? 'text-warning-400' : 'text-success-400'
                    }`}>
                      {item.value}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.value < 30 ? 'bg-danger-500' :
                        item.value < 60 ? 'bg-warning-500' : 'bg-success-500'
                      }`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="industrial-card p-5">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-400" />
              处理前后指标对比
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                { name: 'COD', before: 420, after: 42.5, threshold: 50, unit: 'mg/L' },
                { name: '石油类', before: 35.2, after: 3.2, threshold: 5, unit: 'mg/L' },
                { name: 'SS', before: 280, after: 28.6, threshold: 30, unit: 'mg/L' },
              ].map(item => (
                <div key={item.name} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <h4 className="text-sm font-medium text-slate-400 mb-3">{item.name}</h4>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="text-xs text-slate-500">处理前</p>
                      <p className="text-2xl font-bold text-slate-200">{item.before}</p>
                    </div>
                    <div className="text-2xl text-slate-600">→</div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">处理后</p>
                      <p className={`text-2xl font-bold ${item.after > item.threshold ? 'text-danger-400' : 'text-success-400'}`}>
                        {item.after}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    排放标准: ≤{item.threshold} {item.unit}
                  </div>
                  <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.after > item.threshold ? 'bg-danger-500' : 'bg-success-500'}`}
                      style={{ width: `${Math.min((item.after / item.threshold) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="搜索监测位置、设备编号..."
            value={searchKeyword}
            onChange={(e) => { setSearchKeyword(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
          >
            {monitorTypeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {activeTab === 'treatment' ? (
        <DataTable
          columns={treatmentColumns}
          data={treatmentRecords}
          pagination={{
            current: page,
            pageSize: 10,
            total: treatmentRecords.length,
            onChange: setPage,
          }}
        />
      ) : (
        <DataTable
          columns={monitoringColumns}
          data={paginatedMonitorings}
          pagination={{
            current: page,
            pageSize: 10,
            total: filteredMonitorings.length,
            onChange: setPage,
          }}
        />
      )}
    </div>
  );
};
