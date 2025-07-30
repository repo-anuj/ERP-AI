'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  Users,
  Building,
  PieChart,
  BarChart as BarChartIcon,
  Calendar,
  Target
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useToast } from '@/components/ui/use-toast';

interface PayrollAnalyticsProps {
  year: number;
  month?: number;
}

interface PayrollAnalytics {
  summary: {
    totalEmployees: number;
    totalGrossSalary: number;
    totalNetSalary: number;
    totalDeductions: number;
    totalEmployerPF: number;
    totalEmployerESI: number;
    totalProfessionalTax: number;
    totalTDS: number;
    totalBonus: number;
    totalIncentives: number;
    totalOvertime: number;
    totalCTC: number;
  };
  statusBreakdown: Array<{
    status: string;
    count: number;
    totalAmount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    monthName: string;
    employeeCount: number;
    grossSalary: number;
    netSalary: number;
    deductions: number;
    employerContributions: number;
    totalCost: number;
  }>;
  departmentBreakdown: Array<{
    department: string;
    employeeCount: number;
    totalGross: number;
    totalNet: number;
    totalDeductions: number;
    totalCost: number;
  }>;
  topEarners: Array<{
    employeeId: string;
    name: string;
    department: string;
    grossSalary: number;
    netSalary: number;
    deductions: number;
  }>;
  ctcBreakdown: {
    totalGrossSalary: number;
    totalEmployerPF: number;
    totalEmployerESI: number;
    totalBonus: number;
    totalIncentives: number;
    totalOvertime: number;
  };
  period: {
    year: number;
    month?: number;
    monthName: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function PayrollAnalytics({ year, month }: PayrollAnalyticsProps) {
  const [analytics, setAnalytics] = useState<PayrollAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ year: year.toString() });
      if (month) {
        params.append('month', month.toString());
      }

      const response = await fetch(`/api/hr/payroll/analytics?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payroll analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching payroll analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payroll analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [year, month]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <BarChartIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No analytics data</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Process payroll to see analytics.
        </p>
      </div>
    );
  }

  // Prepare CTC breakdown for pie chart
  const ctcData = [
    { name: 'Gross Salary', value: analytics.ctcBreakdown.totalGrossSalary, color: COLORS[0] },
    { name: 'Employer PF', value: analytics.ctcBreakdown.totalEmployerPF, color: COLORS[1] },
    { name: 'Employer ESI', value: analytics.ctcBreakdown.totalEmployerESI, color: COLORS[2] },
    { name: 'Bonus', value: analytics.ctcBreakdown.totalBonus, color: COLORS[3] },
    { name: 'Incentives', value: analytics.ctcBreakdown.totalIncentives, color: COLORS[4] },
  ].filter(item => item.value > 0);

  // Prepare status breakdown for pie chart
  const statusData = analytics.statusBreakdown.map((status, index) => ({
    name: status.status.charAt(0).toUpperCase() + status.status.slice(1),
    value: status.count,
    amount: status.totalAmount,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Period Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payroll Analytics - {analytics.period.monthName}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Processed this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gross Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.summary.totalGrossSalary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Before deductions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Salary</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{analytics.summary.totalNetSalary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              After deductions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total CTC</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.summary.totalCTC.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Cost to Company
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChartIcon className="h-4 w-4" />
              Monthly Payroll Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthName" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="grossSalary" 
                  stackId="1" 
                  stroke={COLORS[0]} 
                  fill={COLORS[0]} 
                  name="Gross Salary"
                />
                <Area 
                  type="monotone" 
                  dataKey="employerContributions" 
                  stackId="1" 
                  stroke={COLORS[1]} 
                  fill={COLORS[1]} 
                  name="Employer Contributions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CTC Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              CTC Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={ctcData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {ctcData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Department-wise Payroll
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.departmentBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
                <Legend />
                <Bar dataKey="totalGross" fill={COLORS[0]} name="Gross Salary" />
                <Bar dataKey="totalNet" fill={COLORS[1]} name="Net Salary" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Payroll Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value} employees (₹${props.payload.amount.toLocaleString()})`, 
                    name
                  ]} 
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Earners Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Earners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.topEarners.slice(0, 10).map((earner, index) => (
              <div key={earner.employeeId} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <div className="font-medium">{earner.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {earner.employeeId} • {earner.department}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600">₹{earner.netSalary.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    Gross: ₹{earner.grossSalary.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Financial Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-green-600 mb-3">Earnings</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Gross Salary:</span>
                  <span>₹{analytics.summary.totalGrossSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bonus:</span>
                  <span>₹{analytics.summary.totalBonus.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Incentives:</span>
                  <span>₹{analytics.summary.totalIncentives.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overtime:</span>
                  <span>₹{analytics.summary.totalOvertime.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-red-600 mb-3">Deductions</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Deductions:</span>
                  <span>₹{analytics.summary.totalDeductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Professional Tax:</span>
                  <span>₹{analytics.summary.totalProfessionalTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>TDS:</span>
                  <span>₹{analytics.summary.totalTDS.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-blue-600 mb-3">Employer Contributions</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Employer PF:</span>
                  <span>₹{analytics.summary.totalEmployerPF.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Employer ESI:</span>
                  <span>₹{analytics.summary.totalEmployerESI.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total CTC:</span>
                  <span>₹{analytics.summary.totalCTC.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
