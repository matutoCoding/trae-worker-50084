import React, { useState, useMemo } from 'react';
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Plus,
  Edit2,
  Flame,
  Box,
  Mountain,
  Wind,
  Droplets,
  Activity,
  User,
  MapPin,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { SafetyPermit, GasDetection, TabItem } from '../../types';
import { useSafetyStore } from '../../store/useSafetyStore';
import { useShipStore } from '../../store/useShipStore';
import { StatCard } from '../../components/ui/StatCard';
import { TabNavigation } from '../../components/ui/TabNavigation';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { getPermitTypeText } from '../../utils/format';
import { formatDate, formatDateTime, getToday, getNow } from '../../utils/date';

const tabs: TabItem[] = [
  { key: 'permits', label: '作业许可' },
  { key: 'gasDetection', label: '气体检测' },
];

const permitTypeOptions = [
  { value: 'hot_work', label: '动火作业', icon: <Flame className="w-4 h-4" /> },
  { value: 'confined_space', label: '有限空间', icon: <Box className="w-4 h-4" /> },
  { value: 'high_altitude', label: '高处作业', icon: <Mountain className="w-4 h-4" /> },
  { value: 'cabin_test', label: '舱室检测', icon: <Wind className="w-4 h-4" /> },
];

const defaultSafetyMeasures = [
  '清理作业区域易燃物',
  '配备消防设备',
  '安排专人监护',
  '作业前气体检测',
  '佩戴个人防护装备',
  '设置警戒区域',
  '办理作业审批',
  '应急救援准备',
];

