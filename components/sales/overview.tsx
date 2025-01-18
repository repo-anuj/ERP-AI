'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const data = [
  { name: 'Jan', total: 2500 },
  { name: 'Feb', total: 3000 },
  { name: 'Mar', total: 2800 },
  { name: 'Apr', total: 3500 },
  { name: 'May', total: 2900 },
  { name: 'Jun', total: 3800 },
  { name: 'Jul', total: 4000 },
  { name: 'Aug', total: 3700 },
  { name: 'Sep', total: 4200 },
  { name: 'Oct', total: 4500 },
  { name: 'Nov', total: 4800 },
  { name: 'Dec', total: 5000 },
];

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="total"
          stroke="currentColor"
          className="stroke-primary"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}