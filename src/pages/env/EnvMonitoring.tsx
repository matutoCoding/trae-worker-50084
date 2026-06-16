import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Edit,
  Plus,
  Check,
  X,
  Download,
  Calendar,
} from 'lucide-react';
import { EnvMonitoring as EnvMonitoringRecord, TreatmentRecord, TabItem } from '../../types';
import { useEnvStore } from '../../store/useEnvStore';
import { StatCard } from '../../components/ui/StatCard';
import { TabNavigation } from '../../components/ui/TabNavigation';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LineChartCard } from '../../components/charts/LineChartCard';
import { BarChartCard } from '../../components/charts/BarChartCard';
import { GaugeChart } from '../../components/charts/GaugeChart';
import { Modal } from '../../components/ui/Modal';
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

interface TreatmentFormData {
  date: string;
  inflow: string;
  outflow: string;
  codBefore: string;
  codAfter: string;
  oilBefore: string;
  oilAfter: string;
  ssBefore: string;
  ssAfter: string;
  operator: string;
}

interface AlertHandleFormData {
  handledBy: string;
  handleNote: string;
  handleResult: string;
}

const initialAlertFormData: AlertHandleFormData = {
  handledBy: '',
  handleNote: '',
  handleResult: 'handled',
};

const handleResultOptions = [
  { value: 'handled', label: '已处置' },
  { value: 'followup', label: '需跟进' },
  { value: 'false_alarm', label: '误报' },
];

const initialFormData: TreatmentFormData = {
  date: new Date().toISOString().split('T')[0],
  inflow: '',
  outflow: '',
  codBefore: '',
  codAfter: '',
  oilBefore: '',
  oilAfter: '',
  ssBefore: '',
  ssAfter: '',
  operator: '',
};

