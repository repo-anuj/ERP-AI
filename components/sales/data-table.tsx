"use client"

import { useEffect, useState } from "react"
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
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowDownUp, 
  ChevronDown, 
  Download, 
  FileDown, 
  Filter, 
  RefreshCw, 
  Search, 
  ShoppingCart, 
  SlidersHorizontal, 
  TrendingUp, 
  X,
  Receipt,
  DollarSign,
  Clock
} from "lucide-react"
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Sale } from "./columns"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  statuses?: string[]
  onRefresh?: () => void
  meta?: {
    updateData: (updatedData: TData[]) => void
  }
}

export function DataTable<TData, TValue>({
  columns,
  data,
  statuses = [],
  onRefresh,
  meta,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    createdAt: false,
  })
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [dateRange, setDateRange] = useState<string>('')

  // Apply status filter
  useEffect(() => {
    if (selectedStatus && selectedStatus !== 'all_statuses') {
      table.getColumn('status')?.setFilterValue(selectedStatus)
    } else {
      table.getColumn('status')?.setFilterValue(undefined)
    }
  }, [selectedStatus])

  // Apply date range filter
  useEffect(() => {
    if (dateRange && dateRange !== 'all_time') {
      // This is a simplified implementation
      // In a real app, you would implement proper date range filtering
      const today = new Date()
      let startDate: Date | null = null
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(today.setHours(0, 0, 0, 0))
          break
        case 'this_week':
          startDate = new Date(today)
          startDate.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
          startDate.setHours(0, 0, 0, 0)
          break
        case 'this_month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1)
          break
        case 'this_quarter':
          const quarter = Math.floor(today.getMonth() / 3)
          startDate = new Date(today.getFullYear(), quarter * 3, 1)
          break
        case 'this_year':
          startDate = new Date(today.getFullYear(), 0, 1)
          break
        default:
          startDate = null
      }
      
      if (startDate) {
        const filterFn = (row: any) => {
          const rowDate = new Date(row.original.date)
          return rowDate >= startDate!
        }
        
        // @ts-ignore - Custom filter function
        table.getColumn('date')?.setFilterValue(filterFn)
      } else {
        table.getColumn('date')?.setFilterValue(undefined)
      }
    } else {
      table.getColumn('date')?.setFilterValue(undefined)
    }
  }, [dateRange])

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
    meta,
  })

  // Get unique statuses from data if not provided
  const uniqueStatuses = statuses.length > 0 
    ? statuses 
    : Array.from(new Set(data.map((item: any) => item.status))).filter(Boolean)

  // Function to export data as CSV
  const exportToCSV = () => {
    // Get columns that have an accessorKey and aren't the actions column
    const exportableColumns = columns.filter((column: any) => {
      return typeof column.accessorKey === 'string' && column.id !== 'actions' && column.id !== 'select'
    })
    
    // Extract headers from exportable columns
    const headers = exportableColumns.map((column: any) => 
      column.header?.toString() || column.accessorKey
    )
    
    // Create rows for each data item
    const rows = data.map((item: any) => 
      exportableColumns.map((column: any) => {
        const key = column.accessorKey as string
        let value = key.includes('.') 
          ? key.split('.').reduce((obj, key) => obj?.[key], item)
          : item[key]
        
        // Format date fields
        if (key === 'date' || key === 'updatedAt' || key === 'createdAt') {
          value = formatDate(value)
        }
        
        // Format price/total
        if (key === 'total' || key === 'tax') {
          value = formatCurrency(value).replace('$', '')
        }
        
        return value
      })
    )
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'sales_data.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate sales stats
  const totalSales = data.length
  const pendingSales = data.filter((item: any) => item.status === 'pending').length
  const completedSales = data.filter((item: any) => item.status === 'completed').length
  const totalRevenue = data.reduce((sum: number, item: any) => sum + item.total, 0)

  return (
    <div className="space-y-6">
      {/* Sales Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold">{totalSales}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingSales}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedSales}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
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
                placeholder="Search invoices, customers..."
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
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger className="w-full sm:w-[180px] h-9">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all_statuses">All Statuses</SelectItem>
                  <SelectSeparator />
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={dateRange}
                onValueChange={setDateRange}
              >
                <SelectTrigger className="w-full sm:w-[180px] h-9">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all_time">All Time</SelectItem>
                  <SelectSeparator />
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="this_quarter">This Quarter</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {(selectedStatus || dateRange || globalFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedStatus('all_statuses');
                  setDateRange('all_time');
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
                      {column.id === 'invoiceNumber' ? 'Invoice #' : 
                       column.id === 'customer.name' ? 'Customer' : 
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
        {(selectedStatus || dateRange) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedStatus && (
              <Badge variant="outline" className="flex items-center gap-1">
                Status: {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setSelectedStatus('all_statuses')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {dateRange && (
              <Badge variant="outline" className="flex items-center gap-1">
                Date: {dateRange.replace('_', ' ').charAt(0).toUpperCase() + dateRange.replace('_', ' ').slice(1)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setDateRange('all_time')}
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
            Showing {table.getFilteredRowModel().rows.length} of {data.length} sales
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
  )
}

// Helper component for the separator in select
const SelectSeparator = () => {
  return <Separator className="my-1" />
}
