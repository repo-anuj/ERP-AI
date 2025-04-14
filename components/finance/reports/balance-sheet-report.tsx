'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

interface BalanceSheetReportProps {
  data: {
    accounts: Array<{
      id: string;
      name: string;
      type: string;
      balance: number;
      currency: string;
      isAsset: boolean;
    }>;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    assetAllocation: Array<{
      name: string;
      value: number;
      percentage: number;
      color?: string;
    }>;
    liabilityAllocation: Array<{
      name: string;
      value: number;
      percentage: number;
      color?: string;
    }>;
  } | null;
}

// Default colors for the pie chart
const ASSET_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];
const LIABILITY_COLORS = ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'];

export function BalanceSheetReport({ data }: BalanceSheetReportProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Prepare data for the pie charts
  const assetData = data.assetAllocation.map((asset, index) => ({
    name: asset.name,
    value: asset.value,
    color: asset.color || ASSET_COLORS[index % ASSET_COLORS.length],
  }));

  const liabilityData = data.liabilityAllocation.map((liability, index) => ({
    name: liability.name,
    value: liability.value,
    color: liability.color || LIABILITY_COLORS[index % LIABILITY_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(data.totalAssets)}</h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Liabilities</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(data.totalLiabilities)}</h3>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <ArrowDownRight className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Worth</p>
                <h3 className={`text-2xl font-bold mt-1 ${data.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.netWorth)}
                </h3>
              </div>
              <div className={`p-2 rounded-full ${data.netWorth >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {data.netWorth > 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                ) : data.netWorth < 0 ? (
                  <ArrowDownRight className="h-5 w-5 text-red-600" />
                ) : (
                  <ArrowRight className="h-5 w-5 text-gray-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Asset Allocation</h3>
          <div className="h-[300px]">
            {assetData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {assetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No assets available</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Liability Allocation</h3>
          <div className="h-[300px]">
            {liabilityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={liabilityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {liabilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No liabilities available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div>
        <h3 className="text-lg font-medium mb-4">Account Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Account</th>
                <th className="text-left py-2 px-4">Type</th>
                <th className="text-right py-2 px-4">Balance</th>
                <th className="text-left py-2 px-4">Classification</th>
              </tr>
            </thead>
            <tbody>
              {data.accounts.map((account) => (
                <tr key={account.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-4">{account.name}</td>
                  <td className="py-2 px-4 capitalize">{account.type}</td>
                  <td className={`text-right py-2 px-4 ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(account.balance, account.currency)}
                  </td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${account.isAsset ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {account.isAsset ? 'Asset' : 'Liability'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Net Worth */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Total Assets</h3>
          <p className="text-lg font-medium text-green-600">
            {formatCurrency(data.totalAssets)}
          </p>
        </div>
        <div className="flex justify-between items-center mt-2">
          <h3 className="text-lg font-medium">Total Liabilities</h3>
          <p className="text-lg font-medium text-red-600">
            {formatCurrency(data.totalLiabilities)}
          </p>
        </div>
        <div className="flex justify-between items-center mt-4 border-t pt-4">
          <h3 className="text-xl font-bold">Net Worth</h3>
          <p className={`text-xl font-bold ${data.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.netWorth)}
          </p>
        </div>
      </div>
    </div>
  );
}
