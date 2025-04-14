'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyAnalytics } from '@/components/analytics/empty-state';
import { AIAssistant } from '@/components/analytics/ai-assistant';
import { RealtimeDashboard } from '@/components/analytics/realtime-dashboard';
import { AnalyticsFilters, FilterState } from '@/components/analytics/filters';
// import { PaginationControls } from '@/components/analytics/pagination-controls';
import { InventoryAnalytics } from '@/components/analytics/inventory-analytics';
import { SalesAnalytics } from '@/components/analytics/sales-analytics';
import { FinanceAnalytics } from '@/components/analytics/finance-analytics';
import { CrossModuleAnalytics } from '@/components/analytics/cross-module-analytics';
import { Reporting } from '@/components/analytics/reporting';
import { NotificationsPopover } from '@/components/analytics/notifications';
import { exportAsCSV, exportAsJSON } from '@/lib/export-utils';
import { LoadingIndicator } from '@/components/analytics/loading-indicator';
// import { websocketService } from '@/lib/websocket-service';
import { alertsService } from '@/lib/alerts-service';
// import { reportingService } from '@/lib/reporting-service';

// Import existing chart components from the current analytics page
// (We'll reuse the existing visualization components)

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [aggregatedData, setAggregatedData] = useState<any>(null);

  // Use a ref to store the current filter state without triggering rerenders
  const filtersRef = useRef<FilterState>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    modules: ['inventory', 'sales', 'finance', 'employees', 'projects', 'crossModuleAnalysis'],
    filters: {},
    pagination: {
      page: 1,
      pageSize: 50
    }
  });

  // State for UI display of filters (doesn't trigger data fetching)
  const [displayFilters, setDisplayFilters] = useState<FilterState>(filtersRef.current);

  // Function to fetch data with filters - removed filters from dependency array
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Get filters from ref instead of state
      const currentFilters = filtersRef.current;

      // Prepare filters for API request
      const apiFilters = {
        dateRange: {
          startDate: currentFilters.startDate?.toISOString(),
          endDate: currentFilters.endDate?.toISOString()
        },
        modules: currentFilters.modules,
        filters: currentFilters.filters,
        pagination: currentFilters.pagination || { page: 1, pageSize: 50 }
      };

      // Call our new consolidated API endpoint
      const response = await fetch('/api/analytics/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiFilters),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      console.log('Fetched Analytics Data:', JSON.stringify(data, null, 2));
      setAggregatedData(data);

      // Check if we have meaningful data
      setHasData(checkForData(data));

      // Show success toast on manual refresh
      if (isRefresh) {
        toast.success('Analytics data refreshed');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []); // Remove filters dependency

  // Check if data contains meaningful values
  const checkForData = (data: any) => {
    if (!data) return false;

    // Check for data in each module
    const hasInventory = data.inventory?.items?.length > 0;
    const hasSales = data.sales?.transactions?.length > 0;
    const hasFinance = data.finance?.transactions?.length > 0;
    const hasEmployees = data.employees?.employees?.length > 0;
    const hasProjects = data.projects?.projects?.length > 0;

    return hasInventory || hasSales || hasFinance || hasEmployees || hasProjects;
  };

  // Fetch data and initialize services on mount
  useEffect(() => {
    // Initialize services
    alertsService.init();

    // Fetch initial data
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs once on mount

  // Function to update filters and trigger data fetch
  const applyFilters = useCallback((newFilters: FilterState) => {
    // Update the ref
    filtersRef.current = newFilters;
    // Update display state for UI
    setDisplayFilters(newFilters);
    // Fetch data with new filters
    fetchData(false);
  }, [fetchData]);

  // Handle filter changes without triggering immediate data fetch
  const handleFilterChange = (newFilters: FilterState) => {
    // Only update the display filters for UI, don't trigger API call
    setDisplayFilters(newFilters);
    // Update the ref
    filtersRef.current = newFilters;
  };

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    const newFilters = { ...filtersRef.current };
    if (!newFilters.pagination) {
      newFilters.pagination = { page: 1, pageSize: 50 };
    }
    newFilters.pagination.page = page;
    filtersRef.current = newFilters;
    setDisplayFilters(newFilters);
    fetchData(false);
  };

  // Handle page size changes
  const handlePageSizeChange = (pageSize: number) => {
    const newFilters = { ...filtersRef.current };
    if (!newFilters.pagination) {
      newFilters.pagination = { page: 1, pageSize: 50 };
    }
    newFilters.pagination.pageSize = pageSize;
    newFilters.pagination.page = 1; // Reset to first page when changing page size
    filtersRef.current = newFilters;
    setDisplayFilters(newFilters);
    fetchData(false);
  };

  // Handle exports
  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    if (!aggregatedData) {
      toast.error('No data to export');
      return;
    }

    try {
      switch (format) {
        case 'csv':
          exportAsCSV(aggregatedData);
          toast.success('Data exported as CSV');
          break;
        case 'json':
          exportAsJSON(aggregatedData);
          toast.success('Data exported as JSON');
          break;
        case 'pdf':
          toast.info('PDF export is coming soon');
          break;
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchData(true);
    toast.success('Analytics data refreshed');
  };

  // Clear analytics cache
  const handleClearCache = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/analytics/cache', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear cache');
      }

      toast.success('Analytics cache cleared');
      fetchData(true);
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Template for empty data state
  const EmptyState = () => {
    return <EmptyAnalytics onRefresh={handleRefresh} />;
  };

  // Loading skeleton for the dashboard
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-20 mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="h-80">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="h-80">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Track your business performance with advanced analytics
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleClearCache}
            variant="outline"
            disabled={isLoading || isRefreshing}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Cache
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Loading indicator */}
      <LoadingIndicator
        isLoading={isLoading || isRefreshing}
        message={isRefreshing ? 'Refreshing data...' : 'Loading analytics data...'}
        className="my-2"
      />

      {/* Header with Notifications */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center space-x-2">
          <NotificationsPopover />
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 mb-4">
        <AnalyticsFilters
          onFilterChange={handleFilterChange}
          onExport={handleExport}
          isLoading={isLoading || isRefreshing}
          data={aggregatedData}
          initialFilters={displayFilters}
        />
        <Button
          onClick={() => applyFilters(filtersRef.current)}
          variant="default"
          size="sm"
          disabled={isLoading || isRefreshing}
        >
          Apply Filters
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="crossModuleAnalysis">Cross-Module</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : !hasData ? (
            <EmptyState />
          ) : (
            <>
              {/* Key Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${aggregatedData?.sales?.metrics?.totalRevenue?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From {aggregatedData?.sales?.transactions?.length || 0} sales
                    </p>
                  </CardContent>
                </Card>

                {/* Inventory Value Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${aggregatedData?.inventory?.metrics?.totalValue?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {aggregatedData?.inventory?.metrics?.totalItems || 0} items
                    </p>
                  </CardContent>
                </Card>

                {/* Net Profit Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${aggregatedData?.finance?.metrics?.netProfit?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {aggregatedData?.finance?.metrics?.netProfit >= 0 ? '+' : ''}
                      {aggregatedData?.finance?.metrics?.netProfit /
                        (aggregatedData?.finance?.metrics?.totalIncome || 1) * 100}% margin
                    </p>
                  </CardContent>
                </Card>

                {/* Active Projects Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {aggregatedData?.projects?.metrics?.activeProjects || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Out of {aggregatedData?.projects?.metrics?.totalProjects || 0} projects
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Cross-module analysis charts and tables would go here */}
              {/* This would be similar to the existing dashboard but with data from our consolidated API */}
              {/* For brevity, I'm not including all the visualization components, but they would be similar */}
              {/* to what's already in the existing analytics page */}

              {/* Realtime Dashboard Integration */}
              <RealtimeDashboard
                data={aggregatedData}
                isLoading={isLoading || isRefreshing}
                onRefresh={handleRefresh}
              />
            </>
          )}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : !hasData || !aggregatedData?.inventory?.items?.length ? (
            <EmptyState />
          ) : (
            <InventoryAnalytics
              data={aggregatedData.inventory}
              isLoading={isLoading || isRefreshing}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : !hasData || !aggregatedData?.sales?.transactions?.length ? (
            <EmptyState />
          ) : (
            <SalesAnalytics
              data={aggregatedData.sales}
              isLoading={isLoading || isRefreshing}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance" className="space-y-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : !hasData || !aggregatedData?.finance?.transactions?.length ? (
            <EmptyState />
          ) : (
            <FinanceAnalytics
              data={aggregatedData.finance}
              isLoading={isLoading || isRefreshing}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </TabsContent>

        {/* Cross-Module Analysis Tab */}
        <TabsContent value="crossModuleAnalysis" className="space-y-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : !hasData ? (
            <EmptyState />
          ) : (
            <CrossModuleAnalytics
              data={aggregatedData}
              isLoading={isLoading || isRefreshing}
            />
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : !hasData ? (
            <EmptyState />
          ) : (
            <Reporting
              aggregatedData={aggregatedData}
              isLoading={isLoading || isRefreshing}
            />
          )}
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai" className="space-y-4">
          <AIAssistant
            aggregatedData={aggregatedData}
            isLoading={isLoading || isRefreshing}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
