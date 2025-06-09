/**
 * Reporting service for analytics
 * This service handles report generation, scheduling, and export
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
// Import file-saver with type definitions
import { saveAs } from 'file-saver';

// Add type declaration for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Report frequency options
export enum ReportFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}

// Report format options
export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json'
}

// Report definition
export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  modules: string[];
  metrics: string[];
  filters: Record<string, any>;
  format: ReportFormat;
  createdAt: string;
  updatedAt: string;
}

// Scheduled report
export interface ScheduledReport extends ReportDefinition {
  frequency: ReportFrequency;
  nextRunDate: string;
  recipients: string[];
  enabled: boolean;
  lastRunDate?: string;
}

// Generated report
export interface GeneratedReport {
  id: string;
  definitionId: string;
  name: string;
  format: ReportFormat;
  url: string;
  size: number;
  generatedAt: string;
}

// Report store interface
interface ReportingState {
  reportDefinitions: ReportDefinition[];
  scheduledReports: ScheduledReport[];
  generatedReports: GeneratedReport[];
  addReportDefinition: (report: Omit<ReportDefinition, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateReportDefinition: (id: string, updates: Partial<ReportDefinition>) => void;
  removeReportDefinition: (id: string) => void;
  addScheduledReport: (report: Omit<ScheduledReport, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateScheduledReport: (id: string, updates: Partial<ScheduledReport>) => void;
  removeScheduledReport: (id: string) => void;
  addGeneratedReport: (report: Omit<GeneratedReport, 'id' | 'generatedAt'>) => string;
  removeGeneratedReport: (id: string) => void;
  clearGeneratedReports: () => void;
}

// Create reports store with persistence
export const useReportingStore = create<ReportingState>()(
  persist(
    (set) => ({
      reportDefinitions: [],
      scheduledReports: [],
      generatedReports: [],

      // Add a new report definition
      addReportDefinition: (report) => {
        const id = uuidv4();
        const now = new Date().toISOString();

        set((state) => ({
          reportDefinitions: [
            ...state.reportDefinitions,
            {
              id,
              createdAt: now,
              updatedAt: now,
              ...report
            }
          ]
        }));

        return id;
      },

      // Update a report definition
      updateReportDefinition: (id, updates) => set((state) => ({
        reportDefinitions: state.reportDefinitions.map((report) =>
          report.id === id
            ? {
                ...report,
                ...updates,
                updatedAt: new Date().toISOString()
              }
            : report
        )
      })),

      // Remove a report definition
      removeReportDefinition: (id) => set((state) => ({
        reportDefinitions: state.reportDefinitions.filter((report) => report.id !== id)
      })),

      // Add a new scheduled report
      addScheduledReport: (report) => {
        const id = uuidv4();
        const now = new Date().toISOString();

        set((state) => ({
          scheduledReports: [
            ...state.scheduledReports,
            {
              id,
              createdAt: now,
              updatedAt: now,
              ...report
            }
          ]
        }));

        return id;
      },

      // Update a scheduled report
      updateScheduledReport: (id, updates) => set((state) => ({
        scheduledReports: state.scheduledReports.map((report) =>
          report.id === id
            ? {
                ...report,
                ...updates,
                updatedAt: new Date().toISOString()
              }
            : report
        )
      })),

      // Remove a scheduled report
      removeScheduledReport: (id) => set((state) => ({
        scheduledReports: state.scheduledReports.filter((report) => report.id !== id)
      })),

      // Add a generated report
      addGeneratedReport: (report) => {
        const id = uuidv4();

        set((state) => ({
          generatedReports: [
            {
              id,
              generatedAt: new Date().toISOString(),
              ...report
            },
            ...state.generatedReports.slice(0, 19) // Keep only the last 20 reports
          ]
        }));

        return id;
      },

      // Remove a generated report
      removeGeneratedReport: (id) => set((state) => ({
        generatedReports: state.generatedReports.filter((report) => report.id !== id)
      })),

      // Clear all generated reports
      clearGeneratedReports: () => set({ generatedReports: [] })
    }),
    {
      name: 'analytics-reporting-storage',
      partialize: (state) => ({
        reportDefinitions: state.reportDefinitions,
        scheduledReports: state.scheduledReports,
        generatedReports: state.generatedReports
      })
    }
  )
);

// Reporting service class
class ReportingService {
  private static instance: ReportingService;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): ReportingService {
    if (!ReportingService.instance) {
      ReportingService.instance = new ReportingService();
    }
    return ReportingService.instance;
  }

  /**
   * Generate a report from analytics data
   * @param reportDefinition Report definition or ID
   * @param data Analytics data to include in the report
   */
  public async generateReport(
    reportDefinition: string | ReportDefinition,
    data: any
  ): Promise<string> {
    try {
      // Get report definition if ID is provided
      let definition: ReportDefinition;
      if (typeof reportDefinition === 'string') {
        const found = useReportingStore.getState().reportDefinitions.find(
          (r) => r.id === reportDefinition
        );

        if (!found) {
          throw new Error(`Report definition not found: ${reportDefinition}`);
        }

        definition = found;
      } else {
        definition = reportDefinition;
      }

      // Filter data based on report definition
      const filteredData = this.filterDataForReport(data, definition);

      // Generate report in the specified format
      let reportUrl: string;
      let reportSize: number;

      switch (definition.format) {
        case ReportFormat.PDF:
          const pdfResult = await this.generatePdfReport(definition, filteredData);
          reportUrl = pdfResult.url;
          reportSize = pdfResult.size;
          break;

        case ReportFormat.EXCEL:
          const excelResult = await this.generateExcelReport(definition, filteredData);
          reportUrl = excelResult.url;
          reportSize = excelResult.size;
          break;

        case ReportFormat.CSV:
          const csvResult = await this.generateCsvReport(definition, filteredData);
          reportUrl = csvResult.url;
          reportSize = csvResult.size;
          break;

        case ReportFormat.JSON:
          const jsonResult = await this.generateJsonReport(definition, filteredData);
          reportUrl = jsonResult.url;
          reportSize = jsonResult.size;
          break;

        default:
          throw new Error(`Unsupported report format: ${definition.format}`);
      }

      // Add generated report to store
      const reportId = useReportingStore.getState().addGeneratedReport({
        definitionId: definition.id,
        name: definition.name,
        format: definition.format,
        url: reportUrl,
        size: reportSize
      });

      return reportId;
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
      throw error;
    }
  }

  /**
   * Filter analytics data based on report definition
   */
  private filterDataForReport(data: any, definition: ReportDefinition): any {
    const result: any = {};

    // Include only specified modules
    for (const module of definition.modules) {
      if (data[module]) {
        result[module] = { ...data[module] };

        // Apply filters if specified
        if (definition.filters && definition.filters[module]) {
          // Apply module-specific filters (simplified implementation)
          // In a real implementation, this would be more sophisticated
          console.log(`Applying filters for ${module}:`, definition.filters[module]);
        }
      }
    }

    return result;
  }

  /**
   * Generate a PDF report
   */
  private async generatePdfReport(
    definition: ReportDefinition,
    data: any
  ): Promise<{ url: string; size: number }> {
    try {
      // Create a new PDF document
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text(definition.name, 14, 22);

      // Add description
      doc.setFontSize(12);
      doc.text(definition.description || 'Analytics Report', 14, 30);

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);

      let yPosition = 50;

      // Add data for each module
      for (const module of definition.modules) {
        if (data[module]) {
          // Add module header
          doc.setFontSize(14);
          doc.text(module.charAt(0).toUpperCase() + module.slice(1), 14, yPosition);
          yPosition += 10;

          // Add metrics
          if (data[module].metrics) {
            doc.setFontSize(12);
            doc.text('Key Metrics', 14, yPosition);
            yPosition += 8;

            // Create a table for metrics
            const metricsData: any[] = [];

            for (const [key, value] of Object.entries(data[module].metrics)) {
              if (definition.metrics.includes(key) || definition.metrics.length === 0) {
                metricsData.push([
                  key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                  typeof value === 'number' ? value.toLocaleString() : value
                ]);
              }
            }

            if (metricsData.length > 0) {
              // @ts-ignore - jspdf-autotable types are not included
              doc.autoTable({
                startY: yPosition,
                head: [['Metric', 'Value']],
                body: metricsData,
                margin: { left: 14 },
                styles: { fontSize: 10 }
              });

              // @ts-ignore - jspdf-autotable types are not included
              yPosition = doc.lastAutoTable.finalY + 15;
            } else {
              doc.setFontSize(10);
              doc.text('No metrics data available', 14, yPosition);
              yPosition += 10;
            }
          }

          // Add a page break if needed
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
        }
      }

      // Convert the PDF to a data URL
      const pdfDataUrl = doc.output('datauristring');

      // Estimate the size (base64 string length is roughly 4/3 of the binary size)
      const size = Math.round(pdfDataUrl.length * 0.75);

      return {
        url: pdfDataUrl,
        size
      };
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  /**
   * Generate an Excel report
   */
  private async generateExcelReport(
    definition: ReportDefinition,
    data: any
  ): Promise<{ url: string; size: number }> {
    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();

      // Add a worksheet for each module
      for (const module of definition.modules) {
        if (data[module]) {
          // Create worksheet
          const worksheet = workbook.addWorksheet(module.charAt(0).toUpperCase() + module.slice(1));

          // Add header row
          worksheet.addRow(['Metric', 'Value']);

          // Add metrics
          if (data[module].metrics) {
            for (const [key, value] of Object.entries(data[module].metrics)) {
              if (definition.metrics.includes(key) || definition.metrics.length === 0) {
                worksheet.addRow([
                  key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                  value
                ]);
              }
            }
          }
        }
      }

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Create a data URL
      const reader = new FileReader();
      const dataUrlPromise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const dataUrl = await dataUrlPromise;

      return {
        url: dataUrl,
        size: blob.size
      };
    } catch (error) {
      console.error('Error generating Excel report:', error);
      throw new Error('Failed to generate Excel report');
    }
  }

  /**
   * Generate a CSV report
   */
  private async generateCsvReport(
    definition: ReportDefinition,
    data: any
  ): Promise<{ url: string; size: number }> {
    try {
      let csvContent = `"Report: ${definition.name}"\n`;
      csvContent += `"Generated: ${new Date().toLocaleString()}"\n\n`;

      // Add data for each module
      for (const module of definition.modules) {
        if (data[module]) {
          csvContent += `"${module.toUpperCase()}"\n`;
          csvContent += '"Metric","Value"\n';

          // Add metrics
          if (data[module].metrics) {
            for (const [key, value] of Object.entries(data[module].metrics)) {
              if (definition.metrics.includes(key) || definition.metrics.length === 0) {
                const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                csvContent += `"${formattedKey}","${value}"\n`;
              }
            }
          }

          csvContent += '\n';
        }
      }

      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

      // Create a data URL
      const reader = new FileReader();
      const dataUrlPromise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const dataUrl = await dataUrlPromise;

      return {
        url: dataUrl,
        size: blob.size
      };
    } catch (error) {
      console.error('Error generating CSV report:', error);
      throw new Error('Failed to generate CSV report');
    }
  }

  /**
   * Generate a JSON report
   */
  private async generateJsonReport(
    definition: ReportDefinition,
    data: any
  ): Promise<{ url: string; size: number }> {
    try {
      // Create a JSON object with report metadata
      const jsonReport: {
        report: {
          name: string;
          description: string;
          generatedAt: string;
        };
        data: {
          [key: string]: {
            metrics?: {
              [key: string]: any;
            };
          };
        };
      } = {
        report: {
          name: definition.name,
          description: definition.description,
          generatedAt: new Date().toISOString()
        },
        data: {}
      };

      // Add data for each module
      for (const module of definition.modules) {
        if (data[module]) {
          jsonReport.data[module] = {};

          // Add metrics
          if (data[module].metrics) {
            jsonReport.data[module].metrics = {};

            for (const [key, value] of Object.entries(data[module].metrics)) {
              if (definition.metrics.includes(key) || definition.metrics.length === 0) {
                jsonReport.data[module].metrics[key] = value;
              }
            }
          }
        }
      }

      // Convert to JSON string
      const jsonString = JSON.stringify(jsonReport, null, 2);

      // Create a Blob with the JSON content
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Create a data URL
      const reader = new FileReader();
      const dataUrlPromise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const dataUrl = await dataUrlPromise;

      return {
        url: dataUrl,
        size: blob.size
      };
    } catch (error) {
      console.error('Error generating JSON report:', error);
      throw new Error('Failed to generate JSON report');
    }
  }

  /**
   * Download a generated report
   * @param reportId ID of the generated report to download
   */
  public downloadReport(reportId: string): void {
    try {
      const report = useReportingStore.getState().generatedReports.find(
        (r) => r.id === reportId
      );

      if (!report) {
        throw new Error(`Report not found: ${reportId}`);
      }

      // Get file extension based on format
      let extension: string;
      let mimeType: string;

      switch (report.format) {
        case ReportFormat.PDF:
          extension = 'pdf';
          mimeType = 'application/pdf';
          break;

        case ReportFormat.EXCEL:
          extension = 'xlsx';
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        case ReportFormat.CSV:
          extension = 'csv';
          mimeType = 'text/csv';
          break;

        case ReportFormat.JSON:
          extension = 'json';
          mimeType = 'application/json';
          break;

        default:
          throw new Error(`Unsupported report format: ${report.format}`);
      }

      // Convert data URL to Blob
      const byteString = atob(report.url.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);

      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([ab], { type: mimeType });

      // Download the file
      saveAs(blob, `${report.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.${extension}`);

      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  }

  /**
   * Schedule report generation
   * @param reportId ID of the report definition to schedule
   * @param frequency Frequency of report generation
   * @param recipients Email recipients for the report
   */
  public scheduleReport(
    reportId: string,
    frequency: ReportFrequency,
    recipients: string[] = []
  ): string {
    try {
      const reportDefinition = useReportingStore.getState().reportDefinitions.find(
        (r) => r.id === reportId
      );

      if (!reportDefinition) {
        throw new Error(`Report definition not found: ${reportId}`);
      }

      // Calculate next run date based on frequency
      const nextRunDate = this.calculateNextRunDate(frequency);

      // Add scheduled report
      const scheduledReportId = useReportingStore.getState().addScheduledReport({
        ...reportDefinition,
        frequency,
        nextRunDate,
        recipients,
        enabled: true
      });

      toast.success('Report scheduled successfully');

      return scheduledReportId;
    } catch (error) {
      console.error('Error scheduling report:', error);
      toast.error('Failed to schedule report');
      throw error;
    }
  }

  /**
   * Calculate the next run date based on frequency
   */
  private calculateNextRunDate(frequency: ReportFrequency): string {
    const now = new Date();
    let nextRun: Date;

    switch (frequency) {
      case ReportFrequency.DAILY:
        nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0);
        break;

      case ReportFrequency.WEEKLY:
        // Next Monday at 8:00 AM
        const daysUntilMonday = 1 - now.getDay();
        const daysToAdd = daysUntilMonday <= 0 ? daysUntilMonday + 7 : daysUntilMonday;
        nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd, 8, 0, 0);
        break;

      case ReportFrequency.MONTHLY:
        // 1st of next month at 8:00 AM
        nextRun = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0);
        break;

      case ReportFrequency.QUARTERLY:
        // 1st day of next quarter at 8:00 AM
        const currentQuarter = Math.floor(now.getMonth() / 3);
        nextRun = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 1, 8, 0, 0);
        break;

      default:
        nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0);
    }

    return nextRun.toISOString();
  }
}

// Export singleton instance
export const reportingService = ReportingService.getInstance();