export const EnvMonitoring: React.FC = () => {
  const {
    monitorings,
    treatmentRecords,
    currentData,
    fetchMonitorings,
    refreshCurrentData,
    getAlerts,
    markAlertHandled,
    addTreatmentRecord,
    updateTreatmentRecord,
    filterTreatmentRecords,
  } = useEnvStore();

  const [activeTab, setActiveTab] = useState('realtime');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const [treatmentStartDate, setTreatmentStartDate] = useState('');
  const [treatmentEndDate, setTreatmentEndDate] = useState('');
  const [treatmentPage, setTreatmentPage] = useState(1);
  const treatmentScrollRef = useRef<HTMLDivElement>(null);
  const treatmentScrollPosition = useRef(0);

  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<EnvMonitoringRecord | null>(null);
  const [alertFormData, setAlertFormData] = useState<AlertHandleFormData>(initialAlertFormData);

  const [treatmentModalOpen, setTreatmentModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TreatmentRecord | null>(null);
  const [formData, setFormData] = useState<TreatmentFormData>(initialFormData);

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

  const filteredTreatmentRecords = useMemo(() => {
    return filterTreatmentRecords(treatmentStartDate || undefined, treatmentEndDate || undefined);
  }, [filterTreatmentRecords, treatmentStartDate, treatmentEndDate, treatmentRecords]);

  const paginatedTreatmentRecords = useMemo(() => {
    const pageSize = 10;
    const start = (treatmentPage - 1) * pageSize;
    return filteredTreatmentRecords.slice(start, start + pageSize);
  }, [filteredTreatmentRecords, treatmentPage]);

  const handleExportCSV = () => {
    if (filteredTreatmentRecords.length === 0) {
      alert('暂无数据可导出');
      return;
    }

    const headers = ['日期', '进水量', '出水量', '处理率', 'COD进水', 'COD出水', '石油类进水', '石油类出水', 'SS进水', 'SS出水', '状态', '操作员'];
    const rows = filteredTreatmentRecords.map(r => [
      r.date,
      r.inflow.toString(),
      r.outflow.toString(),
      `${r.processingRate}%`,
      r.codBefore.toString(),
      r.codAfter.toString(),
      r.oilBefore.toString(),
      r.oilAfter.toString(),
      r.ssBefore.toString(),
      r.ssAfter.toString(),
      r.status === 'normal' ? '达标' : '接近阈值',
      r.operator,
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `油污水处理记录_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const calculateProcessingRate = (inflow: number, outflow: number): number => {
    if (inflow <= 0) return 0;
    return Math.round((outflow / inflow) * 1000) / 10;
  };

  const calculateStatus = (codAfter: number, oilAfter: number, ssAfter: number): 'normal' | 'warning' => {
    if (codAfter > 50 || oilAfter > 5 || ssAfter > 30) {
      return 'warning';
    }
    return 'normal';
  };

  const computedFormValues = useMemo(() => {
    const inflow = parseFloat(formData.inflow) || 0;
    const outflow = parseFloat(formData.outflow) || 0;
    const codAfter = parseFloat(formData.codAfter) || 0;
    const oilAfter = parseFloat(formData.oilAfter) || 0;
    const ssAfter = parseFloat(formData.ssAfter) || 0;

    return {
      processingRate: calculateProcessingRate(inflow, outflow),
      status: calculateStatus(codAfter, oilAfter, ssAfter),
    };
  }, [formData]);

  const recentDataForAlert = useMemo(() => {
    if (!selectedAlert) return [];
    return monitorings
      .filter(m => m.type === selectedAlert.type && m.location === selectedAlert.location)
      .sort((a, b) => new Date(b.monitorTime).getTime() - new Date(a.monitorTime).getTime())
      .slice(0, 10);
  }, [selectedAlert, monitorings]);

  const handleAlertClick = (alert: EnvMonitoringRecord) => {
    setSelectedAlert(alert);
    setAlertFormData({
      handledBy: alert.handledBy || '',
      handleNote: alert.handledNote || '',
      handleResult: alert.handleResult || 'handled',
    });
    setAlertModalOpen(true);
  };

  const handleAlertFormChange = (field: keyof AlertHandleFormData, value: string) => {
    setAlertFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMarkHandled = () => {
    if (selectedAlert) {
      if (!alertFormData.handledBy.trim()) {
        alert('请填写责任人');
        return;
      }
      markAlertHandled(
        selectedAlert.id,
        alertFormData.handledBy.trim(),
        alertFormData.handleNote.trim(),
        alertFormData.handleResult
      );
      fetchMonitorings();
      setAlertModalOpen(false);
      setSelectedAlert(null);
      setAlertFormData(initialAlertFormData);
    }
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    setFormData(initialFormData);
    setTreatmentModalOpen(true);
  };

  const handleEditRecord = (record: TreatmentRecord) => {
    setEditingRecord(record);
    setFormData({
      date: record.date,
      inflow: record.inflow.toString(),
      outflow: record.outflow.toString(),
      codBefore: record.codBefore.toString(),
      codAfter: record.codAfter.toString(),
      oilBefore: record.oilBefore.toString(),
      oilAfter: record.oilAfter.toString(),
      ssBefore: record.ssBefore.toString(),
      ssAfter: record.ssAfter.toString(),
      operator: record.operator,
    });
    setTreatmentModalOpen(true);
  };

  const handleFormChange = (field: keyof TreatmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveTreatment = () => {
    const inflow = parseFloat(formData.inflow);
    const outflow = parseFloat(formData.outflow);
    const codBefore = parseFloat(formData.codBefore);
    const codAfter = parseFloat(formData.codAfter);
    const oilBefore = parseFloat(formData.oilBefore);
    const oilAfter = parseFloat(formData.oilAfter);
    const ssBefore = parseFloat(formData.ssBefore);
    const ssAfter = parseFloat(formData.ssAfter);

    if (isNaN(inflow) || isNaN(outflow) || isNaN(codBefore) || isNaN(codAfter) ||
        isNaN(oilBefore) || isNaN(oilAfter) || isNaN(ssBefore) || isNaN(ssAfter) ||
        !formData.date || !formData.operator) {
      alert('请填写完整的表单数据');
      return;
    }

    const processingRate = calculateProcessingRate(inflow, outflow);
    const status = calculateStatus(codAfter, oilAfter, ssAfter);

    const recordData = {
      date: formData.date,
      inflow,
      outflow,
      processingRate,
      codBefore,
      codAfter,
      oilBefore,
      oilAfter,
      ssBefore,
      ssAfter,
      status,
      operator: formData.operator,
    };

    if (editingRecord) {
      updateTreatmentRecord(editingRecord.id, recordData);
    } else {
      addTreatmentRecord(recordData);
    }

    setTreatmentModalOpen(false);
    setEditingRecord(null);
    setFormData(initialFormData);
  };

  const monitoringColumns = [
    {
      key: 'type',
      title: '监测类型',
      render: (m: EnvMonitoringRecord) => (
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
      render: (m: EnvMonitoringRecord) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <MapPin className="w-3 h-3 text-slate-500" />
          {m.location}
        </div>
      ),
    },
    {
      key: 'value',
      title: '监测值',
      render: (m: EnvMonitoringRecord) => (
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
      render: (m: EnvMonitoringRecord) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <Clock className="w-3 h-3 text-slate-500" />
          {formatDate(m.monitorTime)}
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (m: EnvMonitoringRecord) => <StatusBadge status={m.status} />,
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
      render: (r: TreatmentRecord) => <span className="text-slate-200">{formatNumber(r.inflow)} m³</span>,
    },
    {
      key: 'outflow',
      title: '出水量',
      render: (r: TreatmentRecord) => <span className="text-slate-200">{formatNumber(r.outflow)} m³</span>,
    },
    {
      key: 'processingRate',
      title: '处理率',
      render: (r: TreatmentRecord) => (
        <span className="text-success-400 font-medium">{formatNumber(r.processingRate)}%</span>
      ),
    },
    {
      key: 'cod',
      title: 'COD (mg/L)',
      render: (r: TreatmentRecord) => (
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
      render: (r: TreatmentRecord) => (
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
      render: (r: TreatmentRecord) => (
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
      render: (r: TreatmentRecord) => (
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
    {
      key: 'actions',
      title: '操作',
      render: (r: TreatmentRecord) => (
        <button
          onClick={() => handleEditRecord(r)}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-primary-400 transition-colors"
        >
          <Edit className="w-4 h-4" />
        </button>
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
          color="primary"
        />
        <StatCard
          title="正常运行"
          value={stats.normal}
          icon={<CheckCircle className="w-6 h-6" />}
          color="success"
        />
        <StatCard
          title="预警数量"
          value={stats.warning}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="warning"
        />
        <StatCard
          title="超标数量"
          value={stats.exceeded}
          icon={<XCircle className="w-6 h-6" />}
          color="danger"
        />
      </div>

      <TabNavigation tabs={tabs} activeTab={activeTab} onChange={(key) => {
        if (activeTab === 'treatment' && treatmentScrollRef.current) {
          treatmentScrollPosition.current = treatmentScrollRef.current.scrollTop;
        }
        setActiveTab(key);
        if (key !== 'treatment') {
          setPage(1);
        }
        if (key === 'treatment') {
          setTimeout(() => {
            if (treatmentScrollRef.current) {
              treatmentScrollRef.current.scrollTop = treatmentScrollPosition.current;
            }
          }, 0);
        }
      }} />

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
                    onClick={() => handleAlertClick(alert)}
                    className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                      alert.handled
                        ? 'bg-slate-800/30 border-slate-700/30 opacity-60'
                        : alert.status === 'exceeded'
                          ? 'bg-danger-500/10 border-danger-500/30 hover:bg-danger-500/20'
                          : 'bg-warning-500/10 border-warning-500/30 hover:bg-warning-500/20'
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
                        {alert.handled && (
                          <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">
                            已处理
                          </span>
                        )}
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
        <div ref={treatmentScrollRef} className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-200">处理记录管理</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-success-600 hover:bg-success-500 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                导出CSV
              </button>
              <button
                onClick={handleAddRecord}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                新增记录
              </button>
            </div>
          </div>

          <div className="industrial-card p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  开始日期
                </label>
                <input
                  type="date"
                  value={treatmentStartDate}
                  onChange={(e) => { setTreatmentStartDate(e.target.value); setTreatmentPage(1); }}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  结束日期
                </label>
                <input
                  type="date"
                  value={treatmentEndDate}
                  onChange={(e) => { setTreatmentEndDate(e.target.value); setTreatmentPage(1); }}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>
              <button
                onClick={() => { setTreatmentStartDate(''); setTreatmentEndDate(''); setTreatmentPage(1); }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
              >
                重置筛选
              </button>
              <div className="text-sm text-slate-400">
                共 <span className="text-primary-400 font-medium">{filteredTreatmentRecords.length}</span> 条记录
              </div>
            </div>
          </div>

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
        </div>
      )}

      {activeTab !== 'treatment' && (
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
      )}

      {activeTab === 'treatment' ? (
        <DataTable
          columns={treatmentColumns}
          data={paginatedTreatmentRecords}
          pagination={{
            current: treatmentPage,
            pageSize: 10,
            total: filteredTreatmentRecords.length,
            onChange: setTreatmentPage,
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

      <Modal
        isOpen={alertModalOpen}
        onClose={() => { setAlertModalOpen(false); setSelectedAlert(null); setAlertFormData(initialAlertFormData); }}
        title="告警详情"
        width="max-w-3xl"
        footer={
          selectedAlert && !selectedAlert.handled ? (
            <>
              <button
                onClick={() => { setAlertModalOpen(false); setSelectedAlert(null); setAlertFormData(initialAlertFormData); }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                取消
              </button>
              <button
                onClick={handleMarkHandled}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                保存处理
              </button>
            </>
          ) : null
        }
      >
        {selectedAlert && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-sm text-slate-500 mb-1">监测点位</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-400" />
                  <span className="text-lg font-medium text-slate-200">{selectedAlert.location}</span>
                </div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-sm text-slate-500 mb-1">监测指标</p>
                <div className="flex items-center gap-2">
                  {getMonitorTypeIcon(selectedAlert.type)}
                  <span className="text-lg font-medium text-slate-200">
                    {selectedAlert.type === 'dust' ? '扬尘' :
                     selectedAlert.type === 'noise' ? '噪声' :
                     selectedAlert.type === 'water' ? '水质' : '空气质量'}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-sm text-slate-500 mb-1">当前值</p>
                <p className={`text-2xl font-bold ${
                  selectedAlert.status === 'exceeded' ? 'text-danger-400' :
                  selectedAlert.status === 'warning' ? 'text-warning-400' : 'text-success-400'
                }`}>
                  {formatNumber(selectedAlert.value)} {selectedAlert.unit}
                </p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-sm text-slate-500 mb-1">阈值</p>
                <p className="text-2xl font-bold text-slate-200">
                  {selectedAlert.threshold} {selectedAlert.unit}
                </p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-sm text-slate-500 mb-1">告警时间</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-lg font-medium text-slate-200">
                    {formatDate(selectedAlert.monitorTime)}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-sm text-slate-500 mb-1">当前状态</p>
                <StatusBadge status={selectedAlert.status} />
                {selectedAlert.handled && (
                  <p className="text-xs text-success-400 mt-2">
                    已由 {selectedAlert.handledBy} 于 {formatDate(selectedAlert.handledAt || '')} 处理
                  </p>
                )}
                {selectedAlert.handleResult && (
                  <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${
                    selectedAlert.handleResult === 'handled' ? 'bg-success-500/20 text-success-400' :
                    selectedAlert.handleResult === 'followup' ? 'bg-warning-500/20 text-warning-400' :
                    'bg-slate-600/50 text-slate-400'
                  }`}>
                    {selectedAlert.handleResult === 'handled' ? '已处置' :
                     selectedAlert.handleResult === 'followup' ? '需跟进' : '误报'}
                  </span>
                )}
              </div>
            </div>

            {!selectedAlert.handled && (
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 space-y-4">
                <h4 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-primary-400" />
                  告警处理
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      责任人 <span className="text-danger-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={alertFormData.handledBy}
                      onChange={(e) => handleAlertFormChange('handledBy', e.target.value)}
                      placeholder="请输入责任人姓名"
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">处理结果</label>
                    <select
                      value={alertFormData.handleResult}
                      onChange={(e) => handleAlertFormChange('handleResult', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
                    >
                      {handleResultOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">处理说明</label>
                  <textarea
                    value={alertFormData.handleNote}
                    onChange={(e) => handleAlertFormChange('handleNote', e.target.value)}
                    placeholder="请输入处理说明（选填）"
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>
              </div>
            )}

            {selectedAlert.handled && selectedAlert.handledNote && (
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <h4 className="text-sm font-medium text-slate-400 mb-2">处理说明</h4>
                <p className="text-slate-200">{selectedAlert.handledNote}</p>
              </div>
            )}

            <div>
              <h4 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-400" />
                时间线
              </h4>
              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-700" />
                {(() => {
                  const timeline = selectedAlert.timeline && selectedAlert.timeline.length > 0
                    ? selectedAlert.timeline
                    : [{
                        time: selectedAlert.monitorTime,
                        action: '告警创建',
                        operator: '系统',
                        note: `${selectedAlert.type === 'dust' ? '扬尘' : selectedAlert.type === 'noise' ? '噪声' : selectedAlert.type === 'water' ? '水质' : '空气质量'}${selectedAlert.status === 'exceeded' ? '超标' : '预警'}`,
                      }];
                  return timeline.map((item, index) => (
                    <div key={index} className="relative pb-6 last:pb-0">
                      <div className={`absolute -left-4 w-4 h-4 rounded-full border-2 ${
                        item.action === '告警创建'
                          ? 'bg-danger-500 border-danger-400'
                          : 'bg-success-500 border-success-400'
                      }`} />
                      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 ml-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              item.action === '告警创建'
                                ? 'bg-danger-500/20 text-danger-400'
                                : 'bg-success-500/20 text-success-400'
                            }`}>
                              {item.action}
                            </span>
                            <span className="text-sm text-slate-300">操作人：{item.operator}</span>
                          </div>
                          <span className="text-xs text-slate-500">{formatDate(item.time)}</span>
                        </div>
                        {item.note && (
                          <p className="text-sm text-slate-400">{item.note}</p>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-slate-200 mb-3">最近10次数据</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-sm text-slate-400">序号</th>
                      <th className="text-left py-2 px-3 text-sm text-slate-400">监测时间</th>
                      <th className="text-right py-2 px-3 text-sm text-slate-400">监测值</th>
                      <th className="text-right py-2 px-3 text-sm text-slate-400">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDataForAlert.map((data, index) => (
                      <tr key={data.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-sm text-slate-500">{index + 1}</td>
                        <td className="py-2 px-3 text-sm text-slate-300">{formatDate(data.monitorTime)}</td>
                        <td className={`py-2 px-3 text-sm text-right font-medium ${
                          data.status === 'exceeded' ? 'text-danger-400' :
                          data.status === 'warning' ? 'text-warning-400' : 'text-success-400'
                        }`}>
                          {formatNumber(data.value)} {data.unit}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <StatusBadge status={data.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={treatmentModalOpen}
        onClose={() => { setTreatmentModalOpen(false); setEditingRecord(null); }}
        title={editingRecord ? '编辑处理记录' : '新增处理记录'}
        width="max-w-4xl"
        footer={
          <>
            <button
              onClick={() => { setTreatmentModalOpen(false); setEditingRecord(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              取消
            </button>
            <button
              onClick={handleSaveTreatment}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              保存
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">处理日期</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">操作人员</label>
              <input
                type="text"
                value={formData.operator}
                onChange={(e) => handleFormChange('operator', e.target.value)}
                placeholder="请输入操作人员姓名"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">进水量 (m³)</label>
              <input
                type="number"
                step="0.1"
                value={formData.inflow}
                onChange={(e) => handleFormChange('inflow', e.target.value)}
                placeholder="请输入进水量"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">出水量 (m³)</label>
              <input
                type="number"
                step="0.1"
                value={formData.outflow}
                onChange={(e) => handleFormChange('outflow', e.target.value)}
                placeholder="请输入出水量"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">自动计算处理率</span>
              <span className="text-xl font-bold text-success-400">
                {computedFormValues.processingRate.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-200">水质指标 (mg/L)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <p className="text-sm font-medium text-slate-300 mb-3">COD</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">进水</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.codBefore}
                      onChange={(e) => handleFormChange('codBefore', e.target.value)}
                      placeholder="进水COD"
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">出水</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.codAfter}
                      onChange={(e) => handleFormChange('codAfter', e.target.value)}
                      placeholder="出水COD"
                      className={`w-full px-3 py-2 border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 text-sm ${
                        parseFloat(formData.codAfter) > 50 ? 'bg-danger-500/10 border-danger-500/50' : 'bg-slate-800/50 border-slate-700'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-slate-500">排放标准: ≤50 mg/L</p>
                </div>
              </div>

              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <p className="text-sm font-medium text-slate-300 mb-3">石油类</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">进水</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.oilBefore}
                      onChange={(e) => handleFormChange('oilBefore', e.target.value)}
                      placeholder="进水石油类"
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">出水</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.oilAfter}
                      onChange={(e) => handleFormChange('oilAfter', e.target.value)}
                      placeholder="出水石油类"
                      className={`w-full px-3 py-2 border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 text-sm ${
                        parseFloat(formData.oilAfter) > 5 ? 'bg-danger-500/10 border-danger-500/50' : 'bg-slate-800/50 border-slate-700'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-slate-500">排放标准: ≤5 mg/L</p>
                </div>
              </div>

              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <p className="text-sm font-medium text-slate-300 mb-3">SS</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">进水</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.ssBefore}
                      onChange={(e) => handleFormChange('ssBefore', e.target.value)}
                      placeholder="进水SS"
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">出水</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.ssAfter}
                      onChange={(e) => handleFormChange('ssAfter', e.target.value)}
                      placeholder="出水SS"
                      className={`w-full px-3 py-2 border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 text-sm ${
                        parseFloat(formData.ssAfter) > 30 ? 'bg-danger-500/10 border-danger-500/50' : 'bg-slate-800/50 border-slate-700'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-slate-500">排放标准: ≤30 mg/L</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            computedFormValues.status === 'normal'
              ? 'bg-success-500/10 border-success-500/30'
              : 'bg-warning-500/10 border-warning-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">达标状态</span>
              <div className="flex items-center gap-2">
                {computedFormValues.status === 'normal' ? (
                  <CheckCircle className="w-5 h-5 text-success-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-warning-400" />
                )}
                <span className={`text-lg font-bold ${
                  computedFormValues.status === 'normal' ? 'text-success-400' : 'text-warning-400'
                }`}>
                  {computedFormValues.status === 'normal' ? '达标' : '接近阈值'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
