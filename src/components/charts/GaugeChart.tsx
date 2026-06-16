import React from 'react';

interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  threshold?: number;
  size?: number;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  max,
  label,
  unit,
  threshold,
  size = 180,
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const angle = (percentage / 100) * 180;
  const radius = size / 2 - 20;
  const center = size / 2;

  const getColor = () => {
    if (threshold) {
      if (value >= threshold) return '#ef4444';
      if (value >= threshold * 0.8) return '#f97316';
    }
    if (percentage >= 80) return '#ef4444';
    if (percentage >= 60) return '#f97316';
    if (percentage >= 40) return '#eab308';
    return '#10b981';
  };

  const color = getColor();

  const createArc = (startAngle: number, endAngle: number, color: string, opacity = 1) => {
    const startRad = (Math.PI * (startAngle - 180)) / 180;
    const endRad = (Math.PI * (endAngle - 180)) / 180;
    
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return (
      <path
        d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        opacity={opacity}
      />
    );
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 30}>
        {createArc(0, 180, '#1e293b', 1)}
        {createArc(0, angle, color, 1)}
        
        {threshold && (
          <line
            x1={center + radius * Math.cos((Math.PI * (threshold / max * 180 - 180)) / 180)}
            y1={center + radius * Math.sin((Math.PI * (threshold / max * 180 - 180)) / 180)}
            x2={center + (radius + 8) * Math.cos((Math.PI * (threshold / max * 180 - 180)) / 180)}
            y2={center + (radius + 8) * Math.sin((Math.PI * (threshold / max * 180 - 180)) / 180)}
            stroke="#f97316"
            strokeWidth="2"
            strokeDasharray="2,2"
          />
        )}

        <text
          x={center}
          y={center - 10}
          textAnchor="middle"
          className="font-display"
          fill="#e2e8f0"
          fontSize="24"
          fontWeight="bold"
        >
          {value.toFixed(1)}
        </text>
        <text
          x={center}
          y={center + 10}
          textAnchor="middle"
          fill="#64748b"
          fontSize="12"
        >
          {unit}
        </text>
      </svg>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
};
