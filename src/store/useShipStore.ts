import { create } from 'zustand';
import { Ship } from '../types';
import { mockShips } from '../data/mockShips';
import { getStorage, setStorage } from '../utils/storage';
import { generateId, getNow } from '../utils/format';

interface ShipStore {
  ships: Ship[];
  selectedShip: Ship | null;
  loading: boolean;
  fetchShips: () => void;
  getShipById: (id: string) => Ship | undefined;
  addShip: (ship: Omit<Ship, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateShip: (id: string, data: Partial<Ship>) => void;
  deleteShip: (id: string) => void;
  selectShip: (ship: Ship | null) => void;
  filterShips: (status?: Ship['status'], keyword?: string) => Ship[];
}

export const useShipStore = create<ShipStore>((set, get) => ({
  ships: getStorage('ships', mockShips),
  selectedShip: null,
  loading: false,

  fetchShips: () => {
    const ships = getStorage('ships', mockShips);
    set({ ships });
  },

  getShipById: (id) => {
    return get().ships.find(s => s.id === id);
  },

  addShip: (shipData) => {
    const newShip: Ship = {
      ...shipData,
      id: generateId(),
      createdAt: getNow(),
      updatedAt: getNow(),
    };
    const ships = [...get().ships, newShip];
    set({ ships });
    setStorage('ships', ships);
  },

  updateShip: (id, data) => {
    const ships = get().ships.map(s =>
      s.id === id ? { ...s, ...data, updatedAt: getNow() } : s
    );
    set({ ships });
    setStorage('ships', ships);
  },

  deleteShip: (id) => {
    const ships = get().ships.filter(s => s.id !== id);
    set({ ships });
    setStorage('ships', ships);
  },

  selectShip: (ship) => {
    set({ selectedShip: ship });
  },

  filterShips: (status, keyword) => {
    let filtered = get().ships;
    
    if (status) {
      filtered = filtered.filter(s => s.status === status);
    }
    
    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(kw) ||
        s.imoNumber.toLowerCase().includes(kw) ||
        s.owner.toLowerCase().includes(kw)
      );
    }
    
    return filtered;
  },
}));
