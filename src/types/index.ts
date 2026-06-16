export interface Ship {
  id: string;
  name: string;
  imoNumber: string;
  flag: string;
  type: string;
  grossTonnage: number;
  lightDisplacement: number;
  arrivalDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  owner: string;
  shipyard: string;
  description?: string;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DisassemblyPlan {
  id: string;
  shipId: string;
  shipName: string;
  processName: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  assignee: string;
  description?: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  planId: string;
  name: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  assignee: string;
}

export interface HazardousWaste {
  id: string;
  shipId: string;
  shipName: string;
  type: 'asbestos' | 'oil' | 'chemical' | 'battery' | 'other';
  category: string;
  quantity: number;
  unit: string;
  disposalMethod: string;
  disposalDate: string;
  status: 'stored' | 'processing' | 'transferred' | 'completed';
  location: string;
}

export interface TransferOrder {
  id: string;
  wasteId: string;
  orderNumber: string;
  transferDate: string;
  transporter: string;
  receiver: string;
  quantity: number;
  status: 'pending' | 'approved' | 'transferred' | 'received';
  documents?: string[];
}

export interface Material {
  id: string;
  shipId: string;
  shipName: string;
  category: 'steel' | 'non_ferrous' | 'other';
  type: string;
  weight: number;
  unit: string;
  price: number;
  stockDate: string;
  status: 'in_stock' | 'sold' | 'reserved';
  warehouse: string;
}

export interface Sale {
  id: string;
  materialId: string;
  materialName: string;
  customer: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: string;
  status: 'pending' | 'shipped' | 'completed' | 'cancelled';
  invoiceNumber?: string;
}

export interface SafetyPermit {
  id: string;
  shipId: string;
  shipName: string;
  type: 'hot_work' | 'confined_space' | 'high_altitude' | 'cabin_test';
  applicant: string;
  applicationDate: string;
  location: string;
  workContent: string;
  hazardAssessment: string;
  safetyMeasures: string[];
  approver?: string;
  approvalDate?: string;
  validFrom: string;
  validTo: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'expired';
  gasDetection?: GasDetection;
}

export interface GasDetection {
  oxygen: number;
  flammable: number;
  toxic: number;
  hydrogenSulfide: number;
  carbonMonoxide: number;
  detectionTime: string;
  detector: string;
}

export interface EnvMonitoring {
  id: string;
  shipId?: string;
  type: 'dust' | 'noise' | 'water' | 'air';
  value: number;
  unit: string;
  threshold: number;
  monitorTime: string;
  location: string;
  status: 'normal' | 'warning' | 'exceeded';
  deviceId: string;
}

export type NavItem = {
  key: string;
  label: string;
  icon: string;
  path: string;
};

export type TabItem = {
  key: string;
  label: string;
};

export type StatusType = 'pending' | 'in_progress' | 'completed' | 'not_started' | 'delayed' | 'stored' | 'processing' | 'transferred' | 'approved' | 'normal' | 'warning' | 'exceeded';
