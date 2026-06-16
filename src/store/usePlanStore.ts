import { create } from 'zustand';
import { DisassemblyPlan, Task } from '../types';
import { mockPlans, mockTasks } from '../data/mockPlans';
import { getStorage, setStorage } from '../utils/storage';
import { generateId, getNow } from '../utils/format';

interface PlanStore {
  plans: DisassemblyPlan[];
  tasks: Task[];
  selectedPlan: DisassemblyPlan | null;
  fetchPlans: () => void;
  fetchTasks: () => void;
  getPlansByShip: (shipId: string) => DisassemblyPlan[];
  getTasksByPlan: (planId: string) => Task[];
  addPlan: (plan: Omit<DisassemblyPlan, 'id'>) => void;
  updatePlan: (id: string, data: Partial<DisassemblyPlan>) => void;
  deletePlan: (id: string) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  updateTaskStatus: (id: string, status: Task['status']) => void;
  selectPlan: (plan: DisassemblyPlan | null) => void;
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  plans: getStorage('plans', mockPlans),
  tasks: getStorage('tasks', mockTasks),
  selectedPlan: null,

  fetchPlans: () => {
    const plans = getStorage('plans', mockPlans);
    set({ plans });
  },

  fetchTasks: () => {
    const tasks = getStorage('tasks', mockTasks);
    set({ tasks });
  },

  getPlansByShip: (shipId) => {
    return get().plans.filter(p => p.shipId === shipId);
  },

  getTasksByPlan: (planId) => {
    return get().tasks.filter(t => t.planId === planId);
  },

  addPlan: (planData) => {
    const newPlan: DisassemblyPlan = {
      ...planData,
      id: generateId(),
    };
    const plans = [...get().plans, newPlan];
    set({ plans });
    setStorage('plans', plans);
  },

  updatePlan: (id, data) => {
    const plans = get().plans.map(p =>
      p.id === id ? { ...p, ...data } : p
    );
    set({ plans });
    setStorage('plans', plans);
  },

  deletePlan: (id) => {
    const plans = get().plans.filter(p => p.id !== id);
    const tasks = get().tasks.filter(t => t.planId !== id);
    set({ plans, tasks });
    setStorage('plans', plans);
    setStorage('tasks', tasks);
  },

  addTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
    };
    const tasks = [...get().tasks, newTask];
    set({ tasks });
    setStorage('tasks', tasks);
    
    const taskCount = get().tasks.filter(t => t.planId === taskData.planId).length + 1;
    const completedCount = get().tasks.filter(
      t => t.planId === taskData.planId && t.status === 'completed'
    ).length;
    const progress = Math.round((completedCount / taskCount) * 100);
    
    get().updatePlan(taskData.planId, { progress });
  },

  updateTask: (id, data) => {
    const tasks = get().tasks.map(t =>
      t.id === id ? { ...t, ...data } : t
    );
    set({ tasks });
    setStorage('tasks', tasks);
  },

  updateTaskStatus: (id, status) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    
    const tasks = get().tasks.map(t =>
      t.id === id ? { ...t, status } : t
    );
    set({ tasks });
    setStorage('tasks', tasks);
    
    const planTasks = tasks.filter(t => t.planId === task.planId);
    const completedCount = planTasks.filter(t => t.status === 'completed').length;
    const progress = Math.round((completedCount / planTasks.length) * 100);
    const planStatus = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';
    
    get().updatePlan(task.planId, { progress, status: planStatus });
  },

  selectPlan: (plan) => {
    set({ selectedPlan: plan });
  },
}));
