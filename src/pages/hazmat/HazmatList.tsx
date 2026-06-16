import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Package,
  TrendingUp,
  Search,
  Plus,
  Edit2,
  FileText,
  Truck,
  MapPin,
  Calendar,
  Droplets,
  Flame,
  Battery,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { HazardousWaste, TransferOrder, TabItem } from '../../types';
import { useHazmatStore } from '../../store/useHazmatStore';
import { useShipStore } from '../../store/useShipStore';
import { StatCard } from '../../components/ui/StatCard';
import { TabNavigation } from '../../components/ui/TabNavigation';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { formatDate, getToday, formatWeight, getWasteTypeText, getStatusText } from '../../utils/format';

const tabs: TabItem[] = [
  { key: 'wastes', label: '危废管理' },
  { key: 'transfer', label: '转移联单' },
];

const wasteTypeOptions = [
  { value: 'asbestos', label: '石棉废物', icon: <Flame className="w-4 h-4" /> },
  { value: 'oil', label: '油类废物', icon: <Droplets className="w-4 h-4" /> },
  { value: 'chemical', label: '化学废物', icon: <AlertTriangle className="w-4 h-4" /> },
  { value: 'battery', label: '废电池', icon: <Battery className="w-4 h-4" /> },
  { value: 'other', label: '其他废物', icon: <Layers className="w-4 h-4" /> },
];

