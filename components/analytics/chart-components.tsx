'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Scatter,
  ScatterChart,
  ZAxis,
  Treemap,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

// Color schemes
export const CHART_COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d',
  '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57', '#83a6ed', '#8884d8'
];

export const INCOME_COLOR = '#10B981';  // Green for income
export const EXPENSE_COLOR = '#EF4444';  // Red for expenses
export const NEUTRAL_COLOR = '#6366F1';  // Purple for neutral

// Shared tooltip formatter
export const currencyFormatter = (value: number) => formatCurrency(value);
export const percentFormatter = (value: number) => `${value.toFixed(1)}%`;
export const numberFormatter = (value: number) => value.toLocaleString();

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  isLoading?: boolean;
}

export function AnalyticsCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  isLoading = false
}: AnalyticsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-20 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{description}</span>
            {trend && trendValue && (
              <Badge
                variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'outline'}
                className="ml-1"
              >
                {trendValue}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BarChartCardProps {
  title: string;
  description?: string;
  data: any[];
  xAxisKey: string;
  bars: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  isLoading?: boolean;
  height?: number;
  valueFormatter?: (value: number) => string;
}

export function BarChartCard({
  title,
  description,
  data,
  xAxisKey,
  bars,
  isLoading = false,
  height = 300,
  valueFormatter = currencyFormatter
}: BarChartCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </CardHeader>
        <CardContent className={`h-[${height}px]`}>
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={`h-[${height}px]`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis tickFormatter={valueFormatter} />
              <Tooltip formatter={valueFormatter} />
              <Legend />
              {bars.map((bar, index) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  name={bar.name}
                  fill={bar.color || CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface PieChartCardProps {
  title: string;
  description?: string;
  data: any[];
  nameKey: string;
  dataKey: string;
  isLoading?: boolean;
  height?: number;
  valueFormatter?: (value: number) => string;
  colors?: string[];
}

export function PieChartCard({
  title,
  description,
  data,
  nameKey,
  dataKey,
  isLoading = false,
  height = 300,
  valueFormatter = currencyFormatter,
  colors = CHART_COLORS
}: PieChartCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </CardHeader>
        <CardContent className={`h-[${height}px]`}>
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={`h-[${height}px]`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataKey}
                nameKey={nameKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={valueFormatter} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface LineChartCardProps {
  title: string;
  description?: string;
  data: any[];
  xAxisKey: string;
  lines: {
    dataKey: string;
    name: string;
    color: string;
    type?: 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter';
  }[];
  isLoading?: boolean;
  height?: number;
  valueFormatter?: (value: number) => string;
}

export function LineChartCard({
  title,
  description,
  data,
  xAxisKey,
  lines,
  isLoading = false,
  height = 300,
  valueFormatter = currencyFormatter
}: LineChartCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </CardHeader>
        <CardContent className={`h-[${height}px]`}>
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={`h-[${height}px]`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis tickFormatter={valueFormatter} />
              <Tooltip formatter={valueFormatter} />
              <Legend />
              {lines.map((line, index) => (
                <Line
                  key={line.dataKey}
                  type={line.type || "monotone"}
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color || CHART_COLORS[index % CHART_COLORS.length]}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface AreaChartCardProps {
  title: string;
  description?: string;
  data: any[];
  xAxisKey: string;
  areas: {
    dataKey: string;
    name: string;
    color: string;
    stackId?: string;
    fillOpacity?: number;
  }[];
  isLoading?: boolean;
  height?: number;
  valueFormatter?: (value: number) => string;
}

export function AreaChartCard({
  title,
  description,
  data,
  xAxisKey,
  areas,
  isLoading = false,
  height = 300,
  valueFormatter = currencyFormatter
}: AreaChartCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </CardHeader>
        <CardContent className={`h-[${height}px]`}>
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={`h-[${height}px]`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis tickFormatter={valueFormatter} />
              <Tooltip formatter={valueFormatter} />
              <Legend />
              {areas.map((area, index) => (
                <Area
                  key={area.dataKey}
                  type="monotone"
                  dataKey={area.dataKey}
                  name={area.name}
                  stackId={area.stackId}
                  stroke={area.color || CHART_COLORS[index % CHART_COLORS.length]}
                  fill={area.color || CHART_COLORS[index % CHART_COLORS.length]}
                  fillOpacity={area.fillOpacity || 0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface ScatterChartCardProps {
  title: string;
  description?: string;
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  zAxisKey?: string;
  name: string;
  color?: string;
  isLoading?: boolean;
  height?: number;
  xFormatter?: (value: number) => string;
  yFormatter?: (value: number) => string;
}

export function ScatterChartCard({
  title,
  description,
  data,
  xAxisKey,
  yAxisKey,
  zAxisKey,
  name,
  color = CHART_COLORS[0],
  isLoading = false,
  height = 300,
  xFormatter = numberFormatter,
  yFormatter = currencyFormatter
}: ScatterChartCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </CardHeader>
        <CardContent className={`h-[${height}px]`}>
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={`h-[${height}px]`}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={xAxisKey}
                name={xAxisKey}
                tickFormatter={xFormatter}
                type="number"
              />
              <YAxis
                dataKey={yAxisKey}
                name={yAxisKey}
                tickFormatter={yFormatter}
                type="number"
              />
              {zAxisKey && (
                <ZAxis
                  dataKey={zAxisKey}
                  range={[50, 500]}
                  name={zAxisKey}
                />
              )}
              <Tooltip
                formatter={yFormatter}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Legend />
              <Scatter
                name={name}
                data={data}
                fill={color}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface RadarChartCardProps {
  title: string;
  description?: string;
  data: any[];
  dataKeys: {
    key: string;
    name: string;
    color: string;
  }[];
  isLoading?: boolean;
  height?: number;
  valueFormatter?: (value: number) => string;
}

export function RadarChartCard({
  title,
  description,
  data,
  dataKeys,
  isLoading = false,
  height = 300,
  valueFormatter = numberFormatter
}: RadarChartCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </CardHeader>
        <CardContent className={`h-[${height}px]`}>
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={`h-[${height}px]`}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis tickFormatter={valueFormatter} />
              {dataKeys.map((item, index) => (
                <Radar
                  key={item.key}
                  name={item.name}
                  dataKey={item.key}
                  stroke={item.color || CHART_COLORS[index % CHART_COLORS.length]}
                  fill={item.color || CHART_COLORS[index % CHART_COLORS.length]}
                  fillOpacity={0.6}
                />
              ))}
              <Legend />
              <Tooltip formatter={valueFormatter} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface TreemapChartCardProps {
  title: string;
  description?: string;
  data: any[];
  dataKey: string;
  nameKey: string;
  isLoading?: boolean;
  height?: number;
  valueFormatter?: (value: number) => string;
  colors?: string[];
}

export function TreemapChartCard({
  title,
  description,
  data,
  dataKey,
  nameKey,
  isLoading = false,
  height = 300,
  valueFormatter = currencyFormatter,
  colors = CHART_COLORS
}: TreemapChartCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </CardHeader>
        <CardContent className={`h-[${height}px]`}>
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={`h-[${height}px]`}>
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              aspectRatio={4/3}
              stroke="#fff"
              fill="#8884d8"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
              <Tooltip
                formatter={valueFormatter}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded p-2 shadow-md">
                        <p className="font-medium">{data[nameKey]}</p>
                        <p className="text-sm text-muted-foreground">
                          {valueFormatter(data[dataKey])}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
