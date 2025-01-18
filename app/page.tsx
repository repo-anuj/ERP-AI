import { Card } from '@/components/ui/card';
import { Overview } from '@/components/dashboard/overview';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { DashboardCards } from '@/components/dashboard/dashboard-cards';

export default function Home() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <DashboardCards />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-2">
              <h3 className="text-xl font-semibold">Overview</h3>
            </div>
            <Overview />
          </div>
        </Card>
        <Card className="col-span-3">
          <div className="p-6">
            <div className="flex items-center justify-between space-y-2">
              <h3 className="text-xl font-semibold">Recent Sales</h3>
            </div>
            <RecentSales />
          </div>
        </Card>
      </div>
    </div>
  );
}