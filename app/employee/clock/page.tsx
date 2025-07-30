'use client';

import { EmployeeClock } from '@/components/hr/employee-clock';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeClockPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/employee">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Time Clock</h2>
            <p className="text-muted-foreground">
              Clock in and out to track your work hours
            </p>
          </div>
        </div>
      </div>

      {/* Employee Clock */}
      <EmployeeClock />
    </div>
  );
}
