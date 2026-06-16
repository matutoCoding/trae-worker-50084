import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  label?: string;
}

interface BarChartCardProps {
  title: string;
  data: DataPoint[];
  color?: string;
  unit?: string;
  showValue?: boolean;
  horizontal?: boolean;
}

export const BarChartCard: React.FC<BarChartCardProps> = ({
  title,
  data,
  color = '#3b82f6',
  unit = '',
  showValue = true,
  horizontal = false,
}) => {
  const colors = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-sm text-slate-300">{payload[0].payload.name}</p>
          <p className="text-lg font-bold text-slate-100">
            {payload[0].value.toLocaleString()} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="industrial-card p-5">
      <h3 className="text-sm font-medium text-slate-400 mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            {horizontal ? (
              <>
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={80} />
              </>
            ) : (
              <>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