export const HazmatList: React.FC = () => {
  const { wastes, transferOrders, addWaste, updateWaste, addTransferOrder, updateTransferOrder, getWasteStats } = useHazmatStore();
  const { ships } = useShipStore();
  const [activeTab, setActiveTab] = useState('wastes');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingWaste, setEditingWaste] = useState<HazardousWaste | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<TransferOrder | null>(null);
  const [selectedWaste, setSelectedWaste] = useState<HazardousWaste | null>(null);
  const [wasteForm, setWasteForm] = useState({
    shipId: '',
    shipName: '',
    type: 'asbestos' as HazardousWaste['type'],
    category: '',
    quantity: '',
    unit: 't',
    disposalMethod: '',
    disposalDate: '',
    location: '',
  });
  const [transferForm, setTransferForm] = useState({
    wasteId: '',
    orderNumber: '',
    transferDate: getToday(),
    transporter: '',
    receiver: '',
    quantity: '',
    status: 'pending' as TransferOrder['status'],
  });

  const stats = useMemo(() => getWasteStats(), [getWasteStats]);

  const filteredWastes = useMemo(() => {
    return wastes.filter(waste => {
      const matchKeyword = !searchKeyword ||
        waste.shipName.includes(searchKeyword) ||
        waste.category.includes(searchKeyword) ||
        waste.location.includes(searchKeyword);
      const matchType = typeFilter === 'all' || waste.type === typeFilter;
      const matchStatus = statusFilter === 'all' || waste.status === statusFilter;
      return matchKeyword && matchType && matchStatus;
    });
  }, [wastes, searchKeyword, typeFilter, statusFilter]);

  const paginatedWastes = useMemo(() => {
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    return filteredWastes.slice(start, start + pageSize);
  }, [filteredWastes, page]);

  const filteredTransfers = useMemo(() => {
    return transferOrders.filter(order => {
      const matchKeyword = !searchKeyword ||
        order.orderNumber.includes(searchKeyword) ||
        order.transporter.includes(searchKeyword) ||
        order.receiver.includes(searchKeyword);
      const matchStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchKeyword && matchStatus;
    });
  }, [transferOrders, searchKeyword, statusFilter]);

  const paginatedTransfers = useMemo(() => {
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    return filteredTransfers.slice(start, start + pageSize);
  }, [filteredTransfers, page]);

  const wasteColumns = [
    {
      key: 'type',
      title: '废物类型',
      render: (waste: HazardousWaste) => (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            waste.type === 'asbestos' ? 'bg-danger-500/20 text-danger-400' :
            waste.type === 'oil' ? 'bg-warning-500/20 text-warning-400' :
            waste.type === 'chemical' ? 'bg-primary-500/20 text-primary-400' :
            waste.type === 'battery' ? 'bg-success-500/20 text-success-400' :
            'bg-slate-500/20 text-slate-400'
          }`}>
            {waste.type === 'asbestos' && <Flame className="w-4 h-4" />}
            {waste.type === 'oil' && <Droplets className="w-4 h-4" />}
            {waste.type === 'chemical' && <AlertTriangle className="w-4 h-4" />}
            {waste.type === 'battery' && <Battery className="w-4 h-4" />}
            {waste.type === 'other' && <Layers className="w-4 h-4" />}
          </div>
          <div>
            <p className="font-medium text-slate-200">{getWasteTypeText(waste.type)}</p>
            <p className="text-xs text-slate-500">{waste.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'shipName',
      title: '来源船舶',
      dataIndex: 'shipName' as const,
    },
    {
      key: 'quantity',
      title: '数量',
      render: (waste: HazardousWaste) => (
        <span className="text-slate-200 font-medium">{formatWeight(waste.quantity, waste.unit)}</span>
      ),
    },
    {
      key: 'location',
      title: '存放位置',
      render: (waste: HazardousWaste) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <MapPin className="w-3 h-3 text-slate-500" />
          {waste.location}
        </div>
      ),
    },
    {
      key: 'disposalDate',
      title: '处置日期',
      render: (waste: HazardousWaste) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <Calendar className="w-3 h-3 text-slate-500" />
          {waste.disposalDate ? formatDate(waste.disposalDate) : '待安排'}
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (waste: HazardousWaste) => <StatusBadge status={waste.status} />,
    },
    {
      key: 'actions',
      title: '操作',
      width: '200px',
      render: (waste: HazardousWaste) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEditWaste(waste); }}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-primary-400 transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleCreateTransfer(waste); }}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-success-400 transition-colors"
            title="创建转移联单"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const transferColumns = [
    {
      key: 'orderNumber',
      title: '联单编号',
      render: (order: TransferOrder) => (
        <div>
          <p className="font-medium text-slate-200 font-mono">{order.orderNumber}</p>
          <p className="text-xs text-slate-500">
            {wastes.find(w => w.id === order.wasteId)?.category || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'shipName',
      title: '来源船舶',
      render: (order: TransferOrder) => {
        const waste = wastes.find(w => w.id === order.wasteId);
        return <span className="text-slate-300">{waste?.shipName || '-'}</span>;
      },
    },
    {
      key: 'quantity',
      title: '转移数量',
      render: (order: TransferOrder) => {
        const waste = wastes.find(w => w.id === order.wasteId);
        return (
          <span className="text-slate-200 font-medium">
            {formatWeight(order.quantity, waste?.unit || 't')}
          </span>
        );
      },
    },
    {
      key: 'transporter',
      title: '运输单位',
      render: (order: TransferOrder) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <Truck className="w-3 h-3 text-slate-500" />
          {order.transporter || '-'}
        </div>
      ),
    },
    {
      key: 'receiver',
      title: '接收单位',
      render: (order: TransferOrder) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <Package className="w-3 h-3 text-slate-500" />
          {order.receiver || '-'}
        </div>
      ),
    },
    {
      key: 'transferDate',
      title: '转移日期',
      render: (order: TransferOrder) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <Calendar className="w-3 h-3 text-slate-500" />
          {order.transferDate ? formatDate(order.transferDate) : '待安排'}
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (order: TransferOrder) => <StatusBadge status={order.status} />,
    },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      render: (order: TransferOrder) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEditTransfer(order); }}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-primary-400 transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleEditWaste = (waste: HazardousWaste) => {
    setEditingWaste(waste);
    setWasteForm({
      shipId: waste.shipId,
      shipName: waste.shipName,
      type: waste.type,
      category: waste.category,
      quantity: String(waste.quantity),
      unit: waste.unit,
      disposalMethod: waste.disposalMethod,
      disposalDate: waste.disposalDate,
      location: waste.location,
    });
    setIsWasteModalOpen(true);
  };

  const handleCreateTransfer = (waste: HazardousWaste) => {
    setSelectedWaste(waste);
    setTransferForm({
      wasteId: waste.id,
      orderNumber: `WF${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Date.now()).slice(-4)}`,
      transferDate: getToday(),
      transporter: '',
      receiver: '',
      quantity: String(waste.quantity),
      status: 'pending',
    });
    setIsTransferModalOpen(true);
  };

  const handleEditTransfer = (order: TransferOrder) => {
    setEditingTransfer(order);
    setTransferForm({
      wasteId: order.wasteId,
      orderNumber: order.orderNumber,
      transferDate: order.transferDate,
      transporter: order.transporter,
      receiver: order.receiver,
      quantity: String(order.quantity),
      status: order.status,
    });
    setIsTransferModalOpen(true);
  };

  const handleWasteSubmit = () => {
    if (!wasteForm.shipId || !wasteForm.category || !wasteForm.quantity) {
      alert('请填写必要信息');
      return;
    }

    const wasteData = {
      ...wasteForm,
      quantity: Number(wasteForm.quantity),
      status: 'stored' as const,
    };

    if (editingWaste) {
      updateWaste(editingWaste.id, wasteData);
    } else {
      addWaste(wasteData);
    }
    setIsWasteModalOpen(false);
    resetWasteForm();
  };

  const handleTransferSubmit = () => {
    if (!transferForm.wasteId || !transferForm.orderNumber) {
      alert('请填写必要信息');
      return;
    }

    const transferData = {
      ...transferForm,
      quantity: Number(transferForm.quantity),
    };

    if (editingTransfer) {
      updateTransferOrder(editingTransfer.id, transferData);
    } else {
      addTransferOrder(transferData);
    }
    setIsTransferModalOpen(false);
    resetTransferForm();
  };

  const handleShipSelect = (shipId: string) => {
    const ship = ships.find(s => s.id === shipId);
    setWasteForm(prev => ({
      ...prev,
      shipId,
      shipName: ship?.name || '',
    }));
  };

  const resetWasteForm = () => {
    setWasteForm({
      shipId: '',
      shipName: '',
      type: 'asbestos',
      category: '',
      quantity: '',
      unit: 't',
      disposalMethod: '',
      disposalDate: '',
      location: '',
    });
    setEditingWaste(null);
  };

  const resetTransferForm = () => {
    setTransferForm({
      wasteId: '',
      orderNumber: '',
      transferDate: getToday(),
      transporter: '',
      receiver: '',
      quantity: '',
      status: 'pending',
    });
    setEditingTransfer(null);
    setSelectedWaste(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'asbestos': return <Flame className="w-6 h-6" />;
      case 'oil': return <Droplets className="w-6 h-6" />;
      case 'chemical': return <AlertTriangle className="w-6 h-6" />;
      case 'battery': return <Battery className="w-6 h-6" />;
      default: return <Layers className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 font-display">危废处置管理</h1>
          <p className="text-slate-400 mt-1">管理石棉、油污等危险废物的识别、贮存和转移</p>
        </div>
        <button
          onClick={() => setIsWasteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          登记危废
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总危废量"
          value={`${stats.total.toFixed(1)} t`}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="danger"
        />
        <StatCard
          title="已贮存"
          value={`${(stats.byStatus.stored || 0).toFixed(1)} t`}
          icon={<Package className="w-6 h-6" />}
          color="warning"
        />
        <StatCard
          title="处理中"
          value={`${(stats.byStatus.processing || 0).toFixed(1)} t`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="primary"
        />
        <StatCard
          title="已完成"
          value={`${(stats.byStatus.completed || 0).toFixed(1)} t`}
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="success"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {wasteTypeOptions.map(type => (
          <div key={type.value} className="industrial-card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                type.value === 'asbestos' ? 'bg-danger-500/20 text-danger-400' :
                type.value === 'oil' ? 'bg-warning-500/20 text-warning-400' :
                type.value === 'chemical' ? 'bg-primary-500/20 text-primary-400' :
                type.value === 'battery' ? 'bg-success-500/20 text-success-400' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {type.icon}
              </div>
              <div>
                <p className="text-xs text-slate-400">{type.label}</p>
                <p className="text-lg font-bold text-slate-200">
                  {(stats.byType[type.value] || 0).toFixed(1)}
                  <span className="text-sm font-normal text-slate-500"> t</span>
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
            placeholder={activeTab === 'wastes' ? '搜索船舶名称、废物类别、存放位置...' : '搜索联单编号、运输单位、接收单位...'}
            value={searchKeyword}
            onChange={(e) => { setSearchKeyword(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        {activeTab === 'wastes' && (
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
          >
            <option value="all">全部类型</option>
            {wasteTypeOptions.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        )}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
        >
          <option value="all">全部状态</option>
          {activeTab === 'wastes' ? (
            <>
              <option value="stored">已贮存</option>
              <option value="processing">处理中</option>
              <option value="transferred">已转移</option>
              <option value="completed">已完成</option>
            </>
          ) : (
            <>
              <option value="pending">待审批</option>
              <option value="approved">已批准</option>
              <option value="transferred">已转移</option>
              <option value="received">已接收</option>
            </>
          )}
        </select>
      </div>

      {activeTab === 'wastes' && (
        <DataTable
          columns={wasteColumns}
          data={paginatedWastes}
          pagination={{
            current: page,
            pageSize: 10,
            total: filteredWastes.length,
            onChange: setPage,
          }}
        />
      )}

      {activeTab === 'transfer' && (
        <DataTable
          columns={transferColumns}
          data={paginatedTransfers}
          pagination={{
            current: page,
            pageSize: 10,
            total: filteredTransfers.length,
            onChange: setPage,
          }}
        />
      )}

      <Modal
        isOpen={isWasteModalOpen}
        onClose={() => { setIsWasteModalOpen(false); resetWasteForm(); }}
        title={editingWaste ? '编辑危废信息' : '登记危废'}
        width="max-w-3xl"
        footer={
          <>
            <button
              onClick={() => { setIsWasteModalOpen(false); resetWasteForm(); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleWasteSubmit}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
            >
              {editingWaste ? '保存' : '登记'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">选择船舶 *</label>
            <select
              value={wasteForm.shipId}
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
            <label className="block text-sm font-medium text-slate-300 mb-1">废物类型 *</label>
            <div className="grid grid-cols-5 gap-2">
              {wasteTypeOptions.map(type => (
                <button
                  key={type.value}
                  onClick={() => setWasteForm(prev => ({ ...prev, type: type.value as HazardousWaste['type'] }))}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                    wasteForm.type === type.value
                      ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {type.icon}
                  <span className="text-xs">{type.label.replace('废物', '')}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">废物类别 *</label>
            <input
              type="text"
              value={wasteForm.category}
              onChange={(e) => setWasteForm(prev => ({ ...prev, category: e.target.value }))}
              placeholder="如：石棉保温材料、舱底油泥"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">数量 *</label>
              <input
                type="number"
                step="0.01"
                value={wasteForm.quantity}
                onChange={(e) => setWasteForm(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="数量"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">单位</label>
              <select
                value={wasteForm.unit}
                onChange={(e) => setWasteForm(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
              >
                <option value="t">吨 (t)</option>
                <option value="kg">千克 (kg)</option>
                <option value="个">个</option>
                <option value="m3">立方米 (m³)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">存放位置</label>
            <input
              type="text"
              value={wasteForm.location}
              onChange={(e) => setWasteForm(prev => ({ ...prev, location: e.target.value }))}
              placeholder="如：危废暂存库A区"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">计划处置日期</label>
            <input
              type="date"
              value={wasteForm.disposalDate}
              onChange={(e) => setWasteForm(prev => ({ ...prev, disposalDate: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">处置方式</label>
            <textarea
              value={wasteForm.disposalMethod}
              onChange={(e) => setWasteForm(prev => ({ ...prev, disposalMethod: e.target.value }))}
              placeholder="请描述处置方式..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => { setIsTransferModalOpen(false); resetTransferForm(); }}
        title={editingTransfer ? '编辑转移联单' : '创建转移联单'}
        width="max-w-3xl"
        footer={
          <>
            <button
              onClick={() => { setIsTransferModalOpen(false); resetTransferForm(); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleTransferSubmit}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
            >
              {editingTransfer ? '保存' : '创建'}
            </button>
          </>
        }
      >
        {selectedWaste && !editingTransfer && (
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h5 className="font-medium text-slate-200 mb-2">转移废物信息</h5>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500">废物类型</p>
                <p className="text-slate-200">{getWasteTypeText(selectedWaste.type)}</p>
              </div>
              <div>
                <p className="text-slate-500">类别</p>
                <p className="text-slate-200">{selectedWaste.category}</p>
              </div>
              <div>
                <p className="text-slate-500">数量</p>
                <p className="text-slate-200">{formatWeight(selectedWaste.quantity, selectedWaste.unit)}</p>
              </div>
              <div>
                <p className="text-slate-500">来源船舶</p>
                <p className="text-slate-200">{selectedWaste.shipName}</p>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">联单编号 *</label>
            <input
              type="text"
              value={transferForm.orderNumber}
              onChange={(e) => setTransferForm(prev => ({ ...prev, orderNumber: e.target.value }))}
              placeholder="如：WF202603001"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">转移数量</label>
            <input
              type="number"
              step="0.01"
              value={transferForm.quantity}
              onChange={(e) => setTransferForm(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="转移数量"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">运输单位</label>
            <input
              type="text"
              value={transferForm.transporter}
              onChange={(e) => setTransferForm(prev => ({ ...prev, transporter: e.target.value }))}
              placeholder="运输单位名称"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">接收单位</label>
            <input
              type="text"
              value={transferForm.receiver}
              onChange={(e) => setTransferForm(prev => ({ ...prev, receiver: e.target.value }))}
              placeholder="接收单位名称"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">转移日期</label>
            <input
              type="date"
              value={transferForm.transferDate}
              onChange={(e) => setTransferForm(prev => ({ ...prev, transferDate: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">状态</label>
            <select
              value={transferForm.status}
              onChange={(e) => setTransferForm(prev => ({ ...prev, status: e.target.value as TransferOrder['status'] }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            >
              <option value="pending">待审批</option>
              <option value="approved">已批准</option>
              <option value="transferred">已转移</option>
              <option value="received">已接收</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
