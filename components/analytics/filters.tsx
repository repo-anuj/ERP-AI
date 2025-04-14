'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Download, Filter, ArrowDownToLine, FileJson, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface FilterState {
  startDate?: Date;
  endDate?: Date;
  modules: string[];
  filters: Record<string, any>;
  pagination?: PaginationState;
}

export interface FiltersProps {
  onFilterChange: (filters: FilterState) => void;
  onExport: (format: 'csv' | 'json' | 'pdf') => void;
  isLoading?: boolean;
  data: any;
  initialFilters?: FilterState;
}

const DEFAULT_MODULES = ['inventory', 'sales', 'finance', 'employees', 'projects', 'crossModuleAnalysis'];

export function AnalyticsFilters({
  onFilterChange,
  onExport,
  isLoading,
  data,
  initialFilters
}: FiltersProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialFilters?.startDate || new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialFilters?.endDate || new Date()
  );
  const [selectedModules, setSelectedModules] = useState<string[]>(
    initialFilters?.modules || DEFAULT_MODULES
  );
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.startDate) setStartDate(initialFilters.startDate);
      if (initialFilters.endDate) setEndDate(initialFilters.endDate);
      if (initialFilters.modules) setSelectedModules(initialFilters.modules);
    }
  }, [initialFilters]);

  const handleDatePreset = (preset: string) => {
    const now = new Date();
    let start: Date;

    switch (preset) {
      case 'last7days':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case 'last30days':
        start = new Date(now);
        start.setDate(now.getDate() - 30);
        break;
      case 'last90days':
        start = new Date(now);
        start.setDate(now.getDate() - 90);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'lastYear':
        start = new Date(now.getFullYear() - 1, 0, 1);
        const endLastYear = new Date(now.getFullYear() - 1, 11, 31);
        setEndDate(endLastYear);
        break;
      default:
        start = new Date(now.setMonth(now.getMonth() - 1));
    }

    setStartDate(start);
    if (preset !== 'lastYear') {
      setEndDate(now);
    }
  };

  const toggleModule = (module: string) => {
    setSelectedModules(prev =>
      prev.includes(module)
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
  };

  const formatDate = (date?: Date) => {
    return date ? format(date, 'PPP') : '';
  };

  const applyFilters = () => {
    onFilterChange({
      startDate,
      endDate,
      modules: selectedModules,
      filters: {} // Additional filters can be added here later
    });
    setIsFiltersOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 mb-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Range Selector */}
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal w-[240px]",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate && endDate ? (
                  <>
                    {formatDate(startDate)} - {formatDate(endDate)}
                  </>
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="grid gap-2 p-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDatePreset('last7days')}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDatePreset('last30days')}
                  >
                    Last 30 days
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDatePreset('last90days')}
                  >
                    Last 90 days
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDatePreset('thisYear')}
                  >
                    This year
                  </Button>
                </div>
              </div>
              <div className="border-t border-border p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Calendar
                      id="start-date"
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="end-date">End Date</Label>
                    <Calendar
                      id="end-date"
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Filters */}
        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-4" align="start">
            <div className="space-y-4">
              <h4 className="font-medium">Data Modules</h4>
              <div className="grid gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inventory"
                    checked={selectedModules.includes('inventory')}
                    onCheckedChange={() => toggleModule('inventory')}
                  />
                  <Label htmlFor="inventory">Inventory</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sales"
                    checked={selectedModules.includes('sales')}
                    onCheckedChange={() => toggleModule('sales')}
                  />
                  <Label htmlFor="sales">Sales</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="finance"
                    checked={selectedModules.includes('finance')}
                    onCheckedChange={() => toggleModule('finance')}
                  />
                  <Label htmlFor="finance">Finance</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="employees"
                    checked={selectedModules.includes('employees')}
                    onCheckedChange={() => toggleModule('employees')}
                  />
                  <Label htmlFor="employees">Employees</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="projects"
                    checked={selectedModules.includes('projects')}
                    onCheckedChange={() => toggleModule('projects')}
                  />
                  <Label htmlFor="projects">Projects</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="crossModuleAnalysis"
                    checked={selectedModules.includes('crossModuleAnalysis')}
                    onCheckedChange={() => toggleModule('crossModuleAnalysis')}
                  />
                  <Label htmlFor="crossModuleAnalysis">Cross-Module Analysis</Label>
                </div>
              </div>
              <Button
                className="w-full"
                size="sm"
                onClick={applyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Export Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isLoading || !data}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onExport('csv')}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Export as CSV</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('json')}>
            <FileJson className="mr-2 h-4 w-4" />
            <span>Export as JSON</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport('pdf')}>
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            <span>Export as PDF</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
