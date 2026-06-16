import { create } from 'zustand';
import { EnvMonitoring } from '../types';
import { mockEnvMonitoring, getCurrentEnvData } from '../data/mockEnv';
import { getStorage, setStorage } from '../utils/storage';
import { generateId } from '../utils/format';

interface EnvStore {
  monitorings: EnvMonitoring[];
  currentData: ReturnType<typeof getCurrentEnvData>;
  fetchMonitorings: () => void;
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
}

export const useEnvStore = create<EnvStore>((set, get) => ({
  monitorings: getStorage('envMonitorings', mockEnvMonitoring),
  currentData: getCurrentEnvData(),

  fetchMonitorings: () => {
    const monitorings = getStorage('envMonitorings', mockEnvMonitoring);
    set({ monitorings });
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
    return get().monitorings.filter(m => m.status === 'exceeded' || m.status === 'warning');
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
}));
