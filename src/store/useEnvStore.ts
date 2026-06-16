import { create } from 'zustand';
import { EnvMonitoring, TreatmentRecord } from '../types';
import { mockEnvMonitoring, getCurrentEnvData, mockTreatmentRecords } from '../data/mockEnv';
import { getStorage, setStorage } from '../utils/storage';
import { generateId } from '../utils/format';

interface EnvStore {
  monitorings: EnvMonitoring[];
  treatmentRecords: TreatmentRecord[];
  currentData: ReturnType<typeof getCurrentEnvData>;
  fetchMonitorings: () => void;
  fetchTreatmentRecords: () => void;
  refreshCurrentData: () => void;
  getMonitoringsByType: (type: EnvMonitoring['type']) => EnvMonitoring[];
  getMonitoringsByLocation: (location: string) => EnvMonitoring[];
  addMonitoring: (monitoring: Omit<EnvMonitoring, 'id'>) => void;
  getAlerts: () => EnvMonitoring[];
  getEnvStats: () => {
    dustAvg: number;
    noiseAvg: number;
    waterAvg: number;
    alertCount: number;
  };
  markAlertHandled: (id: string, handledBy?: string) => void;
  addTreatmentRecord: (record: Omit<TreatmentRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTreatmentRecord: (id: string, record: Partial<TreatmentRecord>) => void;
  deleteTreatmentRecord: (id: string) => void;
}

export const useEnvStore = create<EnvStore>((set, get) => ({
  monitorings: getStorage('envMonitorings', mockEnvMonitoring),
  treatmentRecords: getStorage('treatmentRecords', mockTreatmentRecords),
  currentData: getCurrentEnvData(),

  fetchMonitorings: () => {
    const monitorings = getStorage('envMonitorings', mockEnvMonitoring);
    set({ monitorings });
  },

  fetchTreatmentRecords: () => {
    const treatmentRecords = getStorage('treatmentRecords', mockTreatmentRecords);
    set({ treatmentRecords });
  },

  refreshCurrentData: () => {
    set({ currentData: getCurrentEnvData() });
  },

  getMonitoringsByType: (type) => {
    return get().monitorings.filter(m => m.type === type);
  },

  getMonitoringsByLocation: (location) => {
    return get().monitorings.filter(m => m.location === location);
  },

  addMonitoring: (monitoringData) => {
    const newMonitoring: EnvMonitoring = {
      ...monitoringData,
      id: generateId(),
    };
    const monitorings = [...get().monitorings, newMonitoring];
    set({ monitorings });
    setStorage('envMonitorings', monitorings);
  },

  getAlerts: () => {
    return get().monitorings
      .filter(m => m.status === 'exceeded' || m.status === 'warning')
      .sort((a, b) => {
        if (a.handled && !b.handled) return 1;
        if (!a.handled && b.handled) return -1;
        return new Date(b.monitorTime).getTime() - new Date(a.monitorTime).getTime();
      });
  },

  getEnvStats: () => {
    const monitorings = get().monitorings;
    const last24Hours = monitorings.slice(-96);
    
    const dustData = last24Hours.filter(m => m.type === 'dust');
    const noiseData = last24Hours.filter(m => m.type === 'noise');
    const waterData = last24Hours.filter(m => m.type === 'water');
    
    const dustAvg = dustData.length > 0 
      ? dustData.reduce((sum, m) => sum + m.value, 0) / dustData.length 
      : 0;
    const noiseAvg = noiseData.length > 0
      ? noiseData.reduce((sum, m) => sum + m.value, 0) / noiseData.length
      : 0;
    const waterAvg = waterData.length > 0
      ? waterData.reduce((sum, m) => sum + m.value, 0) / waterData.length
      : 0;
    
    const alertCount = monitorings.filter(m => m.status !== 'normal').length;

    return { dustAvg, noiseAvg, waterAvg, alertCount };
  },

  markAlertHandled: (id, handledBy = '管理员') => {
    const now = new Date().toISOString().replace('T', ' ').substr(0, 19);
    const monitorings = get().monitorings.map(m =>
      m.id === id
        ? { ...m, handled: true, handledAt: now, handledBy }
        : m
    );
    set({ monitorings });
    setStorage('envMonitorings', monitorings);
  },

  addTreatmentRecord: (recordData) => {
    const now = new Date().toISOString().replace('T', ' ').substr(0, 19);
    const newRecord: TreatmentRecord = {
      ...recordData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    const treatmentRecords = [newRecord, ...get().treatmentRecords];
    set({ treatmentRecords });
    setStorage('treatmentRecords', treatmentRecords);
  },

  updateTreatmentRecord: (id, recordData) => {
    const now = new Date().toISOString().replace('T', ' ').substr(0, 19);
    const treatmentRecords = get().treatmentRecords.map(r =>
      r.id === id
        ? { ...r, ...recordData, updatedAt: now }
        : r
    );
    set({ treatmentRecords });
    setStorage('treatmentRecords', treatmentRecords);
  },

  deleteTreatmentRecord: (id) => {
    const treatmentRecords = get().treatmentRecords.filter(r => r.id !== id);
    set({ treatmentRecords });
    setStorage('treatmentRecords', treatmentRecords);
  },
}));
