import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ShipList } from '@/pages/ships/ShipList';
import { PlanList } from '@/pages/plans/PlanList';
import { HazmatList } from '@/pages/hazmat/HazmatList';
import { MaterialList } from '@/pages/materials/MaterialList';
import { SafetyList } from '@/pages/safety/SafetyList';
import { EnvMonitoring } from '@/pages/env/EnvMonitoring';
import { StatisticsDashboard } from '@/pages/statistics/StatisticsDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/ships" replace />} />
          <Route path="ships" element={<ShipList />} />
          <Route path="plans" element={<PlanList />} />
          <Route path="hazmat" element={<HazmatList />} />
          <Route path="materials" element={<MaterialList />} />
          <Route path="safety" element={<SafetyList />} />
          <Route path="env" element={<EnvMonitoring />} />
          <Route path="statistics" element={<StatisticsDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/ships" replace />} />
      </Routes>
    </Router>
  );
}
