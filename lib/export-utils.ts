/**
 * Utility functions for exporting data in various formats
 */

// Helper to flatten nested objects for CSV export
function flattenObject(obj: any, prefix = ''): Record<string, any> {
  return Object.keys(obj).reduce((acc: Record<string, any>, k: string) => {
    const pre = prefix.length ? `${prefix}.` : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else if (Array.isArray(obj[k])) {
      // Handle arrays differently - convert to string representation
      acc[pre + k] = JSON.stringify(obj[k]);
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
}

// Convert JSON data to CSV
export function jsonToCSV(data: any[]): string {
  if (!data || !data.length) return '';
  
  // Flatten objects
  const flattenedData = data.map(item => flattenObject(item));
  
  // Get all potential headers
  const headers = Array.from(
    new Set(
      flattenedData.reduce((headers: string[], obj) => {
        return [...headers, ...Object.keys(obj)];
      }, [])
    )
  );
  
  // Create CSV header row
  let csv = headers.join(',') + '\n';
  
  // Add data rows
  flattenedData.forEach((item) => {
    const row = headers.map(header => {
      const value = item[header] === undefined ? '' : item[header];
      // Escape quotes and wrap values with commas in quotes
      const safeValue = typeof value === 'string' ? 
        `"${value.replace(/"/g, '""')}"` : 
        value;
      return safeValue;
    });
    csv += row.join(',') + '\n';
  });
  
  return csv;
}

// Prepare data for export, potentially pruning large datasets
export function prepareDataForExport(data: any): any {
  // Return different views of the data depending on what's present
  const result: Record<string, any> = {};
  
  // Inventory data
  if (data.inventory) {
    result.inventory = {
      metrics: data.inventory.metrics,
      items: data.inventory.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        status: item.status,
        category: item.category?.name || 'Uncategorized'
      }))
    };
  }
  
  // Sales data
  if (data.sales) {
    result.sales = {
      metrics: data.sales.metrics,
      transactions: data.sales.transactions.map((sale: any) => ({
        id: sale.id,
        date: sale.date,
        customer: sale.customer?.name || 'Unknown',
        amount: sale.total,
        status: sale.status,
        items: sale.items.length
      }))
    };
  }
  
  // Finance data
  if (data.finance) {
    result.finance = {
      metrics: data.finance.metrics,
      transactions: data.finance.transactions.map((transaction: any) => ({
        id: transaction.id,
        date: transaction.date,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category?.name || 'Uncategorized',
        status: transaction.status,
        description: transaction.description
      }))
    };
  }
  
  // Employee data
  if (data.employees) {
    result.employees = {
      metrics: data.employees.metrics,
      employees: data.employees.employees.map((employee: any) => ({
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        status: employee.status,
        startDate: employee.startDate
      }))
    };
  }
  
  // Project data
  if (data.projects) {
    result.projects = {
      metrics: data.projects.metrics,
      projects: data.projects.projects.map((project: any) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        progress: project.progress,
        startDate: project.startDate,
        endDate: project.endDate,
        budget: project.budget
      }))
    };
  }
  
  // Cross-module analysis
  if (data.crossModuleAnalysis) {
    result.crossModuleAnalysis = data.crossModuleAnalysis;
  }
  
  return result;
}

// Helper to export data as JSON
export function exportAsJSON(data: any): void {
  const prepared = prepareDataForExport(data);
  const jsonString = JSON.stringify(prepared, null, 2);
  downloadFile(jsonString, 'analytics-export.json', 'application/json');
}

// Helper to export data as CSV (handles multiple tables)
export function exportAsCSV(data: any): void {
  const prepared = prepareDataForExport(data);
  
  // Generate a ZIP file with multiple CSVs
  // For simplicity in this example, we'll just export the first available data array
  let csvData = '';
  
  if (prepared.inventory?.items?.length) {
    csvData = jsonToCSV(prepared.inventory.items);
    downloadFile(csvData, 'inventory-export.csv', 'text/csv');
  } else if (prepared.sales?.transactions?.length) {
    csvData = jsonToCSV(prepared.sales.transactions);
    downloadFile(csvData, 'sales-export.csv', 'text/csv');
  } else if (prepared.finance?.transactions?.length) {
    csvData = jsonToCSV(prepared.finance.transactions);
    downloadFile(csvData, 'finance-export.csv', 'text/csv');
  } else if (prepared.employees?.employees?.length) {
    csvData = jsonToCSV(prepared.employees.employees);
    downloadFile(csvData, 'employees-export.csv', 'text/csv');
  } else if (prepared.projects?.projects?.length) {
    csvData = jsonToCSV(prepared.projects.projects);
    downloadFile(csvData, 'projects-export.csv', 'text/csv');
  }
}

// Helper to download files
export function downloadFile(content: string, fileName: string, contentType: string): void {
  if (typeof window === 'undefined') return;
  
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}
