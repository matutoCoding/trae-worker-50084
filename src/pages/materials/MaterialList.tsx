import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  TrendingUp,
  Search,
  Plus,
  Edit2,
  FileText,
  Warehouse,
  DollarSign,
  Scale,
  Layers,
  ShoppingCart,
  Truck,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Material, Sale, TabItem } from '../../types';
import { useMaterialStore } from '../../store/useMaterialStore';
import { useShipStore } from '../../store/useShipStore';
import { StatCard } from '../../components/ui/StatCard';
import { TabNavigation } from '../../components/ui/TabNavigation';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { formatDate, getToday, formatWeight, formatCurrency, getMaterialCategoryText } from '../../utils/format';

const tabs: TabItem[] = [
  { key: 'inventory', label: '物料库存' },
  { key: 'sales', label: '销售管理' },
];

const categoryOptions = [
  { value: 'steel', label: '钢材', color: 'bg-primary-500/20 text-primary-400' },
  { value: 'non_ferrous', label: '有色金属', color: 'bg-success-500/20 text-success-400' },
  { value: 'other', label: '其他', color: 'bg-slate-500/20 text-slate-400' },
];

export const MaterialList: React.FC = () => {
  const { materials, sales, addMaterial, updateMaterial, addSale, updateSale, getInventoryStats, getSalesStats } = useMaterialStore();
  const { ships } = useShipStore();
  const [activeTab, setActiveTab] = useState('inventory');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [materialForm, setMaterialForm] = useState({
    shipId: '',
    shipName: '',
    category: 'steel' as Material['category'],
    type: '',
    weight: '',
    unit: 't',
    price: '',
    stockDate: getToday(),
    warehouse: '',
  });
  const [saleForm, setSaleForm] = useState({
    materialId: '',
    materialName: '',
    customer: '',
    quantity: '',
    unitPrice: '',
    totalAmount: '',
    saleDate: getToday(),
    status: 'pending' as Sale['status'],
    invoiceNumber: '',
  });

  const inventoryStats = useMemo(() => getInventoryStats(), [getInventoryStats]);
  const salesStats = useMemo(() => getSalesStats(), [getSalesStats]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      const matchKeyword = !searchKeyword ||
        material.shipName.includes(searchKeyword) ||
        material.type.includes(searchKeyword) ||
        material.warehouse.includes(searchKeyword);
      const matchCategory = categoryFilter === 'all' || material.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || material.status === statusFilter;
      return matchKeyword && matchCategory && matchStatus;
    });
  }, [materials, searchKeyword, categoryFilter, statusFilter]);

  const paginatedMaterials = useMemo(() => {
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    return filteredMaterials.slice(start, start + pageSize);
  }, [filteredMaterials, page]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchKeyword = !searchKeyword ||
        sale.materialName.includes(searchKeyword) ||
        sale.customer.includes(searchKeyword) ||
        (sale.invoiceNumber && sale.invoiceNumber.includes(searchKeyword));
      const matchStatus = statusFilter === 'all' || sale.status === statusFilter;
      return matchKeyword && matchStatus;
    });
  }, [sales, searchKeyword, statusFilter]);

  const paginatedSales = useMemo(() => {
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, page]);

  const materialColumns = [
    {
      key: 'category',
      title: '物料类别',
      render: (material: Material) => {
        const category = categoryOptions.find(c => c.value === material.category);
        return (
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${category?.color || 'bg-slate-500/20 text-slate-400'}`}>
              {material.category === 'steel' && <Layers className="w-4 h-4" />}
              {material.category === 'non_ferrous' && <Scale className="w-4 h-4" />}
              {material.category === 'other' && <Package className="w-4 h-4" />}
            </div>
            <div>
              <p className="font-medium text-slate-200">{getMaterialCategoryText(material.category)}</p>
              <p className="text-xs text-slate-500">{material.type}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'shipName',
      title: '来源船舶',
      dataIndex: 'shipName' as const,
    },
    {
      key: 'weight',
      title: '重量',
      render: (material: Material) => (
        <span className="text-slate-200 font-medium">{formatWeight(material.weight, material.unit)}</span>
      ),
    },
    {
      key: 'price',
      title: '单价',
      render: (material: Material) => (
        <span className="text-slate-200 font-medium">{formatCurrency(material.price)}/t</span>
      ),
    },
    {
      key: 'value',
      title: '预估价值',
      render: (material: Material) => (
        <span className="text-success-400 font-medium">{formatCurrency(material.weight * material.price)}</span>
      ),
    },
    {
      key: 'warehouse',
      title: '存放位置',
      render: (material: Material) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <Warehouse className="w-3 h-3 text-slate-500" />
          {material.warehouse}
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (material: Material) => <StatusBadge status={material.status} />,
    },
    {
      key: 'actions',
      title: '操作',
      width: '200px',
      render: (material: Material) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEditMaterial(material); }}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-primary-400 transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {material.status === 'in_stock' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCreateSale(material); }}
              className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-success-400 transition-colors"
              title="创建销售单"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const saleColumns = [
    {
      key: 'materialName',
      title: '物料名称',
      render: (sale: Sale) => (
        <div>
          <p className="font-medium text-slate-200">{sale.materialName}</p>
          <p className="text-xs text-slate-500">{sale.invoiceNumber || '待开票'}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      title: '客户',
      render: (sale: Sale) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <FileText className="w-3 h-3 text-slate-500" />
          {sale.customer}
        </div>
      ),
    },
    {
      key: 'quantity',
      title: '数量',
      render: (sale: Sale) => (
        <span className="text-slate-200 font-medium">{formatWeight(sale.quantity, 't')}</span>
      ),
    },
    {
      key: 'unitPrice',
      title: '单价',
      render: (sale: Sale) => (
        <span className="text-slate-200">{formatCurrency(sale.unitPrice)}/t</span>
      ),
    },
    {
      key: 'totalAmount',
      title: '总金额',
      render: (sale: Sale) => (
        <span className="text-success-400 font-medium">{formatCurrency(sale.totalAmount)}</span>
      ),
    },
    {
      key: 'saleDate',
      title: '销售日期',
      render: (sale: Sale) => (
        <div className="flex items-center gap-1 text-sm text-slate-300">
          <Clock className="w-3 h-3 text-slate-500" />
          {formatDate(sale.saleDate)}
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (sale: Sale) => <StatusBadge status={sale.status} />,
    },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      render: (sale: Sale) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEditSale(sale); }}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-primary-400 transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setMaterialForm({
      shipId: material.shipId,
      shipName: material.shipName,
      category: material.category,
      type: material.type,
      weight: String(material.weight),
      unit: material.unit,
      price: String(material.price),
      stockDate: material.stockDate,
      warehouse: material.warehouse,
    });
    setIsMaterialModalOpen(true);
  };

  const handleCreateSale = (material: Material) => {
    setSelectedMaterial(material);
    setSaleForm({
      materialId: material.id,
      materialName: material.type,
      customer: '',
      quantity: String(material.weight),
      unitPrice: String(material.price),
      totalAmount: String(material.weight * material.price),
      saleDate: getToday(),
      status: 'pending',
      invoiceNumber: '',
    });
    setIsSaleModalOpen(true);
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setSaleForm({
      materialId: sale.materialId,
      materialName: sale.materialName,
      customer: sale.customer,
      quantity: String(sale.quantity),
      unitPrice: String(sale.unitPrice),
      totalAmount: String(sale.totalAmount),
      saleDate: sale.saleDate,
      status: sale.status,
      invoiceNumber: sale.invoiceNumber || '',
    });
    setIsSaleModalOpen(true);
  };

  const handleMaterialSubmit = () => {
    if (!materialForm.shipId || !materialForm.type || !materialForm.weight || !materialForm.price) {
      alert('请填写必要信息');
      return;
    }

    const materialData = {
      ...materialForm,
      weight: Number(materialForm.weight),
      price: Number(materialForm.price),
      status: 'in_stock' as const,
    };

    if (editingMaterial) {
      updateMaterial(editingMaterial.id, materialData);
    } else {
      addMaterial(materialData);
    }
    setIsMaterialModalOpen(false);
    resetMaterialForm();
  };

  const handleSaleSubmit = () => {
    if (!saleForm.materialId || !saleForm.customer || !saleForm.quantity || !saleForm.unitPrice) {
      alert('请填写必要信息');
      return;
    }

    const saleData = {
      ...saleForm,
      quantity: Number(saleForm.quantity),
      unitPrice: Number(saleForm.unitPrice),
      totalAmount: Number(saleForm.totalAmount),
    };

    if (editingSale) {
      updateSale(editingSale.id, saleData);
    } else {
      addSale(saleData);
    }
    setIsSaleModalOpen(false);
    resetSaleForm();
  };

  const handleShipSelect = (shipId: string) => {
    const ship = ships.find(s => s.id === shipId);
    setMaterialForm(prev => ({
      ...prev,
      shipId,
      shipName: ship?.name || '',
    }));
  };

  useEffect(() => {
    const qty = parseFloat(saleForm.quantity) || 0;
    const price = parseFloat(saleForm.unitPrice) || 0;
    setSaleForm(prev => ({
      ...prev,
      totalAmount: String(qty * price),
    }));
  }, [saleForm.quantity, saleForm.unitPrice]);

  const resetMaterialForm = () => {
    setMaterialForm({
      shipId: '',
      shipName: '',
      category: 'steel',
      type: '',
      weight: '',
      unit: 't',
      price: '',
      stockDate: getToday(),
      warehouse: '',
    });
    setEditingMaterial(null);
  };

  const resetSaleForm = () => {
    setSaleForm({
      materialId: '',
      materialName: '',
      customer: '',
      quantity: '',
      unitPrice: '',
      totalAmount: '',
      saleDate: getToday(),
      status: 'pending',
      invoiceNumber: '',
    });
    setEditingSale(null);
    setSelectedMaterial(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 font-display">物料回收管理</h1>
          <p className="text-slate-400 mt-1">管理钢材、有色金属等回收物料的入库和销售</p>
        </div>
        {activeTab === 'inventory' && (
          <button
            onClick={() => setIsMaterialModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            登记入库
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="库存总量"
          value={`${(inventoryStats.totalWeight / 1000).toFixed(1)} kt`}
          icon={<Scale className="w-6 h-6" />}
          color="primary"
        />
        <StatCard
          title="库存估值"
          value={`${(inventoryStats.totalValue / 1000000).toFixed(1)} M`}
          icon={<DollarSign className="w-6 h-6" />}
          color="success"
        />
        <StatCard
          title="累计销售额"
          value={`${(salesStats.totalRevenue / 1000000).toFixed(1)} M`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="warning"
        />
        <StatCard
          title="本月销售额"
          value={`${(salesStats.thisMonthRevenue / 10000).toFixed(0)} 万`}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="slate"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categoryOptions.map(category => {
          const stats = inventoryStats.byCategory[category.value] || { weight: 0, value: 0 };
          return (
            <div key={category.value} className="industrial-card p-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${category.color}`}>
                  {category.value === 'steel' && <Layers className="w-6 h-6" />}
                  {category.value === 'non_ferrous' && <Scale className="w-6 h-6" />}
                  {category.value === 'other' && <Package className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-400">{category.label}</p>
                  <p className="text-xl font-bold text-slate-200">
                    {(stats.weight / 1000).toFixed(1)} kt
                  </p>
                  <p className="text-xs text-success-400">
                    {formatCurrency(stats.value)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <TabNavigation tabs={tabs} activeTab={activeTab} onChange={(key) => { setActiveTab(key); setPage(1); }} />

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={activeTab === 'inventory' ? '搜索船舶名称、物料类型、仓库...' : '搜索物料名称、客户、发票号...'}
            value={searchKeyword}
            onChange={(e) => { setSearchKeyword(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        {activeTab === 'inventory' && (
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
          >
            <option value="all">全部类别</option>
            {categoryOptions.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        )}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
        >
          <option value="all">全部状态</option>
          {activeTab === 'inventory' ? (
            <>
              <option value="in_stock">库存中</option>
              <option value="reserved">已预留</option>
              <option value="sold">已销售</option>
            </>
          ) : (
            <>
              <option value="pending">待确认</option>
              <option value="shipped">已出库</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </>
          )}
        </select>
      </div>

      {activeTab === 'inventory' && (
        <DataTable
          columns={materialColumns}
          data={paginatedMaterials}
          pagination={{
            current: page,
            pageSize: 10,
            total: filteredMaterials.length,
            onChange: setPage,
          }}
        />
      )}

      {activeTab === 'sales' && (
        <DataTable
          columns={saleColumns}
          data={paginatedSales}
          pagination={{
            current: page,
            pageSize: 10,
            total: filteredSales.length,
            onChange: setPage,
          }}
        />
      )}

      <Modal
        isOpen={isMaterialModalOpen}
        onClose={() => { setIsMaterialModalOpen(false); resetMaterialForm(); }}
        title={editingMaterial ? '编辑物料信息' : '登记物料入库'}
        width="max-w-3xl"
        footer={
          <>
            <button
              onClick={() => { setIsMaterialModalOpen(false); resetMaterialForm(); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleMaterialSubmit}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
            >
              {editingMaterial ? '保存' : '登记'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">选择船舶 *</label>
            <select
              value={materialForm.shipId}
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
            <label className="block text-sm font-medium text-slate-300 mb-1">物料类别 *</label>
            <div className="grid grid-cols-3 gap-2">
              {categoryOptions.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setMaterialForm(prev => ({ ...prev, category: cat.value as Material['category'] }))}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                    materialForm.category === cat.value
                      ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {cat.value === 'steel' && <Layers className="w-5 h-5" />}
                  {cat.value === 'non_ferrous' && <Scale className="w-5 h-5" />}
                  {cat.value === 'other' && <Package className="w-5 h-5" />}
                  <span className="text-xs">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">物料类型 *</label>
            <input
              type="text"
              value={materialForm.type}
              onChange={(e) => setMaterialForm(prev => ({ ...prev, type: e.target.value }))}
              placeholder="如：重型废钢、紫铜、铝合金"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">重量 *</label>
              <input
                type="number"
                step="0.01"
                value={materialForm.weight}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, weight: e.target.value }))}
                placeholder="重量"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">单位</label>
              <select
                value={materialForm.unit}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
              >
                <option value="t">吨 (t)</option>
                <option value="kg">千克 (kg)</option>
                <option value="个">个</option>
                <option value="台">台</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">预估单价 (元) *</label>
            <input
              type="number"
              value={materialForm.price}
              onChange={(e) => setMaterialForm(prev => ({ ...prev, price: e.target.value }))}
              placeholder="每吨价格"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">入库日期</label>
            <input
              type="date"
              value={materialForm.stockDate}
              onChange={(e) => setMaterialForm(prev => ({ ...prev, stockDate: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">存放仓库</label>
            <input
              type="text"
              value={materialForm.warehouse}
              onChange={(e) => setMaterialForm(prev => ({ ...prev, warehouse: e.target.value }))}
              placeholder="如：A库区、B库区"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => { setIsSaleModalOpen(false); resetSaleForm(); }}
        title={editingSale ? '编辑销售单' : '创建销售单'}
        width="max-w-3xl"
        footer={
          <>
            <button
              onClick={() => { setIsSaleModalOpen(false); resetSaleForm(); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSaleSubmit}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
            >
              {editingSale ? '保存' : '创建'}
            </button>
          </>
        }
      >
        {selectedMaterial && !editingSale && (
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h5 className="font-medium text-slate-200 mb-2">销售物料信息</h5>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500">物料类型</p>
                <p className="text-slate-200">{selectedMaterial.type}</p>
              </div>
              <div>
                <p className="text-slate-500">类别</p>
                <p className="text-slate-200">{getMaterialCategoryText(selectedMaterial.category)}</p>
              </div>
              <div>
                <p className="text-slate-500">可用库存</p>
                <p className="text-slate-200">{formatWeight(selectedMaterial.weight, selectedMaterial.unit)}</p>
              </div>
              <div>
                <p className="text-slate-500">预估单价</p>
                <p className="text-slate-200">{formatCurrency(selectedMaterial.price)}/t</p>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">客户名称 *</label>
            <input
              type="text"
              value={saleForm.customer}
              onChange={(e) => setSaleForm(prev => ({ ...prev, customer: e.target.value }))}
              placeholder="如：宝钢集团"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">销售日期</label>
            <input
              type="date"
              value={saleForm.saleDate}
              onChange={(e) => setSaleForm(prev => ({ ...prev, saleDate: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">销售数量 *</label>
            <input
              type="number"
              step="0.01"
              value={saleForm.quantity}
              onChange={(e) => { setSaleForm(prev => ({ ...prev, quantity: e.target.value })); }}
              placeholder="销售数量"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">销售单价 (元) *</label>
            <input
              type="number"
              value={saleForm.unitPrice}
              onChange={(e) => { setSaleForm(prev => ({ ...prev, unitPrice: e.target.value })); }}
              placeholder="每吨价格"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">总金额</label>
            <input
              type="text"
              value={formatCurrency(Number(saleForm.totalAmount || 0))}
              disabled
              className="w-full px-3 py-2 bg-slate-800/30 border border-slate-700 rounded-lg text-success-400 font-medium cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">发票号</label>
            <input
              type="text"
              value={saleForm.invoiceNumber}
              onChange={(e) => setSaleForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              placeholder="如：FP202606001"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">状态</label>
            <select
              value={saleForm.status}
              onChange={(e) => setSaleForm(prev => ({ ...prev, status: e.target.value as Sale['status'] }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            >
              <option value="pending">待确认</option>
              <option value="shipped">已出库</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
