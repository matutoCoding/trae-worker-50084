import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  PlayCircle,
  PauseCircle,
  Trash2,
} from 'lucide-react';
import { DisassemblyPlan, Task, TabItem } from '../../types';
import { usePlanStore } from '../../store/usePlanStore';
import { useShipStore } from '../../store/useShipStore';
import { StatCard } from '../../components/ui/StatCard';
import { TabNavigation } from '../../components/ui/TabNavigation';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Modal } from '../../components/ui/Modal';
import { formatDate, getToday, formatPriority, getPriorityColor } from '../../utils/format';

const tabs: TabItem[] = [
  { key: 'list', label: '拆解计划列表' },
  { key: 'schedule', label: '工序排程' },
  { key: 'progress', label: '拆解进度' },
];

export const PlanList: React.FC = () => {
  const { plans, tasks, addPlan, updatePlan, deletePlan, addTask, updateTaskStatus, getTasksByPlan } = usePlanStore();
  const { ships } = useShipStore();
  const [activeTab, setActiveTab] = useState('list');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DisassemblyPlan | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<DisassemblyPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    shipId: '',
    shipName: '',
    processName: '',
    startDate: getToday(),
    endDate: getToday(),
    assignee: '',
    description: '',
  });
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    dueDate: getToday(),
    priority: 'medium' as Task['priority'],
    assignee: '',
  });

  const stats = useMemo(() => ({
    total: plans.length,
    inProgress: plans.filter(p => p.status === 'in_progress').length,
    completed: plans.filter(p => p.status === 'completed').length,
    delayed: plans.filter(p => p.status === 'delayed').length,
  }), [plans]);

  const shipGroups = useMemo(() => {
    const groups: { [key: string]: DisassemblyPlan[] } = {};
    plans.forEach(plan => {
      if (!groups[plan.shipName]) {
        groups[plan.shipName] = [];
      }
      groups[plan.shipName].push(plan);
    });
    return groups;
  }, [plans]);

  const allDates = useMemo(() => {
    const dates: string[] = [];
    plans.forEach(plan => {
      let start = new Date(plan.startDate);
      const end = new Date(plan.endDate);
      while (start <= end) {
        const dateStr = start.toISOString().split('T')[0];
        if (!dates.includes(dateStr)) {
          dates.push(dateStr);
        }
        start.setDate(start.getDate() + 1);
      }
    });
    return dates.sort();
  }, [plans]);

  const shipProgress = useMemo(() => {
    const progress: { [key: string]: { plans: DisassemblyPlan[]; avgProgress: number } } = {};
    plans.forEach(plan => {
      if (!progress[plan.shipName]) {
        progress[plan.shipName] = { plans: [], avgProgress: 0 };
      }
      progress[plan.shipName].plans.push(plan);
    });
    Object.keys(progress).forEach(shipName => {
      const shipPlans = progress[shipName].plans;
      progress[shipName].avgProgress = Math.round(
        shipPlans.reduce((sum, p) => sum + p.progress, 0) / shipPlans.length
      );
    });
    return progress;
  }, [plans]);

  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const matchKeyword = !searchKeyword ||
        plan.shipName.includes(searchKeyword) ||
        plan.processName.includes(searchKeyword) ||
        plan.assignee.includes(searchKeyword);
      const matchStatus = statusFilter === 'all' || plan.status === statusFilter;
      return matchKeyword && matchStatus;
    });
  }, [plans, searchKeyword, statusFilter]);

  const paginatedPlans = useMemo(() => {
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    return filteredPlans.slice(start, start + pageSize);
  }, [filteredPlans, page]);

  const planColumns = [
    {
      key: 'shipName',
      title: '船舶名称',
      render: (plan: DisassemblyPlan) => (
        <div>
          <p className="font-medium text-slate-200">{plan.shipName}</p>
          <p className="text-xs text-slate-500">{plan.processName}</p>
        </div>
      ),
    },
    {
      key: 'dateRange',
      title: '时间范围',
      render: (plan: DisassemblyPlan) => (
        <div className="text-sm">
          <p className="text-slate-300">{formatDate(plan.startDate)}</p>
          <p className="text-slate-500">至 {formatDate(plan.endDate)}</p>
        </div>
      ),
    },
    {
      key: 'progress',
      title: '进度',
      render: (plan: DisassemblyPlan) => (
        <div className="w-40">
          <ProgressBar value={plan.progress} progress={plan.progress} showLabel />
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (plan: DisassemblyPlan) => <StatusBadge status={plan.status} />,
    },
    {
      key: 'assignee',
      title: '负责人',
      dataIndex: 'assignee' as const,
    },
    {
      key: 'actions',
      title: '操作',
      width: '180px',
      render: (plan: DisassemblyPlan) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEditPlan(plan); }}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-primary-400 transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleManageTasks(plan); }}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-success-400 transition-colors"
            title="任务管理"
          >
            <PlayCircle className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-danger-400 transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleEditPlan = (plan: DisassemblyPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      shipId: plan.shipId,
      shipName: plan.shipName,
      processName: plan.processName,
      startDate: plan.startDate,
      endDate: plan.endDate,
      assignee: plan.assignee,
      description: plan.description || '',
    });
    setIsPlanModalOpen(true);
  };

  const handleManageTasks = (plan: DisassemblyPlan) => {
    setSelectedPlan(plan);
    setIsTaskModalOpen(true);
  };

  const handleDeletePlan = (id: string) => {
    if (confirm('确定要删除这个拆解计划吗？')) {
      deletePlan(id);
    }
  };

  const handlePlanSubmit = () => {
    if (!planForm.shipId || !planForm.processName) {
      alert('请填写必要信息');
      return;
    }

    const planData = {
      ...planForm,
      progress: 0,
      status: 'not_started' as const,
    };

    if (editingPlan) {
      updatePlan(editingPlan.id, planData);
    } else {
      addPlan(planData);
    }
    setIsPlanModalOpen(false);
    resetPlanForm();
  };

  const handleTaskSubmit = () => {
    if (!selectedPlan || !taskForm.name) {
      alert('请填写任务名称');
      return;
    }

    addTask({
      ...taskForm,
      planId: selectedPlan.id,
      status: 'pending',
    });
    resetTaskForm();
  };

  const handleShipSelect = (shipId: string) => {
    const ship = ships.find(s => s.id === shipId);
    setPlanForm(prev => ({
      ...prev,
      shipId,
      shipName: ship?.name || '',
    }));
  };

  const resetPlanForm = () => {
    setPlanForm({
      shipId: '',
      shipName: '',
      processName: '',
      startDate: getToday(),
      endDate: getToday(),
      assignee: '',
      description: '',
    });
    setEditingPlan(null);
  };

  const resetTaskForm = () => {
    setTaskForm({
      name: '',
      description: '',
      dueDate: getToday(),
      priority: 'medium',
      assignee: '',
    });
  };

  const planTasks = selectedPlan ? getTasksByPlan(selectedPlan.id) : [];

  const renderGanttChart = () => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'in_progress': return 'bg-primary-500';
        case 'completed': return 'bg-success-500';
        case 'delayed': return 'bg-danger-500';
        default: return 'bg-slate-600';
      }
    };

    return (
      <div className="industrial-card overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="flex border-b border-slate-700/50">
            <div className="w-48 flex-shrink-0 px-4 py-3 font-medium text-slate-300 border-r border-slate-700/50">船舶/工序</div>
            <div className="flex-1 flex">
              {allDates.slice(0, 30).map(date => (
                <div key={date} className="w-12 flex-shrink-0 px-1 py-3 text-xs text-slate-400 text-center border-r border-slate-700/30">
                  {date.split('-')[2]}
                </div>
              ))}
              {allDates.length > 30 && (
                <div className="w-12 flex-shrink-0 px-1 py-3 text-xs text-slate-400 text-center">
                  ...
                </div>
              )}
            </div>
          </div>
          {Object.entries(shipGroups).map(([shipName, shipPlans]) => (
            <React.Fragment key={shipName}>
              {shipPlans.map((plan, idx) => (
                <div key={plan.id} className="flex border-b border-slate-700/30 hover:bg-slate-800/30">
                  <div className={`w-48 flex-shrink-0 px-4 py-3 border-r border-slate-700/50 ${idx === 0 ? 'font-medium text-primary-400' : 'pl-8 text-sm text-slate-400'}`}>
                    {idx === 0 ? shipName : plan.processName}
                  </div>
                  <div className="flex-1 relative h-12">
                    {idx > 0 && (
                      <div
                        className={`absolute top-2 bottom-2 rounded ${getStatusColor(plan.status)} opacity-80`}
                        style={{
                          left: `${(allDates.indexOf(plan.startDate) / allDates.length) * 100}%`,
                          width: `${((allDates.indexOf(plan.endDate) - allDates.indexOf(plan.startDate) + 1) / allDates.length) * 100}%`,
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                          {plan.progress}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderProgressOverview = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(shipProgress).map(([shipName, data]) => (
          <div key={shipName} className="industrial-card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-slate-200">{shipName}</h4>
              <span className={`text-2xl font-bold font-display ${
                data.avgProgress === 100 ? 'text-success-400' :
                data.avgProgress > 50 ? 'text-primary-400' : 'text-warning-400'
              }`}>
                {data.avgProgress}%
              </span>
            </div>
            <ProgressBar value={data.avgProgress} progress={data.avgProgress} size="lg" />
            <div className="mt-4 space-y-3">
              {data.plans.map(plan => (
                <div key={plan.id} className="flex items-center gap-3">
                  <StatusBadge status={plan.status} size="sm" />
                  <span className="flex-1 text-sm text-slate-300">{plan.processName}</span>
                  <span className="text-sm text-slate-400">{plan.progress}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 font-display">拆解计划管理</h1>
          <p className="text-slate-400 mt-1">管理拆解工序排程、任务分配和进度跟踪</p>
        </div>
        <button
          onClick={() => setIsPlanModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建拆解计划
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总计划数"
          value={stats.total}
          icon={<Calendar className="w-6 h-6" />}
          color="primary"
        />
        <StatCard
          title="进行中"
          value={stats.inProgress}
          icon={<PlayCircle className="w-6 h-6" />}
          color="success"
        />
        <StatCard
          title="已完成"
          value={stats.completed}
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="slate"
        />
        <StatCard
          title="延期"
          value={stats.delayed}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="danger"
        />
      </div>

      <TabNavigation tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'list' && (
        <>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="搜索船舶名称、工序名称、负责人..."
                value={searchKeyword}
                onChange={(e) => { setSearchKeyword(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            >
              <option value="all">全部状态</option>
              <option value="not_started">未开始</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="delayed">延期</option>
            </select>
          </div>

          <DataTable
            columns={planColumns}
            data={paginatedPlans}
            pagination={{
              current: page,
              pageSize: 10,
              total: filteredPlans.length,
              onChange: setPage,
            }}
          />
        </>
      )}

      {activeTab === 'schedule' && renderGanttChart()}
      {activeTab === 'progress' && renderProgressOverview()}

      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => { setIsPlanModalOpen(false); resetPlanForm(); }}
        title={editingPlan ? '编辑拆解计划' : '新建拆解计划'}
        width="max-w-3xl"
        footer={
          <>
            <button
              onClick={() => { setIsPlanModalOpen(false); resetPlanForm(); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handlePlanSubmit}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
            >
              {editingPlan ? '保存' : '创建'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">选择船舶 *</label>
            <select
              value={planForm.shipId}
              onChange={(e) => handleShipSelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            >
              <option value="">请选择船舶</option>
              {ships.filter(s => s.status !== 'completed').map(ship => (
                <option key={ship.id} value={ship.id}>{ship.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">工序名称 *</label>
            <input
              type="text"
              value={planForm.processName}
              onChange={(e) => setPlanForm(prev => ({ ...prev, processName: e.target.value }))}
              placeholder="如：拆解工序一 - 预处理阶段"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">开始日期</label>
            <input
              type="date"
              value={planForm.startDate}
              onChange={(e) => setPlanForm(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">结束日期</label>
            <input
              type="date"
              value={planForm.endDate}
              onChange={(e) => setPlanForm(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">负责人</label>
            <input
              type="text"
              value={planForm.assignee}
              onChange={(e) => setPlanForm(prev => ({ ...prev, assignee: e.target.value }))}
              placeholder="负责人姓名"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">工序描述</label>
            <textarea
              value={planForm.description}
              onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="请描述该工序的主要工作内容..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => { setIsTaskModalOpen(false); setSelectedPlan(null); resetTaskForm(); }}
        title={`任务管理 - ${selectedPlan?.processName || ''}`}
        width="max-w-4xl"
      >
        <div className="space-y-6">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h5 className="font-medium text-slate-200 mb-4">添加新任务</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">任务名称 *</label>
                <input
                  type="text"
                  value={taskForm.name}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="任务名称"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">截止日期</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">优先级</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary-500"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">负责人</label>
                <input
                  type="text"
                  value={taskForm.assignee}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, assignee: e.target.value }))}
                  placeholder="负责人"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">任务描述</label>
                <input
                  type="text"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="任务详细描述"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  onClick={handleTaskSubmit}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
                >
                  添加任务
                </button>
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-medium text-slate-200 mb-4">任务列表 ({planTasks.length})</h5>
            {planTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                暂无任务，请添加
              </div>
            ) : (
              <div className="space-y-3">
                {planTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <button
                      onClick={() => updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                      className={`p-1.5 rounded transition-colors ${
                        task.status === 'completed'
                          ? 'bg-success-500/20 text-success-400'
                          : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p className={`font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {task.name}
                      </p>
                      <p className="text-xs text-slate-500">{task.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(task.priority)}`}>
                      {formatPriority(task.priority)}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(task.dueDate)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Users className="w-3 h-3" />
                      {task.assignee}
                    </div>
                    <StatusBadge status={task.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
