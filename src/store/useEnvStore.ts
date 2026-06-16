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
  markAlertHandled: (id: string, handledBy?: string, handleNote?: string, handleResult?: string) => void;
  addAlertFollowUp: (id: string, operator: string, note: string, result?: string) => void;
  addTreatmentRecord: (record: Omit<TreatmentRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTreatmentRecord: (id: string, record: Partial<TreatmentRecord>) => void;
  deleteTreatmentRecord: (id: string) => void;
  filterTreatmentRecords: (startDate?: string, endDate?: string) => TreatmentRecord[];
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

  markAlertHandled: (id, handledBy, handleNote, handleResult) => {
    const now = new Date().toISOString().replace('T', ' ').substr(0, 19);
    const monitorings = get().monitorings.map(m => {
      if (m.id !== id) return m;
      const existingTimeline = m.timeline ? [...m.timeline] : [];
      if (existingTimeline.length === 0) {
        existingTimeline.push({
          time: m.monitorTime,
          action: '告警创建',
          operator: '系统',
          note: `${m.type === 'dust' ? '扬尘' : m.type === 'noise' ? '噪声' : m.type === 'water' ? '水质' : '空气质量'}${m.status === 'exceeded' ? '超标' : '预警'}`,
        });
      }
      const resultText = handleResult === 'handled' ? '已处置' : handleResult === 'followup' ? '需跟进' : '误报';
      existingTimeline.push({
        time: now,
        action: '告警处理',
        operator: handledBy,
        note: `处理结果：${resultText}${handleNote ? '；说明：' + handleNote : ''}`,
      });
      return {
        ...m,
        handled: true,
        handledAt: now,
        handledBy,
        handleNote,
        handleResult,
        timeline: existingTimeline,
      };
    });
    set({ monitorings });
    setStorage('envMonitorings', monitorings);
  },

  addAlertFollowUp: (id, operator, note, result) => {
    const now = new Date().toISOString().replace('T', ' ').substr(0, 19);
    const monitorings = get().monitorings.map(m => {
      if (m.id !== id) return m;
      const existingTimeline = m.timeline ? [...m.timeline] : [];
      if (existingTimeline.length === 0) {
        existingTimeline.push({
          time: m.monitorTime,
          action: '告警创建',
          operator: '系统',
          note: `${m.type === 'dust' ? '扬尘' : m.type === 'noise' ? '噪声' : m.type === 'water' ? '水质' : '空气质量'}${m.status === 'exceeded' ? '超标' : '预警'}`,
        });
      }
      let resultText = '';
      if (result === 'handled') resultText = '已处置';
      else if (result === 'followup') resultText = '需跟进';
      else if (result === 'false_alarm') resultText = '误报';
      
      const followUpNote = result 
        ? `处理结果：${resultText}${note ? '；说明：' + note : ''}`
        : note;
      
      existingTimeline.push({
        time: now,
        action: '补充跟进',
        operator,
        note: followUpNote,
      });
      return {
        ...m,
        handled: true,
        handledAt: m.handledAt || now,
        handledBy: m.handledBy || operator,
        handledNote: m.handledNote || note,
        handleResult: m.handleResult || result,
        timeline: existingTimeline,
      };
    });
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

  filterTreatmentRecords: (startDate, endDate) => {
    return get().treatmentRecords.filter(r => {
      const recordDate = new Date(r.date);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (recordDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (recordDate > end) return false;
      }
      return true;
    });
  },
}));
