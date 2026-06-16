import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  threshold?: number;
}

interface LineChartCardProps {
  title: string;
  data: DataPoint[];
  color?: string;
  unit?: string;
  showThreshold?: boolean;
  thresholdValue?: number;
}

export const LineChartCard: React.FC<LineChartCardProps> = ({
  title,
  data,
  color = '#3b82f6',
  unit = '',
  showThreshold = false,
  thresholdValue,
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-sm text-slate-300">{payload[0].payload.name}</p>
          <p className="text-lg font-bold text-slate-100">
            {payload[0].value} {unit}
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
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            {showThreshold && thresholdValue !== undefined && (
              <Line
                type="monotone"
                dataKey={() => thresholdValue}
                stroke="#f97316"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="阈值"
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: '#0f172a' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
