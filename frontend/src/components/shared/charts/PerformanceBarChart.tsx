import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PerformanceBarChartProps {
  data: { name: string; screenings: number; refers: number }[];
  screeningsColor?: string;
  height?: number;
}

export function PerformanceBarChart({
  data,
  screeningsColor = '#2563eb',
  height = 300,
}: PerformanceBarChartProps) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: 'transparent' }} />
          <Legend />
          <Bar
            dataKey="screenings"
            fill={screeningsColor}
            name="Screenings"
            radius={[4, 4, 0, 0]}
          />
          <Bar dataKey="refers" fill="#ef4444" name="Refers" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
