import React, { useState } from 'react';
import { Plus, Search, Filter, Ship as ShipIcon, Anchor, Weight, Calendar, Eye, Edit2, Trash2 } from 'lucide-react';
import { useShipStore } from '../../store/useShipStore';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatCard } from '../../components/ui/StatCard';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Ship } from '../../types';
import { formatDate, formatWeight } from '../../utils/format';
import { getToday } from '../../utils/date';

export const ShipList: React.FC = () => {
  const { ships, filterShips, addShip, updateShip, deleteShip } = useShipStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<Ship['status'] | ''>('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShip, setEditingShip] = useState<Ship | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    imoNumber: '',
    flag: '',
    type: '',
    grossTonnage: '',
    lightDisplacement: '',
    owner: '',
    shipyard: '鑫鑫拆船厂',
    description: '',
  });

  const pageSize = 10;
  const filteredShips = filterShips(statusFilter || undefined, searchKeyword);
  const pagedShips = filteredShips.slice((page - 1) * pageSize, page * pageSize);

  const stats = {
    total: ships.length,
    pending: ships.filter(s => s.status === 'pending').length,
    inProgress: ships.filter(s => s.status === 'in_progress').length,
    completed: ships.filter(s => s.status === 'completed').length,
  };

  const columns = [
    {
      key: 'name',
      title: '船舶名称',
      render: (ship: Ship) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <ShipIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-slate-200">{ship.name}</p>
            <p className="text-xs text-slate-500">{ship.imoNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      title: '船舶类型',
      render: (ship: Ship) => (
        <span className="text-slate-300">{ship.type}</span>
      ),
    },
    {
      key: 'flag',
      title: '船旗国',
      render: (ship: Ship) => (
        <span className="text-slate-300">{ship.flag}</span>
      ),
    },
    {
      key: 'grossTonnage',
      title: '总吨位',
      render: (ship: Ship) => (
        <span className="text-slate-300 font-medium">{formatWeight(ship.grossTonnage)}</span>
      ),
    },
    {
      key: 'lightDisplacement',
      title: '空船重量',
      render: (ship: Ship) => (
        <span className="text-slate-300 font-medium">{formatWeight(ship.lightDisplacement)}</span>
      ),
    },
    {
      key: 'arrivalDate',
      title: '到港日期',
      render: (ship: Ship) => (
        <span className="text-slate-300">{formatDate(ship.arrivalDate)}</span>
      ),
    },
    {
      key: 'owner',
      title: '船东',
      render: (ship: Ship) => (
        <span className="text-slate-300">{ship.owner}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (ship: Ship) => <StatusBadge status={ship.status} />,
    },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      render: (ship: Ship) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(ship)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-primary-400 transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(ship.id)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-danger-400 transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleOpenModal = (ship?: Ship) => {
    if (ship) {
      setEditingShip(ship);
      setFormData({
        name: ship.name,
        imoNumber: ship.imoNumber,
        flag: ship.flag,
        type: ship.type,
        grossTonnage: String(ship.grossTonnage),
        lightDisplacement: String(ship.lightDisplacement),
        owner: ship.owner,
        shipyard: ship.shipyard,
        description: ship.description || '',
      });
    } else {
      setEditingShip(null);
      setFormData({
        name: '',
        imoNumber: '',
        flag: '',
        type: '',
        grossTonnage: '',
        lightDisplacement: '',
        owner: '',
        shipyard: '鑫鑫拆船厂',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleEdit = (ship: Ship) => {
    handleOpenModal(ship);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这艘船舶的档案吗？')) {
      deleteShip(id);
    }
  };

  const handleSubmit = () => {
    const shipData = {
      name: formData.name,
      imoNumber: formData.imoNumber,
      flag: formData.flag,
      type: formData.type,
      grossTonnage: Number(formData.grossTonnage),
      lightDisplacement: Number(formData.lightDisplacement),
      arrivalDate: getToday(),
      status: 'pending' as const,
      owner: formData.owner,
      shipyard: formData.shipyard,
      description: formData.description,
    };

    if (editingShip) {
      updateShip(editingShip.id, shipData);
    } else {
      addShip(shipData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">船舶档案</h1>
          <p className="text-slate-500 mt-1">管理待拆、在拆和已拆船舶的档案信息</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          船舶登记
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="船舶总数" value={stats.total} icon={Anchor} color="primary" />
        <StatCard title="待拆解" value={stats.pending} icon={Calendar} color="warning" />
        <StatCard title="拆解中" value={stats.inProgress} icon={Weight} color="primary" />
        <StatCard title="已完成" value={stats.completed} icon={ShipIcon} color="success" />
      </div>

      <div className="industrial-card">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="搜索船名、IMO编号、船东..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as Ship['status'] | '');
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary-500/50"
            >
              <option value="">全部状态</option>
              <option value="pending">待拆解</option>
              <option value="in_progress">拆解中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>

        <DataTable<Ship>
          columns={columns}
          data={pagedShips}
          pagination={{
            current: page,
            pageSize,
            total: filteredShips.length,
            onChange: setPage,
          }}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingShip ? '编辑船舶档案' : '待拆船舶登记'}
        width="max-w-3xl"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary">
              取消
            </button>
            <button onClick={handleSubmit} className="btn-primary">
              {editingShip ? '保存修改' : '登记船舶'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">船舶名称 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="请输入船舶名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">IMO编号 *</label>
            <input
              type="text"
              value={formData.imoNumber}
              onChange={(e) => setFormData({ ...formData, imoNumber: e.target.value })}
              className="input-field"
              placeholder="如：IMO9876543"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">船旗国 *</label>
            <input
              type="text"
              value={formData.flag}
              onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
              className="input-field"
              placeholder="请输入船旗国"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">船舶类型 *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input-field"
            >
              <option value="">请选择船舶类型</option>
              <option value="散货船">散货船</option>
              <option value="集装箱船">集装箱船</option>
              <option value="油轮">油轮</option>
              <option value="杂货船">杂货船</option>
              <option value="客轮">客轮</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">总吨位 (t) *</label>
            <input
              type="number"
              value={formData.grossTonnage}
              onChange={(e) => setFormData({ ...formData, grossTonnage: e.target.value })}
              className="input-field"
              placeholder="请输入总吨位"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">空船重量 (t) *</label>
            <input
              type="number"
              value={formData.lightDisplacement}
              onChange={(e) => setFormData({ ...formData, lightDisplacement: e.target.value })}
              className="input-field"
              placeholder="请输入空船重量"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">船东 *</label>
            <input
              type="text"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              className="input-field"
              placeholder="请输入船东名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">拆船厂</label>
            <input
              type="text"
              value={formData.shipyard}
              onChange={(e) => setFormData({ ...formData, shipyard: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-1">船舶描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field h-24 resize-none"
              placeholder="请输入船舶详细描述，包括建造年份、尺寸等信息"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
