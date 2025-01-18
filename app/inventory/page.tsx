import { DataTable } from '@/components/inventory/data-table';
import { columns } from '@/components/inventory/columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// Placeholder data - will be replaced with MongoDB data
const data = [
  {
    id: '1',
    name: 'Office Chair',
    sku: 'FRN-001',
    category: 'Furniture',
    quantity: 45,
    price: 199.99,
    status: 'In Stock',
    lastUpdated: '2024-03-20',
  },
  {
    id: '2',
    name: 'Laptop Stand',
    sku: 'ACC-002',
    category: 'Accessories',
    quantity: 12,
    price: 49.99,
    status: 'Low Stock',
    lastUpdated: '2024-03-19',
  },
  {
    id: '3',
    name: 'Wireless Mouse',
    sku: 'ACC-003',
    category: 'Accessories',
    quantity: 89,
    price: 29.99,
    status: 'In Stock',
    lastUpdated: '2024-03-18',
  },
];

export default function InventoryPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}