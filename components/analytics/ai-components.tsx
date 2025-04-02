'use client';

import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ReTooltip, 
  Legend,
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  LineChart as ReLineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

// Interfaces
export interface ChartData {
  type: 'bar' | 'pie' | 'line' | 'area';
  title: string;
  data: any[];
  xAxis?: string;
  dataKey: string;
  color?: string;
}

export interface TableData {
  title: string;
  headers: string[];
  rows: string[][];
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#83a6ed'];

// Bar Chart Component
export function BarChartComponent({ chart }: { chart: ChartData }) {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">{chart.title}</h4>
      <ResponsiveContainer width="100%" height={250}>
        <ReBarChart data={chart.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={chart.xAxis} />
          <YAxis />
          <ReTooltip />
          <Legend />
          <Bar dataKey={chart.dataKey} fill={chart.color || '#8884d8'} />
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Pie Chart Component
export function PieChartComponent({ chart }: { chart: ChartData }) {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">{chart.title}</h4>
      <ResponsiveContainer width="100%" height={250}>
        <RePieChart>
          <Pie
            data={chart.data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill={chart.color || '#8884d8'}
            dataKey={chart.dataKey}
          >
            {chart.data.map((entry: any, i: number) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <ReTooltip />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Line Chart Component
export function LineChartComponent({ chart }: { chart: ChartData }) {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">{chart.title}</h4>
      <ResponsiveContainer width="100%" height={250}>
        <ReLineChart data={chart.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={chart.xAxis} />
          <YAxis />
          <ReTooltip />
          <Legend />
          <Line type="monotone" dataKey={chart.dataKey} stroke={chart.color || '#8884d8'} />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Area Chart Component
export function AreaChartComponent({ chart }: { chart: ChartData }) {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">{chart.title}</h4>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chart.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={chart.xAxis} />
          <YAxis />
          <ReTooltip />
          <Area type="monotone" dataKey={chart.dataKey} fill={chart.color || '#8884d8'} stroke={chart.color || '#8884d8'} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Table Component
export function TableComponent({ table }: { table: TableData }) {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">{table.title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {table.headers.map((header, i) => (
                <th key={i} className="text-left p-2 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i} className="border-b hover:bg-muted/30">
                {row.map((cell, j) => (
                  <td key={j} className="p-2">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Visualization Container
export function VisualizationContainer({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="w-full mt-3 rounded-lg p-4 bg-card border">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <div className="space-y-5">
        {children}
      </div>
    </div>
  );
}

// Chart Renderer - Selects the appropriate chart type
export function ChartRenderer({ chart, index }: { chart: ChartData, index: number }) {
  switch (chart.type) {
    case 'bar':
      return <BarChartComponent chart={chart} />;
    case 'pie':
      return <PieChartComponent chart={chart} />;
    case 'line':
      return <LineChartComponent chart={chart} />;
    case 'area':
      return <AreaChartComponent chart={chart} />;
    default:
      return null;
  }
} 