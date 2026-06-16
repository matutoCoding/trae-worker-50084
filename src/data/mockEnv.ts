import { EnvMonitoring, TreatmentRecord } from '../types';

const generateMonitorData = (
  type: 'dust' | 'noise' | 'water' | 'air',
  count: number,
  location: string,
  deviceId: string,
  threshold: number,
  unit: string
): EnvMonitoring[] => {
  const data: EnvMonitoring[] = [];
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    let value: number;
    let status: 'normal' | 'warning' | 'exceeded';
    
    if (type === 'dust') {
      value = Math.round((40 + Math.random() * 80) * 10) / 10;
      status = value > 100 ? 'exceeded' : value > 70 ? 'warning' : 'normal';
    } else if (type === 'noise') {
      value = Math.round((55 + Math.random() * 35) * 10) / 10;
      status = value > 85 ? 'exceeded' : value > 75 ? 'warning' : 'normal';
    } else if (type === 'water') {
      value = Math.round((30 + Math.random() * 60) * 10) / 10;
      status = value > 70 ? 'exceeded' : value > 50 ? 'warning' : 'normal';
    } else {
      value = Math.round((15 + Math.random() * 30) * 10) / 10;
      status = value > 35 ? 'exceeded' : value > 25 ? 'warning' : 'normal';
    }
    
    data.push({
      id: `${type}-${i}`,
      type,
      value,
      unit,
      threshold,
      monitorTime: time.toISOString().replace('T', ' ').substr(0, 19),
      location,
      status,
      deviceId,
    });
  }
  
  return data;
};

export const mockEnvMonitoring: EnvMonitoring[] = [
  ...generateMonitorData('dust', 24, '拆解作业区A', 'DEV-DUST-001', 70, 'μg/m³'),
  ...generateMonitorData('noise', 24, '拆解作业区A', 'DEV-NOISE-001', 75, 'dB'),
  ...generateMonitorData('water', 24, '油污水处理站', 'DEV-WATER-001', 50, 'mg/L'),
  ...generateMonitorData('dust', 24, '拆解作业区B', 'DEV-DUST-002', 70, 'μg/m³'),
  ...generateMonitorData('noise', 24, '拆解作业区B', 'DEV-NOISE-002', 75, 'dB'),
];

export const getCurrentEnvData = () => {
  return {
    dust: {
      pm10: 65.5,
      pm2_5: 38.2,
      threshold: 70,
      status: 'normal' as const,
      location: '拆解作业区A',
      trend: [55, 62, 58, 72, 68, 65, 70, 63],
      timeLabels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
    },
    noise: {
      current: 72.3,
      peak: 85.6,
      threshold: 75,
      status: 'normal' as const,
      location: '拆解作业区A',
      trend: [65, 70, 75, 82, 78, 70, 68, 65],
      timeLabels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
    },
    water: {
      cod: 42.5,
      oil: 3.2,
      ss: 28.6,
      threshold: 50,
      status: 'normal' as const,
      location: '污水处理站排放口',
      trend: [38, 42, 45, 48, 44, 40, 38, 36],
      timeLabels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
    },
    treatment: {
      inflow: 25.5,
      outflow: 24.8,
      processingRate: 97.3,
      status: 'running' as const,
      startTime: '2026-06-16 08:00:00',
      chemicals: {
        pac: 85,
        pam: 72,
        activatedCarbon: 90,
      },
    },
  };
};

export const mockTreatmentRecords: TreatmentRecord[] = [
  {
    id: 'treat-001',
    date: '2026-06-17',
    inflow: 25.5,
    outflow: 24.8,
    processingRate: 97.3,
    codBefore: 420,
    codAfter: 42.5,
    oilBefore: 35.2,
    oilAfter: 3.2,
    ssBefore: 280,
    ssAfter: 28.6,
    status: 'normal',
    operator: '张三',
    createdAt: '2026-06-17 08:00:00',
    updatedAt: '2026-06-17 08:00:00',
  },
  {
    id: 'treat-002',
    date: '2026-06-16',
    inflow: 28.2,
    outflow: 27.5,
    processingRate: 97.5,
    codBefore: 380,
    codAfter: 38.2,
    oilBefore: 32.5,
    oilAfter: 2.8,
    ssBefore: 260,
    ssAfter: 25.3,
    status: 'normal',
    operator: '李四',
    createdAt: '2026-06-16 08:00:00',
    updatedAt: '2026-06-16 08:00:00',
  },
  {
    id: 'treat-003',
    date: '2026-06-15',
    inflow: 32.1,
    outflow: 31.2,
    processingRate: 97.2,
    codBefore: 450,
    codAfter: 48.5,
    oilBefore: 38.0,
    oilAfter: 3.5,
    ssBefore: 310,
    ssAfter: 30.1,
    status: 'normal',
    operator: '张三',
    createdAt: '2026-06-15 08:00:00',
    updatedAt: '2026-06-15 08:00:00',
  },
  {
    id: 'treat-004',
    date: '2026-06-14',
    inflow: 26.8,
    outflow: 25.9,
    processingRate: 96.6,
    codBefore: 520,
    codAfter: 55.2,
    oilBefore: 42.0,
    oilAfter: 4.2,
    ssBefore: 350,
    ssAfter: 35.8,
    status: 'warning',
    operator: '王五',
    createdAt: '2026-06-14 08:00:00',
    updatedAt: '2026-06-14 08:00:00',
  },
  {
    id: 'treat-005',
    date: '2026-06-13',
    inflow: 24.5,
    outflow: 23.8,
    processingRate: 97.1,
    codBefore: 360,
    codAfter: 36.5,
    oilBefore: 28.5,
    oilAfter: 2.5,
    ssBefore: 240,
    ssAfter: 24.2,
    status: 'normal',
    operator: '李四',
    createdAt: '2026-06-13 08:00:00',
    updatedAt: '2026-06-13 08:00:00',
  },
];
