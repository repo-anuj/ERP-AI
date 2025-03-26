'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Overview } from '@/components/dashboard/overview';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { RecentEmployees } from '@/components/dashboard/recent-employees';
import { TopPerformers } from '@/components/dashboard/top-performers';
import { DashboardCards } from '@/components/dashboard/dashboard-cards';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <div className="p-6">
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <div className="p-6">
            <Skeleton className="h-8 w-1/4 mb-4" />
            <Skeleton className="h-[350px] w-full" />
          </div>
        </Card>
        <Card className="col-span-3">
          <div className="p-6">
            <Skeleton className="h-8 w-1/4 mb-4" />
            <div className="space-y-8">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="ml-4 space-y-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[160px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

export default function Home() {
  const [dashboardData, setDashboardData] = useState<any>({
    employeeCount: 0,
    inventoryCount: 0,
    activeSalesCount: 0,
    totalSales: 0,
    totalRevenue: 0,
    recentSales: [],
    monthlySales: [],
    recentEmployees: [],
    departmentDistribution: [],
    topPerformingEmployees: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard');
        
        if (!res.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await res.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);
  
  const dashboardCardData = {
    revenue: dashboardData.totalRevenue,
    users: dashboardData.employeeCount,
    inventory: dashboardData.inventoryCount,
    projects: dashboardData.activeSalesCount
  };
  
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <DashboardCards data={dashboardCardData} />
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <div className="p-6">
                <div className="flex items-center justify-between space-y-2">
                  <h3 className="text-xl font-semibold">Revenue Overview</h3>
                </div>
                <Overview data={dashboardData.monthlySales} />
              </div>
            </Card>
            <Card className="col-span-3">
              <div className="p-6">
                <div className="flex items-center justify-between space-y-2">
                  <h3 className="text-xl font-semibold">Recent Sales</h3>
                </div>
                <RecentSales data={dashboardData.recentSales} />
              </div>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between space-y-2">
                  <h3 className="text-xl font-semibold">Recent Employees</h3>
                </div>
                <RecentEmployees data={dashboardData.recentEmployees} />
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between space-y-2">
                  <h3 className="text-xl font-semibold">Top Performers</h3>
                </div>
                <TopPerformers data={dashboardData.topPerformingEmployees} />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
