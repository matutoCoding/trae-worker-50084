import { create } from 'zustand';
import { HazardousWaste, TransferOrder } from '../types';
import { mockHazmat, mockTransferOrders } from '../data/mockHazmat';
import { getStorage, setStorage } from '../utils/storage';
import { generateId } from '../utils/format';

interface HazmatStore {
  wastes: HazardousWaste[];
  transferOrders: TransferOrder[];
  fetchWastes: () => void;
  fetchTransferOrders: () => void;
  getWastesByShip: (shipId: string) => HazardousWaste[];
  getWastesByType: (type: HazardousWaste['type']) => HazardousWaste[];
  addWaste: (waste: Omit<HazardousWaste, 'id'>) => void;
  updateWaste: (id: string, data: Partial<HazardousWaste>) => void;
  addTransferOrder: (order: Omit<TransferOrder, 'id'>) => void;
  updateTransferOrder: (id: string, data: Partial<TransferOrder>) => void;
  getWasteStats: () => {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

export const useHazmatStore = create<HazmatStore>((set, get) => ({
  wastes: getStorage('hazmat', mockHazmat),
  transferOrders: getStorage('transferOrders', mockTransferOrders),

  fetchWastes: () => {
    const wastes = getStorage('hazmat', mockHazmat);
    set({ wastes });
  },

  fetchTransferOrders: () => {
    const transferOrders = getStorage('transferOrders', mockTransferOrders);
    set({ transferOrders });
  },

  getWastesByShip: (shipId) => {
    return get().wastes.filter(w => w.shipId === shipId);
  },

  getWastesByType: (type) => {
    return get().wastes.filter(w => w.type === type);
  },

  addWaste: (wasteData) => {
    const newWaste: HazardousWaste = {
      ...wasteData,
      id: generateId(),
    };
    const wastes = [...get().wastes, newWaste];
    set({ wastes });
    setStorage('hazmat', wastes);
  },

  updateWaste: (id, data) => {
    const wastes = get().wastes.map(w =>
      w.id === id ? { ...w, ...data } : w
    );
    set({ wastes });
    setStorage('hazmat', wastes);
  },

  addTransferOrder: (orderData) => {
    const newOrder: TransferOrder = {
      ...orderData,
      id: generateId(),
    };
    const transferOrders = [...get().transferOrders, newOrder];
    set({ transferOrders });
    setStorage('transferOrders', transferOrders);
    
    get().updateWaste(orderData.wasteId, { status: 'transferred' });
  },

  updateTransferOrder: (id, data) => {
    const transferOrders = get().transferOrders.map(o =>
      o.id === id ? { ...o, ...data } : o
    );
    set({ transferOrders });
    setStorage('transferOrders', transferOrders);
    
    if (data.status === 'received') {
      const order = get().transferOrders.find(o => o.id === id);
      if (order) {
        get().updateWaste(order.wasteId, { status: 'completed' });
      }
    }
  },

  getWasteStats: () => {
    const wastes = get().wastes;
    const total = wastes.reduce((sum, w) => sum + w.quantity, 0);
    
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    
    wastes.forEach(w => {
      byType[w.type] = (byType[w.type] || 0) + w.quantity;
      byStatus[w.status] = (byStatus[w.status] || 0) + w.quantity;
    });
    
    return { total, byType, byStatus };
  },
}));
