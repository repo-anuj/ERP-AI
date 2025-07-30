'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Calendar, TrendingUp, Plus, RefreshCw, Search, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { LeaveBalanceAdjustment } from './leave-balance-adjustment';

interface EmployeeBalance {
  employee: {
    id: string;
    name: string;
    employeeId: string;
    email: string;
    department?: string;
  };
  balances: Array<{
    id: string;
    leaveType: {
      id: string;
      name: string;
    };
    year: number;
    totalEntitled: number;
    totalUsed: number;
    totalPending: number;
    availableBalance: number;
    carryOver: number;
  }>;
  totalEntitled: number;
  totalUsed: number;
  totalAvailable: number;
}

interface BalanceSummary {
  totalEmployees: number;
  totalEntitledDays: number;
  totalUsedDays: number;
  totalPendingDays: number;
  totalAvailableDays: number;
  utilizationPercentage: number;
}

export function LeaveBalances() {
  const [balances, setBalances] = useState<EmployeeBalance[]>([]);
  const [summary, setSummary] = useState<BalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const { toast } = useToast();

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i;
    return { value: year.toString(), label: year.toString() };
  });

  // Fetch balances
  useEffect(() => {
    fetchBalances();
  }, [selectedYear, selectedDepartment]);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        year: selectedYear,
        ...(selectedDepartment !== 'all' && { departmentId: selectedDepartment }),
      });

      const response = await fetch(`/api/hr/leave/balances?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBalances(data.balances || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leave balances',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter balances based on search term
  const filteredBalances = balances.filter((balance) => {
    const matchesSearch =
      balance.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      balance.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      balance.employee.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalEmployees || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entitled</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary?.totalEntitledDays || 0}</div>
            <p className="text-xs text-muted-foreground">
              Days entitled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary?.totalUsedDays || 0}</div>
            <p className="text-xs text-muted-foreground">
              Days used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary?.totalAvailableDays || 0}</div>
            <p className="text-xs text-muted-foreground">
              Days available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Balances Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Employee Leave Balances</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchBalances}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setIsAdjustmentOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adjust Balance
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {/* TODO: Add department options */}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredBalances.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No leave balances found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Employee leave balances will appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Total Entitled</TableHead>
                  <TableHead>Total Used</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Leave Types</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBalances.map((balance) => {
                  const utilizationPercentage = balance.totalEntitled > 0
                    ? Math.round((balance.totalUsed / balance.totalEntitled) * 100)
                    : 0;

                  return (
                    <TableRow key={balance.employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{balance.employee.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {balance.employee.employeeId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{balance.employee.department || 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{balance.totalEntitled}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{balance.totalUsed}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">{balance.totalAvailable}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-sm">{utilizationPercentage}%</div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {balance.balances.slice(0, 2).map((bal) => (
                            <Badge key={bal.id} variant="outline" className="text-xs">
                              {bal.leaveType.name}: {bal.availableBalance}
                            </Badge>
                          ))}
                          {balance.balances.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{balance.balances.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Balance Adjustment Dialog */}
      <LeaveBalanceAdjustment
        open={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        onSuccess={() => {
          fetchBalances();
          setIsAdjustmentOpen(false);
        }}
      />
    </div>
  );
}
