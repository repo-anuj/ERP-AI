'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  Trash2,
  Calendar,
  Plus,
  Clock,
  Mail,
  FileSpreadsheet,
  Check,
  X
} from 'lucide-react';
// Use FileText as base for custom file type icons
import { FileJson } from 'lucide-react';

// Custom icons for file types not available in lucide-react
const FileCsv = (props: any) => (
  <FileText {...props} />
);

const FilePdf = (props: any) => (
  <FileText {...props} />
);
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  useReportingStore,
  reportingService,
  ReportFormat,
  ReportFrequency
} from '@/lib/reporting-service';

interface ReportingProps {
  aggregatedData: any;
  isLoading?: boolean;
}

export function Reporting({ aggregatedData, isLoading = false }: ReportingProps) {
  const [activeTab, setActiveTab] = useState('reports');

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            <CardTitle>Reports & Analytics</CardTitle>
          </div>
        </div>
        <CardDescription>
          Generate, schedule, and manage analytics reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reports">Report Templates</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
            <TabsTrigger value="generated">Generated Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            <ReportDefinitions aggregatedData={aggregatedData} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            <ScheduledReports aggregatedData={aggregatedData} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="generated" className="space-y-4">
            <GeneratedReports />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ReportDefinitions({ aggregatedData, isLoading }: ReportingProps) {
  const { reportDefinitions, addReportDefinition, updateReportDefinition, removeReportDefinition } = useReportingStore();

  const handleGenerateReport = async (reportId: string) => {
    try {
      if (isLoading || !aggregatedData) {
        toast.error('Data is still loading. Please try again later.');
        return;
      }

      toast.promise(
        reportingService.generateReport(reportId, aggregatedData),
        {
          loading: 'Generating report...',
          success: 'Report generated successfully',
          error: 'Failed to generate report'
        }
      );
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Report Templates</h3>
        <ReportDefinitionDialog
          onSave={(report) => {
            addReportDefinition(report);
            toast.success('Report template created');
          }}
        />
      </div>

      {reportDefinitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <FileText className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No report templates</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create templates to generate reports from your analytics data
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportDefinitions.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">{report.name}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {report.modules.map((module) => (
                      <Badge key={module} variant="outline" className="capitalize">
                        {module}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-muted-foreground mr-2">Format:</span>
                    {report.format === ReportFormat.PDF ? (
                      <FilePdf className="h-4 w-4 mr-1 text-red-500" />
                    ) : report.format === ReportFormat.EXCEL ? (
                      <FileSpreadsheet className="h-4 w-4 mr-1 text-green-500" />
                    ) : report.format === ReportFormat.CSV ? (
                      <FileCsv className="h-4 w-4 mr-1 text-blue-500" />
                    ) : (
                      <FileJson className="h-4 w-4 mr-1 text-yellow-500" />
                    )}
                    {report.format.toUpperCase()}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={isLoading}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Generate
                  </Button>
                  <ScheduleReportDialog
                    reportId={report.id}
                    reportName={report.name}
                  />
                </div>
                <div className="flex space-x-2">
                  <ReportDefinitionDialog
                    report={report}
                    onSave={(updates) => {
                      updateReportDefinition(report.id, updates);
                      toast.success('Report template updated');
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={() => {
                      removeReportDefinition(report.id);
                      toast.success('Report template deleted');
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduledReports({ aggregatedData, isLoading }: ReportingProps) {
  const { scheduledReports, updateScheduledReport, removeScheduledReport } = useReportingStore();

  const handleRunNow = async (reportId: string) => {
    try {
      if (isLoading || !aggregatedData) {
        toast.error('Data is still loading. Please try again later.');
        return;
      }

      const report = scheduledReports.find((r) => r.id === reportId);
      if (!report) return;

      toast.promise(
        reportingService.generateReport(report, aggregatedData),
        {
          loading: 'Generating report...',
          success: 'Report generated successfully',
          error: 'Failed to generate report'
        }
      );

      // Update last run date
      updateScheduledReport(reportId, {
        lastRunDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getFrequencyLabel = (frequency: ReportFrequency) => {
    switch (frequency) {
      case ReportFrequency.DAILY:
        return 'Daily';
      case ReportFrequency.WEEKLY:
        return 'Weekly';
      case ReportFrequency.MONTHLY:
        return 'Monthly';
      case ReportFrequency.QUARTERLY:
        return 'Quarterly';
      default:
        return frequency;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Scheduled Reports</h3>
      </div>

      {scheduledReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No scheduled reports</p>
          <p className="text-xs text-muted-foreground mt-1">
            Schedule reports to be generated automatically
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {scheduledReports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-md">{report.name}</CardTitle>
                  <Badge variant={report.enabled ? 'default' : 'outline'}>
                    {report.enabled ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground mr-1">Frequency:</span>
                    {getFrequencyLabel(report.frequency)}
                  </div>

                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground mr-1">Next run:</span>
                    {formatDate(report.nextRunDate)}
                  </div>

                  {report.lastRunDate && (
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground mr-1">Last run:</span>
                      {formatDate(report.lastRunDate)}
                    </div>
                  )}

                  {report.recipients.length > 0 && (
                    <div className="flex items-start text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-muted-foreground mr-1">Recipients:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {report.recipients.map((email, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {email}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunNow(report.id)}
                    disabled={isLoading}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Run Now
                  </Button>
                  <Button
                    variant={report.enabled ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => {
                      updateScheduledReport(report.id, { enabled: !report.enabled });
                      toast.success(`Report ${report.enabled ? 'disabled' : 'enabled'}`);
                    }}
                  >
                    {report.enabled ? (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Disable
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Enable
                      </>
                    )}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={() => {
                    removeScheduledReport(report.id);
                    toast.success('Scheduled report deleted');
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function GeneratedReports() {
  const { generatedReports, removeGeneratedReport, clearGeneratedReports } = useReportingStore();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFormatIcon = (format: ReportFormat) => {
    switch (format) {
      case ReportFormat.PDF:
        return <FilePdf className="h-4 w-4 text-red-500" />;
      case ReportFormat.EXCEL:
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      case ReportFormat.CSV:
        return <FileCsv className="h-4 w-4 text-blue-500" />;
      case ReportFormat.JSON:
        return <FileJson className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Generated Reports</h3>
        {generatedReports.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearGeneratedReports();
              toast.success('All reports cleared');
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {generatedReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8">
          <FileText className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No generated reports</p>
          <p className="text-xs text-muted-foreground mt-1">
            Generate reports from your templates to see them here
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {generatedReports.map((report) => (
              <Card key={report.id} className="flex items-center p-3">
                <div className="mr-3">
                  {getFormatIcon(report.format)}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{report.name}</h4>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>{report.format.toUpperCase()}</span>
                    <span className="mx-1">•</span>
                    <span>{formatFileSize(report.size)}</span>
                    <span className="mx-1">•</span>
                    <span>{formatDate(report.generatedAt)}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => reportingService.downloadReport(report.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={() => {
                      removeGeneratedReport(report.id);
                      toast.success('Report deleted');
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

interface ReportDefinitionDialogProps {
  report?: any;
  onSave: (report: any) => void;
}

function ReportDefinitionDialog({ report, onSave }: ReportDefinitionDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(report?.name || '');
  const [description, setDescription] = useState(report?.description || '');
  const [modules, setModules] = useState<string[]>(report?.modules || ['inventory', 'sales', 'finance']);
  const [metrics, setMetrics] = useState<string[]>(report?.metrics || []);
  const [format, setFormat] = useState<ReportFormat>(report?.format || ReportFormat.PDF);

  const handleSave = () => {
    if (!name) {
      toast.error('Please enter a report name');
      return;
    }

    if (modules.length === 0) {
      toast.error('Please select at least one module');
      return;
    }

    onSave({
      name,
      description,
      modules,
      metrics,
      filters: {},
      format
    });

    setOpen(false);
  };

  const moduleOptions = [
    { id: 'inventory', label: 'Inventory' },
    { id: 'sales', label: 'Sales' },
    { id: 'finance', label: 'Finance' },
    { id: 'employees', label: 'Employees' },
    { id: 'projects', label: 'Projects' }
  ];

  const metricOptions = [
    { id: 'totalItems', label: 'Total Items', module: 'inventory' },
    { id: 'totalValue', label: 'Total Value', module: 'inventory' },
    { id: 'lowStock', label: 'Low Stock', module: 'inventory' },
    { id: 'totalSales', label: 'Total Sales', module: 'sales' },
    { id: 'totalRevenue', label: 'Total Revenue', module: 'sales' },
    { id: 'averageSaleValue', label: 'Average Sale Value', module: 'sales' },
    { id: 'totalIncome', label: 'Total Income', module: 'finance' },
    { id: 'totalExpenses', label: 'Total Expenses', module: 'finance' },
    { id: 'netCashflow', label: 'Net Cashflow', module: 'finance' },
    { id: 'totalEmployees', label: 'Total Employees', module: 'employees' },
    { id: 'departmentCount', label: 'Department Count', module: 'employees' },
    { id: 'totalProjects', label: 'Total Projects', module: 'projects' },
    { id: 'activeProjects', label: 'Active Projects', module: 'projects' }
  ];

  // Filter metric options based on selected modules
  const filteredMetricOptions = metricOptions.filter(
    (metric) => modules.includes(metric.module)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {report ? (
            'Edit'
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              New Template
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{report ? 'Edit Report Template' : 'Create Report Template'}</DialogTitle>
          <DialogDescription>
            Define what data to include in your report and how it should be formatted.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Monthly Sales Report"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="A comprehensive report of monthly sales data"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Modules
            </Label>
            <div className="col-span-3 space-y-2">
              {moduleOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`module-${option.id}`}
                    checked={modules.includes(option.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setModules([...modules, option.id]);
                      } else {
                        setModules(modules.filter((m) => m !== option.id));
                      }
                    }}
                  />
                  <Label htmlFor={`module-${option.id}`}>{option.label}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Metrics
            </Label>
            <div className="col-span-3">
              {modules.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Select modules to see available metrics
                </p>
              ) : filteredMetricOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No metrics available for selected modules
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Leave empty to include all metrics
                  </p>
                  {filteredMetricOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`metric-${option.id}`}
                        checked={metrics.includes(option.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setMetrics([...metrics, option.id]);
                          } else {
                            setMetrics(metrics.filter((m) => m !== option.id));
                          }
                        }}
                      />
                      <Label htmlFor={`metric-${option.id}`}>{option.label}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ReportFormat)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ReportFormat.PDF}>
                  <div className="flex items-center">
                    <FilePdf className="h-4 w-4 mr-2 text-red-500" />
                    PDF
                  </div>
                </SelectItem>
                <SelectItem value={ReportFormat.EXCEL}>
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
                    Excel
                  </div>
                </SelectItem>
                <SelectItem value={ReportFormat.CSV}>
                  <div className="flex items-center">
                    <FileCsv className="h-4 w-4 mr-2 text-blue-500" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value={ReportFormat.JSON}>
                  <div className="flex items-center">
                    <FileJson className="h-4 w-4 mr-2 text-yellow-500" />
                    JSON
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ScheduleReportDialogProps {
  reportId: string;
  reportName: string;
}

function ScheduleReportDialog({ reportId, reportName }: ScheduleReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [frequency, setFrequency] = useState<ReportFrequency>(ReportFrequency.WEEKLY);
  const [recipients, setRecipients] = useState<string>('');

  const handleSchedule = () => {
    const recipientList = recipients
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email);

    try {
      reportingService.scheduleReport(reportId, frequency, recipientList);
      setOpen(false);
    } catch (error) {
      console.error('Error scheduling report:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Calendar className="h-4 w-4 mr-1" />
          Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Report</DialogTitle>
          <DialogDescription>
            Set up automatic generation of "{reportName}"
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="frequency" className="text-right">
              Frequency
            </Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as ReportFrequency)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ReportFrequency.DAILY}>Daily</SelectItem>
                <SelectItem value={ReportFrequency.WEEKLY}>Weekly</SelectItem>
                <SelectItem value={ReportFrequency.MONTHLY}>Monthly</SelectItem>
                <SelectItem value={ReportFrequency.QUARTERLY}>Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="recipients" className="text-right">
              Recipients
            </Label>
            <Textarea
              id="recipients"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="col-span-3"
              placeholder="email@example.com, another@example.com"
              rows={2}
            />
          </div>
          <div className="col-span-4 text-xs text-muted-foreground">
            <p>Enter email addresses separated by commas.</p>
            <p>Leave empty to generate reports without sending emails.</p>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSchedule}>Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