export const SafetyList: React.FC = () => {
  const { permits, addPermit, updatePermit, approvePermit, rejectPermit, getPermitStats } = useSafetyStore();
  const { ships } = useShipStore();
  const [activeTab, setActiveTab] = useState('permits');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isPermitModalOpen, setIsPermitModalOpen] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [editingPermit, setEditingPermit] = useState<SafetyPermit | null>(null);
  const [selectedPermit, setSelectedPermit] = useState<SafetyPermit | null>(null);
  const [permitForm, setPermitForm] = useState({
    shipId: '',
    shipName: '',
    type: 'hot_work' as SafetyPermit['type'],
    applicant: '',
    applicationDate: getNow(),
    location: '',
    workContent: '',
    hazardAssessment: '',
    safetyMeasures: [] as string[],
    approver: '',
    validFrom: getToday(),
    validTo: getToday(),
    status: 'draft' as SafetyPermit['status'],
  });
  const [gasForm, setGasForm] = useState({
    oxygen: 21,
    flammable: 0,
    toxic: 0,
    hydrogenSulfide: 0,
    carbonMonoxide: 0,
    detector: '',
  });

  const stats = useMemo(() => {
    const baseStats = getPermitStats();
    const inProgress = permits.filter(p => p.status === 'approved').length;
    const completed = permits.filter(p => p.status === 'completed').length;
    return {
      ...baseStats,
      inProgress,
      completed,
    };
  }, [permits, getPermitStats]);

  const filteredPermits = useMemo(() => {
    return permits.filter(permit => {
      const matchKeyword = !searchKeyword ||
        permit.shipName.includes(searchKeyword) ||
        permit.applicant.includes(searchKeyword) ||
        permit.location.includes(searchKeyword) ||
        permit.workContent.includes(searchKeyword);
      const matchType = typeFilter === 'all' || permit.type === typeFilter;
      const matchStatus = statusFilter === 'all' || permit.status === statusFilter;
      return matchKeyword && matchType && matchStatus;
    });
  }, [permits, searchKeyword, typeFilter, statusFilter]);

  const paginatedPermits = useMemo(() => {
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    return filteredPermits.slice(start, start + pageSize);
  }, [filteredPermits, page]);

  const gasDetectionRecords = useMemo(() => {
    return permits
      .filter(p => p.gasDetection)
      .map(p => ({
        ...p.gasDetection!,
        permitId: p.id,
        permit: p,
      }));
  }, [permits]);

  const filteredGasRecords = useMemo(() => {
    return gasDetectionRecords.filter(record => {
      const matchKeyword = !searchKeyword ||
        record.permit.shipName.includes(searchKeyword) ||
        record.permit.location.includes(searchKeyword) ||
        record.detector.includes(searchKeyword);
      return matchKeyword;
    });
  }, [gasDetectionRecords, searchKeyword]);

  const paginatedGasRecords = useMemo(() => {
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    return filteredGasRecords.slice(start, start + pageSize);
  }, [filteredGasRecords, page]);

  const getPermitTypeIcon = (type: string) => {
    switch (type) {
      case 'hot_work': return <Flame className="w-4 h-4" />;
      case 'confined_space': return <Box className="w-4 h-4" />;
      case 'high_altitude': return <Mountain className="w-4 h-4" />;
      case 'cabin_test': return <Wind className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getPermitTypeColor = (type: string) => {
    switch (type) {
      case 'hot_work': return 'bg-danger-500/20 text-danger-400';
      case 'confined_space': return 'bg-warning-500/20 text-warning-400';
      case 'high_altitude': return 'bg-primary-500/20 text-primary-400';
      case 'cabin_test': return 'bg-success-500/20 text-success-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getGasStatus = (value: number, threshold: { safe: number; warning: number }) => {
    if (value <= threshold.safe) return { status: 'normal', color: 'text-success-400', bg: 'bg-success-500/20' };
    if (value <= threshold.warning) return { status: 'warning', color: 'text-warning-400', bg: 'bg-warning-500/20' };
    return { status: 'danger', color: 'text-danger-400', bg: 'bg-danger-500/20' };
  };

  const getGasThresholds = () => ({
    oxygen: { safe: 20, warning: 23 },
    flammable: { safe: 1, warning: 5 },
    toxic: { safe: 5, warning: 10 },
    hydrogenSulfide: { safe: 5, warning: 10 },
    carbonMonoxide: { safe: 20, warning: 50 },
  });

  const thresholds = getGasThresholds();

  const permitColumns = [
    {
      key: 'type',
      title: '作业类型',
      render: (permit: SafetyPermit) => (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getPermitTypeColor(permit.type)}`}>
            {getPermitTypeIcon(permit.type)}
          </div>
          <div>
            <p className="font-medium text-slate-200">{getPermitTypeText(permit.type)}</p>
            <p className="text-xs text-slate-500">{permit.shipName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'applicant',
      title: '申请人',
      render: (permit: SafetyPermit) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <User className="w-3 h-3 text-slate-500" />
          {permit.applicant}
        </div>
      ),
    },
    {
      key: 'location',
      title: '作业地点',
      render: (permit: SafetyPermit) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <MapPin className="w-3 h-3 text-slate-500" />
          {permit.location}
        </div>
      ),
    },
    {
      key: 'validPeriod',
      title: '有效期',
      render: (permit: SafetyPermit) => (
        <div className="text-sm">
          <p className="text-slate-300">{formatDate(permit.validFrom)}</p>
          <p className="text-slate-500">至 {formatDate(permit.validTo)}</p>
        </div>
      ),
    },
    {
      key: 'approver',
      title: '审批人',
      render: (permit: SafetyPermit) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <UserCheck className="w-3 h-3 text-slate-500" />
          {permit.approver || '待审批'}
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (permit: SafetyPermit) => <StatusBadge status={permit.status} />,
    },
    {
      key: 'actions',
      title: '操作',
      width: '240px',
      render: (permit: SafetyPermit) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEditPermit(permit); }}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-primary-400 transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {permit.status === 'pending' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleApprove(permit.id); }}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-success-400 transition-colors"
                title="批准"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleReject(permit.id); }}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-danger-400 transition-colors"
                title="驳回"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {permit.type === 'confined_space' || permit.type === 'cabin_test' ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleGasDetection(permit); }}
              className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-primary-400 transition-colors"
              title="气体检测"
            >
              <Activity className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  const gasColumns = [
    {
      key: 'permit',
      title: '作业信息',
      render: (record: GasDetection & { permitId: string; permit: SafetyPermit }) => (
        <div>
          <p className="font-medium text-slate-200">{record.permit.shipName}</p>
          <p className="text-xs text-slate-500">{getPermitTypeText(record.permit.type)} · {record.permit.location}</p>
        </div>
      ),
    },
    {
      key: 'oxygen',
      title: '氧气 (%)',
      render: (record: GasDetection) => {
        const status = getGasStatus(record.oxygen, thresholds.oxygen);
        return (
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${status.bg} ${status.color}`}>
            {record.oxygen}
          </div>
        );
      },
    },
    {
      key: 'flammable',
      title: '可燃气体 (%)',
      render: (record: GasDetection) => {
        const status = getGasStatus(record.flammable, thresholds.flammable);
        return (
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${status.bg} ${status.color}`}>
            {record.flammable}
          </div>
        );
      },
    },
    {
      key: 'toxic',
      title: '有毒气体 (ppm)',
      render: (record: GasDetection) => {
        const status = getGasStatus(record.toxic, thresholds.toxic);
        return (
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${status.bg} ${status.color}`}>
            {record.toxic}
          </div>
        );
      },
    },
    {
      key: 'hydrogenSulfide',
      title: '硫化氢 (ppm)',
      render: (record: GasDetection) => {
        const status = getGasStatus(record.hydrogenSulfide, thresholds.hydrogenSulfide);
        return (
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${status.bg} ${status.color}`}>
            {record.hydrogenSulfide}
          </div>
        );
      },
    },
    {
      key: 'carbonMonoxide',
      title: '一氧化碳 (ppm)',
      render: (record: GasDetection) => {
        const status = getGasStatus(record.carbonMonoxide, thresholds.carbonMonoxide);
        return (
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${status.bg} ${status.color}`}>
            {record.carbonMonoxide}
          </div>
        );
      },
    },
    {
      key: 'detectionTime',
      title: '检测时间',
      render: (record: GasDetection) => (
        <div className="text-sm text-slate-300">
          {formatDateTime(record.detectionTime)}
        </div>
      ),
    },
    {
      key: 'detector',
      title: '检测人',
      render: (record: GasDetection) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <User className="w-3 h-3 text-slate-500" />
          {record.detector}
        </div>
      ),
    },
  ];

  const handleEditPermit = (permit: SafetyPermit) => {
    setEditingPermit(permit);
    setPermitForm({
      shipId: permit.shipId,
      shipName: permit.shipName,
      type: permit.type,
      applicant: permit.applicant,
      applicationDate: permit.applicationDate,
      location: permit.location,
      workContent: permit.workContent,
      hazardAssessment: permit.hazardAssessment,
      safetyMeasures: [...permit.safetyMeasures],
      approver: permit.approver || '',
      validFrom: permit.validFrom.split(' ')[0],
      validTo: permit.validTo.split(' ')[0],
      status: permit.status,
    });
    setIsPermitModalOpen(true);
  };

  const handleGasDetection = (permit: SafetyPermit) => {
    setSelectedPermit(permit);
    if (permit.gasDetection) {
      setGasForm({
        oxygen: permit.gasDetection.oxygen,
        flammable: permit.gasDetection.flammable,
        toxic: permit.gasDetection.toxic,
        hydrogenSulfide: permit.gasDetection.hydrogenSulfide,
        carbonMonoxide: permit.gasDetection.carbonMonoxide,
        detector: permit.gasDetection.detector,
      });
    } else {
      setGasForm({
        oxygen: 21,
        flammable: 0,
        toxic: 0,
        hydrogenSulfide: 0,
        carbonMonoxide: 0,
        detector: '',
      });
    }
    setIsGasModalOpen(true);
  };

  const handleApprove = (id: string) => {
    if (confirm('确定要批准这个作业许可吗？')) {
      approvePermit(id, '当前用户');
    }
  };

  const handleReject = (id: string) => {
    if (confirm('确定要驳回这个作业许可吗？')) {
      rejectPermit(id, '当前用户');
    }
  };

  const handlePermitSubmit = () => {
    if (!permitForm.shipId || !permitForm.applicant || !permitForm.location || !permitForm.workContent) {
      alert('请填写必要信息');
      return;
    }

    const permitData = {
      ...permitForm,
      applicationDate: getNow(),
      validFrom: `${permitForm.validFrom} 08:00:00`,
      validTo: `${permitForm.validTo} 18:00:00`,
    };

    if (editingPermit) {
      updatePermit(editingPermit.id, permitData);
    } else {
      addPermit(permitData);
    }
    setIsPermitModalOpen(false);
    resetPermitForm();
  };

  const handleGasSubmit = () => {
    if (!selectedPermit || !gasForm.detector) {
      alert('请填写检测人信息');
      return;
    }

    const gasDetection: GasDetection = {
      ...gasForm,
      detectionTime: getNow(),
    };

    updatePermit(selectedPermit.id, { gasDetection });
    setIsGasModalOpen(false);
    resetGasForm();
  };

  const handleShipSelect = (shipId: string) => {
    const ship = ships.find(s => s.id === shipId);
    setPermitForm(prev => ({
      ...prev,
      shipId,
      shipName: ship?.name || '',
    }));
  };

  const handleSafetyMeasureToggle = (measure: string) => {
    setPermitForm(prev => ({
      ...prev,
      safetyMeasures: prev.safetyMeasures.includes(measure)
        ? prev.safetyMeasures.filter(m => m !== measure)
        : [...prev.safetyMeasures, measure],
    }));
  };

  const resetPermitForm = () => {
    setPermitForm({
      shipId: '',
      shipName: '',
      type: 'hot_work',
      applicant: '',
      applicationDate: getNow(),
      location: '',
      workContent: '',
      hazardAssessment: '',
      safetyMeasures: [],
      approver: '',
      validFrom: getToday(),
      validTo: getToday(),
      status: 'draft',
    });
    setEditingPermit(null);
  };

  const resetGasForm = () => {
    setGasForm({
      oxygen: 21,
      flammable: 0,
      toxic: 0,
      hydrogenSulfide: 0,
      carbonMonoxide: 0,
      detector: '',
    });
    setSelectedPermit(null);
  };

  const renderGasOverview = () => {
    const avgValues = useMemo(() => {
      if (gasDetectionRecords.length === 0) return null;
      return {
        oxygen: gasDetectionRecords.reduce((sum, r) => sum + r.oxygen, 0) / gasDetectionRecords.length,
        flammable: gasDetectionRecords.reduce((sum, r) => sum + r.flammable, 0) / gasDetectionRecords.length,
        toxic: gasDetectionRecords.reduce((sum, r) => sum + r.toxic, 0) / gasDetectionRecords.length,
        hydrogenSulfide: gasDetectionRecords.reduce((sum, r) => sum + r.hydrogenSulfide, 0) / gasDetectionRecords.length,
        carbonMonoxide: gasDetectionRecords.reduce((sum, r) => sum + r.carbonMonoxide, 0) / gasDetectionRecords.length,
      };
    }, [gasDetectionRecords]);

    if (!avgValues) return null;

    const gasItems = [
      { key: 'oxygen', label: '氧气', value: avgValues.oxygen.toFixed(1), unit: '%', icon: <Wind className="w-5 h-5" /> },
      { key: 'flammable', label: '可燃气体', value: avgValues.flammable.toFixed(1), unit: '%', icon: <Flame className="w-5 h-5" /> },
      { key: 'toxic', label: '有毒气体', value: avgValues.toxic.toFixed(1), unit: 'ppm', icon: <AlertTriangle className="w-5 h-5" /> },
      { key: 'hydrogenSulfide', label: '硫化氢', value: avgValues.hydrogenSulfide.toFixed(1), unit: 'ppm', icon: <Droplets className="w-5 h-5" /> },
      { key: 'carbonMonoxide', label: '一氧化碳', value: avgValues.carbonMonoxide.toFixed(1), unit: 'ppm', icon: <AlertCircle className="w-5 h-5" /> },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {gasItems.map(item => {
          const threshold = thresholds[item.key as keyof typeof thresholds];
          const status = getGasStatus(parseFloat(item.value), threshold);
          return (
            <div key={item.key} className="industrial-card p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status.bg} ${status.color}`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className={`text-lg font-bold font-display ${status.color}`}>
                    {item.value}
                    <span className="text-sm font-normal text-slate-500"> {item.unit}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 font-display">安全作业管理</h1>
          <p className="text-slate-400 mt-1">管理动火作业、有限空间作业等高风险作业的许可审批和气体检测</p>
        </div>
        <button
          onClick={() => setIsPermitModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增作业许可
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总许可数"
          value={stats.total}
          icon={<Shield className="w-6 h-6" />}
          gradient="from-primary-500/20 to-primary-700/20"
          color="primary"
        />
        <StatCard
          title="待审批"
          value={stats.pending}
          icon={<Clock className="w-6 h-6" />}
          gradient="from-warning-500/20 to-warning-700/20"
          color="warning"
        />
        <StatCard
          title="进行中"
          value={stats.inProgress}
          icon={<Activity className="w-6 h-6" />}
          gradient="from-success-500/20 to-success-700/20"
          color="success"
        />
        <StatCard
          title="已完成"
          value={stats.completed}
          icon={<CheckCircle2 className="w-6 h-6" />}
          gradient="from-slate-500/20 to-slate-700/20"
          color="slate"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {permitTypeOptions.map(type => (
          <div key={type.value} className="industrial-card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getPermitTypeColor(type.value)}`}>
                {type.icon}
              </div>
              <div>
                <p className="text-xs text-slate-400">{type.label}</p>
                <p className="text-lg font-bold font-display text-slate-200">
                  {stats.byType[type.value] || 0}
                  <span className="text-sm font-normal text-slate-500"> 项</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <TabNavigation tabs={tabs} activeTab={activeTab} onChange={(key) => { setActiveTab(key); setPage(1); }} />

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={activeTab === 'permits' ? '搜索船舶名称、申请人、作业地点、作业内容...' : '搜索船舶名称、作业地点、检测人...'}
            value={searchKeyword}
            onChange={(e) => { setSearchKeyword(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        {activeTab === 'permits' && (
          <>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            >
              <option value="all">全部类型</option>
              {permitTypeOptions.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            >
              <option value="all">全部状态</option>
              <option value="draft">草稿</option>
              <option value="pending">待审批</option>
              <option value="approved">已批准</option>
              <option value="rejected">已驳回</option>
              <option value="expired">已过期</option>
            </select>
          </>
        )}
      </div>

      {activeTab === 'permits' && (
        <DataTable
          columns={permitColumns}
          data={paginatedPermits}
          pagination={{
            current: page,
            pageSize: 10,
            total: filteredPermits.length,
            onChange: setPage,
          }}
        />
      )}

      {activeTab === 'gasDetection' && (
        <>
          {renderGasOverview()}
          <DataTable
            columns={gasColumns}
            data={paginatedGasRecords}
            pagination={{
              current: page,
              pageSize: 10,
              total: filteredGasRecords.length,
              onChange: setPage,
            }}
          />
        </>
      )}

      <Modal
        isOpen={isPermitModalOpen}
        onClose={() => { setIsPermitModalOpen(false); resetPermitForm(); }}
        title={editingPermit ? '编辑作业许可' : '新增作业许可'}
        width="max-w-4xl"
        footer={
          <>
            <button
              onClick={() => { setIsPermitModalOpen(false); resetPermitForm(); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handlePermitSubmit}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
            >
              {editingPermit ? '保存' : '创建'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">选择船舶 *</label>
            <select
              value={permitForm.shipId}
              onChange={(e) => handleShipSelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            >
              <option value="">请选择船舶</option>
              {ships.filter(s => s.status !== 'completed').map(ship => (
                <option key={ship.id} value={ship.id}>{ship.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">作业类型 *</label>
            <div className="grid grid-cols-4 gap-2">
              {permitTypeOptions.map(type => (
                <button
                  key={type.value}
                  onClick={() => setPermitForm(prev => ({ ...prev, type: type.value as SafetyPermit['type'] }))}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                    permitForm.type === type.value
                      ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {type.icon}
                  <span className="text-xs">{type.label.replace('作业', '').replace('有限空间', '有限空间')}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">申请人 *</label>
            <input
              type="text"
              value={permitForm.applicant}
              onChange={(e) => setPermitForm(prev => ({ ...prev, applicant: e.target.value }))}
              placeholder="申请人姓名"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">申请日期</label>
            <input
              type="datetime-local"
              value={permitForm.applicationDate.slice(0, 16)}
              onChange={(e) => setPermitForm(prev => ({ ...prev, applicationDate: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">作业地点 *</label>
            <input
              type="text"
              value={permitForm.location}
              onChange={(e) => setPermitForm(prev => ({ ...prev, location: e.target.value }))}
              placeholder="如：主甲板区域、压载水舱"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">作业内容 *</label>
            <input
              type="text"
              value={permitForm.workContent}
              onChange={(e) => setPermitForm(prev => ({ ...prev, workContent: e.target.value }))}
              placeholder="简要描述作业内容"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">有效期开始</label>
            <input
              type="date"
              value={permitForm.validFrom}
              onChange={(e) => setPermitForm(prev => ({ ...prev, validFrom: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">有效期结束</label>
            <input
              type="date"
              value={permitForm.validTo}
              onChange={(e) => setPermitForm(prev => ({ ...prev, validTo: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">风险评估</label>
            <textarea
              value={permitForm.hazardAssessment}
              onChange={(e) => setPermitForm(prev => ({ ...prev, hazardAssessment: e.target.value }))}
              placeholder="请描述作业过程中可能存在的风险..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">安全措施</label>
            <div className="grid grid-cols-2 gap-2">
              {defaultSafetyMeasures.map(measure => (
                <label
                  key={measure}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    permitForm.safetyMeasures.includes(measure)
                      ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                      : 'border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={permitForm.safetyMeasures.includes(measure)}
                    onChange={() => handleSafetyMeasureToggle(measure)}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    permitForm.safetyMeasures.includes(measure)
                      ? 'bg-primary-500 border-primary-500'
                      : 'border-slate-600'
                  }`}>
                    {permitForm.safetyMeasures.includes(measure) && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm">{measure}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">审批人</label>
            <input
              type="text"
              value={permitForm.approver}
              onChange={(e) => setPermitForm(prev => ({ ...prev, approver: e.target.value }))}
              placeholder="审批人姓名"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">状态</label>
            <select
              value={permitForm.status}
              onChange={(e) => setPermitForm(prev => ({ ...prev, status: e.target.value as SafetyPermit['status'] }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            >
              <option value="draft">草稿</option>
              <option value="pending">待审批</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isGasModalOpen}
        onClose={() => { setIsGasModalOpen(false); resetGasForm(); }}
        title="气体检测记录"
        width="max-w-3xl"
        footer={
          <>
            <button
              onClick={() => { setIsGasModalOpen(false); resetGasForm(); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleGasSubmit}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
            >
              保存
            </button>
          </>
        }
      >
        {selectedPermit && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h5 className="font-medium text-slate-200 mb-3">作业信息</h5>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">船舶名称</p>
                  <p className="text-slate-200">{selectedPermit.shipName}</p>
                </div>
                <div>
                  <p className="text-slate-500">作业类型</p>
                  <p className="text-slate-200">{getPermitTypeText(selectedPermit.type)}</p>
                </div>
                <div>
                  <p className="text-slate-500">作业地点</p>
                  <p className="text-slate-200">{selectedPermit.location}</p>
                </div>
                <div>
                  <p className="text-slate-500">申请人</p>
                  <p className="text-slate-200">{selectedPermit.applicant}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  氧气 (%)
                  <span className="text-slate-500 text-xs ml-2">安全范围: 19.5-23.5%</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={gasForm.oxygen}
                  onChange={(e) => setGasForm(prev => ({ ...prev, oxygen: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  可燃气体 (%)
                  <span className="text-slate-500 text-xs ml-2">爆炸下限: {'>'}1% 预警</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={gasForm.flammable}
                  onChange={(e) => setGasForm(prev => ({ ...prev, flammable: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  有毒气体 (ppm)
                  <span className="text-slate-500 text-xs ml-2">安全值: {'<'}5ppm</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={gasForm.toxic}
                  onChange={(e) => setGasForm(prev => ({ ...prev, toxic: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  硫化氢 (ppm)
                  <span className="text-slate-500 text-xs ml-2">安全值: {'<'}10ppm</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={gasForm.hydrogenSulfide}
                  onChange={(e) => setGasForm(prev => ({ ...prev, hydrogenSulfide: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  一氧化碳 (ppm)
                  <span className="text-slate-500 text-xs ml-2">安全值: {'<'}35ppm</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={gasForm.carbonMonoxide}
                  onChange={(e) => setGasForm(prev => ({ ...prev, carbonMonoxide: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">检测人 *</label>
                <input
                  type="text"
                  value={gasForm.detector}
                  onChange={(e) => setGasForm(prev => ({ ...prev, detector: e.target.value }))}
                  placeholder="检测人姓名"
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
