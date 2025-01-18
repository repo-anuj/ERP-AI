import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/hr/data-table';
import { columns } from '@/components/hr/columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// Placeholder data - will be replaced with MongoDB data
const data = [
  {
    id: '1',
    name: 'John Smith',
    department: 'Engineering',
    role: 'Senior Developer',
    status: 'Active',
    joinDate: '2023-01-15',
    email: 'john.smith@company.com',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    department: 'Marketing',
    role: 'Marketing Manager',
    status: 'Active',
    joinDate: '2023-03-01',
    email: 'sarah.johnson@company.com',
  },
  {
    id: '3',
    name: 'Michael Brown',
    department: 'Sales',
    role: 'Sales Representative',
    status: 'On Leave',
    joinDate: '2023-06-20',
    email: 'michael.brown@company.com',
  },
];

export default function HRPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Human Resources</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">
              +4 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              No change
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Open Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTable columns={columns} data={data} />
    </div>
  );
}