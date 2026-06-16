import { create } from 'zustand';
import { SafetyPermit } from '../types';
import { mockSafetyPermits } from '../data/mockSafety';
import { getStorage, setStorage } from '../utils/storage';
import { generateId, getNow } from '../utils/format';

interface SafetyStore {
  permits: SafetyPermit[];
  fetchPermits: () => void;
  getPermitsByShip: (shipId: string) => SafetyPermit[];
  getPermitsByType: (type: SafetyPermit['type']) => SafetyPermit[];
  getActivePermits: () => SafetyPermit[];
  addPermit: (permit: Omit<SafetyPermit, 'id'>) => void;
  updatePermit: (id: string, data: Partial<SafetyPermit>) => void;
  approvePermit: (id: string, approver: string) => void;
  rejectPermit: (id: string, approver: string) => void;
  getPermitStats: () => {
    total: number;
    pending: number;
    approved: number;
    byType: Record<string, number>;
  };
}

export const useSafetyStore = create<SafetyStore>((set, get) => ({
  permits: getStorage('safetyPermits', mockSafetyPermits),

  fetchPermits: () => {
    const permits = getStorage('safetyPermits', mockSafetyPermits);
    set({ permits });
  },

  getPermitsByShip: (shipId) => {
    return get().permits.filter(p => p.shipId === shipId);
  },

  getPermitsByType: (type) => {
    return get().permits.filter(p => p.type === type);
  },

  getActivePermits: () => {
    const now = new Date();
    return get().permits.filter(p => {
      if (p.status !== 'approved') return false;
      const validTo = new Date(p.validTo);
      return validTo >= now;
    });
  },

  addPermit: (permitData) => {
    const newPermit: SafetyPermit = {
      ...permitData,
      id: generateId(),
    };
    const permits = [...get().permits, newPermit];
    set({ permits });
    setStorage('safetyPermits', permits);
  },

  updatePermit: (id, data) => {
    const permits = get().permits.map(p =>
      p.id === id ? { ...p, ...data } : p
    );
    set({ permits });
    setStorage('safetyPermits', permits);
  },

  approvePermit: (id, approver) => {
    const permits = get().permits.map(p =>
      p.id === id ? { ...p, status: 'approved' as const, approver, approvalDate: getNow() } : p
    );
    set({ permits });
    setStorage('safetyPermits', permits);
  },

  rejectPermit: (id, approver) => {
    const permits = get().permits.map(p =>
      p.id === id ? { ...p, status: 'rejected' as const, approver, approvalDate: getNow() } : p
    );
    set({ permits });
    setStorage('safetyPermits', permits);
  },

  getPermitStats: () => {
    const permits = get().permits;
    const total = permits.length;
    const pending = permits.filter(p => p.status === 'pending').length;
    const approved = permits.filter(p => p.status === 'approved').length;
    const byType: Record<string, number> = {};

    permits.forEach(p => {
      byType[p.type] = (byType[p.type] || 0) + 1;
    });

    return { total, pending, approved, byType };
  },
}));
