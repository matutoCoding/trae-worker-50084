export { formatDate, getToday, getNow, formatDateTime } from './date';

export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatCurrency = (amount: number, currency: string = 'CNY'): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatWeight = (weight: number, unit: string = 't'): string => {
  return `${formatNumber(weight)} ${unit}`;
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substr(0, maxLength)}...`;
};

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    not_started: '未开始',
    delayed: '已延期',
    stored: '已贮存',
    processing: '处理中',
    transferred: '已转移',
    approved: '已批准',
    normal: '正常',
    warning: '预警',
    exceeded: '超标',
    in_stock: '库存中',
    sold: '已销售',
    reserved: '已预留',
    shipped: '已出库',
    cancelled: '已取消',
    draft: '草稿',
    rejected: '已驳回',
    expired: '已过期',
    received: '已接收',
    not_issued: '未开具',
    issued: '已开票',
    sent: '已寄送',
  };
  return statusMap[status] || status;
};

export const getPriorityText = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  };
  return priorityMap[priority] || priority;
};

export const getWasteTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    asbestos: '石棉废物',
    oil: '油类废物',
    chemical: '化学废物',
    battery: '废电池',
    other: '其他废物',
  };
  return typeMap[type] || type;
};

export const getPermitTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    hot_work: '动火作业',
    confined_space: '有限空间作业',
    high_altitude: '高处作业',
    cabin_test: '舱室检测',
  };
  return typeMap[type] || type;
};

export const getMaterialCategoryText = (category: string): string => {
  const categoryMap: Record<string, string> = {
    steel: '钢材',
    non_ferrous: '有色金属',
    other: '其他物料',
  };
  return categoryMap[category] || category;
};

export const formatPriority = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  };
  return priorityMap[priority] || priority;
};

export const getPriorityColor = (priority: string): string => {
  const colorMap: Record<string, string> = {
    low: 'bg-slate-600/50 text-slate-300',
    medium: 'bg-primary-600/50 text-primary-300',
    high: 'bg-warning-600/50 text-warning-300',
    urgent: 'bg-danger-600/50 text-danger-300',
  };
  return colorMap[priority] || colorMap.medium;
};
