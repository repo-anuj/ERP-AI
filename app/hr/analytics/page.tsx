'use client';

import { HRAnalyticsDashboard } from '@/components/hr/hr-analytics-dashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart } from 'lucide-react';
import Link from 'next/link';

export default function HRAnalyticsPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/hr">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to HR
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
              <BarChart className="h-8 w-8" />
              <span>HR Analytics</span>
            </h1>
            <p className="text-muted-foreground">
              Comprehensive workforce insights and performance metrics
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <HRAnalyticsDashboard />
    </div>
  );
}
