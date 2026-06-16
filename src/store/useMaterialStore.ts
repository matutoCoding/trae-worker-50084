import { create } from 'zustand';
import { Material, Sale } from '../types';
import { mockMaterials, mockSales } from '../data/mockMaterials';
import { getStorage, setStorage } from '../utils/storage';
import { generateId } from '../utils/format';

interface MaterialStore {
  materials: Material[];
  sales: Sale[];
  fetchMaterials: () => void;
  fetchSales: () => void;
  getMaterialsByShip: (shipId: string) => Material[];
  getMaterialsByCategory: (category: Material['category']) => Material[];
  addMaterial: (material: Omit<Material, 'id'>) => void;
  updateMaterial: (id: string, data: Partial<Material>) => void;
  addSale: (sale: Omit<Sale, 'id'>) => void;
  updateSale: (id: string, data: Partial<Sale>) => void;
  getInventoryStats: () => {
    totalWeight: number;
    totalValue: number;
    byCategory: Record<string, { weight: number; value: number }>;
  };
  getSalesStats: () => {
    totalRevenue: number;
    thisMonthRevenue: number;
    byCustomer: Record<string, number>;
  };
}

export const useMaterialStore = create<MaterialStore>((set, get) => ({
  materials: getStorage('materials', mockMaterials),
  sales: getStorage('sales', mockSales),

  fetchMaterials: () => {
    const materials = getStorage('materials', mockMaterials);
    set({ materials });
  },

  fetchSales: () => {
    const sales = getStorage('sales', mockSales);
    set({ sales });
  },

  getMaterialsByShip: (shipId) => {
    return get().materials.filter(m => m.shipId === shipId);
  },

  getMaterialsByCategory: (category) => {
    return get().materials.filter(m => m.category === category);
  },

  addMaterial: (materialData) => {
    const newMaterial: Material = {
      ...materialData,
      id: generateId(),
    };
    const materials = [...get().materials, newMaterial];
    set({ materials });
    setStorage('materials', materials);
  },

  updateMaterial: (id, data) => {
    const materials = get().materials.map(m =>
      m.id === id ? { ...m, ...data } : m
    );
    set({ materials });
    setStorage('materials', materials);
  },

  addSale: (saleData) => {
    const newSale: Sale = {
      ...saleData,
      id: generateId(),
    };
    const sales = [...get().sales, newSale];
    set({ sales });
    setStorage('sales', sales);
    
    get().updateMaterial(saleData.materialId, { status: 'sold' });
  },

  updateSale: (id, data) => {
    const sales = get().sales.map(s =>
      s.id === id ? { ...s, ...data } : s
    );
    set({ sales });
    setStorage('sales', sales);
  },

  getInventoryStats: () => {
    const materials = get().materials.filter(m => m.status === 'in_stock');
    
    let totalWeight = 0;
    let totalValue = 0;
    const byCategory: Record<string, { weight: number; value: number }> = {};

    materials.forEach(m => {
      const value = m.weight * m.price;
      totalWeight += m.weight;
      totalValue += value;
      
      if (!byCategory[m.category]) {
        byCategory[m.category] = { weight: 0, value: 0 };
      }
      byCategory[m.category].weight += m.weight;
      byCategory[m.category].value += value;
    });

    return { totalWeight, totalValue, byCategory };
  },

  getSalesStats: () => {
    const sales = get().sales.filter(s => s.status !== 'cancelled');
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    let totalRevenue = 0;
    let thisMonthRevenue = 0;
    const byCustomer: Record<string, number> = {};

    sales.forEach(s => {
      totalRevenue += s.totalAmount;
      
      const saleDate = new Date(s.saleDate);
      if (saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear) {
        thisMonthRevenue += s.totalAmount;
      }
      
      byCustomer[s.customer] = (byCustomer[s.customer] || 0) + s.totalAmount;
    });

    return { totalRevenue, thisMonthRevenue, byCustomer };
  },
}));
