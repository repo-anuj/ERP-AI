'use client';

import { useEffect, useState } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  ArrowDownUp, 
  ChevronDown, 
  Download, 
  FileDown, 
  Filter, 
  Package, 
  RefreshCw, 
  Search, 
  SlidersHorizontal, 
  X 
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  categories?: string[];
  onRefresh?: () => void;
  meta?: {
    updateData: (updatedData: TData[]) => void;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  categories = [],
  onRefresh,
  meta,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    createdAt: false,
  });
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Apply category filter
  useEffect(() => {
    if (selectedCategory && selectedCategory !== '_all') {
      table.getColumn('category')?.setFilterValue(selectedCategory);
    } else {
      table.getColumn('category')?.setFilterValue(undefined);
    }
  }, [selectedCategory]);

  // Apply status filter
  useEffect(() => {
    if (selectedStatus && selectedStatus !== '_all') {
      table.getColumn('status')?.setFilterValue(selectedStatus);
    } else {
      table.getColumn('status')?.setFilterValue(undefined);
    }
  }, [selectedStatus]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination: {
        pageSize: rowsPerPage,
        pageIndex: 0,
      },
    },
  });

  // Get unique statuses from data
  const statuses = Array.from(
    new Set(data.map((item: any) => item.status))
  ).filter(Boolean);

  // Function to export data as CSV
  const exportToCSV = () => {
    // Get columns that have an accessorKey and aren't the actions column
    const exportableColumns = columns.filter((column: any) => {
      return typeof column.accessorKey === 'string' && column.accessorKey !== 'actions';
    });
    
    // Extract headers from exportable columns
    const headers = exportableColumns.map((column: any) => 
      column.header?.toString() || column.accessorKey
    );
    
    // Create rows for each data item
    const rows = data.map((item: any) => 
      exportableColumns.map((column: any) => {
        const key = column.accessorKey as string;
        let value = item[key];
        
        // Format date fields
        if (key === 'updatedAt' || key === 'createdAt') {
          value = new Date(value).toLocaleDateString();
        }
        
        // Format price
        if (key === 'price') {
          value = `$${parseFloat(value).toFixed(2)}`;
        }
        
        return value;
      })
    );
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventory_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate inventory stats
  const totalItems = data.length;
  const lowStockItems = data.filter((item: any) => item.status === 'Low Stock').length;
  const outOfStockItems = data.filter((item: any) => item.status === 'Out of Stock').length;
  const totalValue = data.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

  return (
    <div className="space-y-6">
      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
              <p className="text-2xl font-bold">{lowStockItems}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold">{outOfStockItems}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <ArrowDownUp className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-start sm:items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, SKUs..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-8"
              />
              {globalFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-2"
                  onClick={() => setGlobalFilter('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full sm:w-[180px] h-9">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="_all">All Categories</SelectItem>
                  <SelectSeparator />
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger className="w-full sm:w-[180px] h-9">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="_all">All Statuses</SelectItem>
                  <SelectSeparator />
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {(selectedCategory || selectedStatus || globalFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory('_all');
                  setSelectedStatus('_all');
                  setGlobalFilter('');
                }}
                className="h-9"
              >
                Clear Filters
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table.getAllColumns()
                  .filter(column => column.getCanHide())
                  .map(column => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id === 'name' ? 'Product' : 
                       column.id === 'updatedAt' ? 'Last Updated' : 
                       column.id === 'createdAt' ? 'Created At' : 
                       column.id.charAt(0).toUpperCase() + column.id.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 gap-1"
                    onClick={exportToCSV}
                  >
                    <FileDown className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export to CSV</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {onRefresh && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 w-9 p-0"
                      onClick={onRefresh}
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="sr-only">Refresh</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        
        {/* Active filters display */}
        {(selectedCategory || selectedStatus) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedCategory && (
              <Badge variant="outline" className="flex items-center gap-1">
                Category: {selectedCategory}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setSelectedCategory('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {selectedStatus && (
              <Badge variant="outline" className="flex items-center gap-1">
                Status: {selectedStatus}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setSelectedStatus('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </div>
      
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder ? null : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {table.getFilteredRowModel().rows.length} of {data.length} items
          </p>
          <Select
            value={rowsPerPage.toString()}
            onValueChange={(value) => {
              setRowsPerPage(parseInt(value));
              table.setPageSize(parseInt(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={rowsPerPage} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
              const pageIndex = i;
              const isCurrentPage = pageIndex === table.getState().pagination.pageIndex;
              
              return (
                <Button
                  key={i}
                  variant={isCurrentPage ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => table.setPageIndex(pageIndex)}
                >
                  {pageIndex + 1}
                </Button>
              );
            })}
            
            {table.getPageCount() > 5 && (
              <>
                <span className="text-muted-foreground">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                >
                  {table.getPageCount()}
                </Button>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper component for the separator in select
const SelectSeparator = () => {
  return <Separator className="my-1" />;
};
