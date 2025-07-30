"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { 
  Upload, 
  Download, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Loader2 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImportResult {
  success: boolean;
  created: number;
  skipped: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  createdEmployees: Array<{
    id: string;
    name: string;
    email: string;
    department?: string;
    defaultPassword: string;
  }>;
}

export function BulkEmployeeImport() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("json");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
  // Form states
  const [jsonData, setJsonData] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Sample JSON data
  const sampleJson = {
    employees: [
      {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@company.com",
        phone: "+1234567890",
        position: "Software Engineer",
        department: "Engineering",
        startDate: "2024-01-15",
        salary: 75000,
        employeeId: "EMP001",
        role: "employee",
        contractType: "permanent",
        workType: "full_time",
        jobTitle: "Senior Software Engineer",
        workLocation: "Office",
        personalEmail: "john.personal@gmail.com",
        emergencyContactName: "Jane Doe",
        emergencyContactPhone: "+1234567891",
        emergencyContactRelation: "Spouse"
      },
      {
        firstName: "Sarah",
        lastName: "Smith",
        email: "sarah.smith@company.com",
        phone: "+1234567892",
        position: "Product Manager",
        department: "Product",
        startDate: "2024-02-01",
        salary: 85000,
        employeeId: "EMP002",
        role: "manager",
        contractType: "permanent",
        workType: "full_time",
        jobTitle: "Senior Product Manager",
        workLocation: "Remote"
      }
    ]
  };

  const downloadSample = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(sampleJson, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_sample.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // CSV headers
      const headers = [
        'firstName', 'lastName', 'email', 'phone', 'position', 'department',
        'startDate', 'salary', 'employeeId', 'role', 'contractType', 'workType',
        'jobTitle', 'workLocation', 'personalEmail', 'emergencyContactName',
        'emergencyContactPhone', 'emergencyContactRelation'
      ];
      
      // Sample data
      const rows = sampleJson.employees.map(emp => [
        emp.firstName, emp.lastName, emp.email, emp.phone, emp.position,
        emp.department, emp.startDate, emp.salary, emp.employeeId, emp.role,
        emp.contractType, emp.workType, emp.jobTitle, emp.workLocation,
        emp.personalEmail || '', emp.emergencyContactName || '',
        emp.emergencyContactPhone || '', emp.emergencyContactRelation || ''
      ]);

      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_sample.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have headers and at least one data row');
    
    const headers = lines[0].split(',').map(h => h.trim());
    const employees = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const employee: any = {};
      
      headers.forEach((header, index) => {
        if (values[index]) {
          if (header === 'salary') {
            employee[header] = parseFloat(values[index]);
          } else if (header === 'startDate') {
            employee[header] = values[index];
          } else {
            employee[header] = values[index];
          }
        }
      });
      
      employees.push(employee);
    }
    
    return { employees };
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setImportProgress(0);
      setImportResult(null);

      let data;
      
      if (activeTab === 'json') {
        if (!jsonData.trim()) {
          throw new Error('Please provide JSON data');
        }
        data = JSON.parse(jsonData);
      } else {
        if (!csvFile) {
          throw new Error('Please select a CSV file');
        }
        
        const text = await csvFile.text();
        data = parseCSV(text);
      }

      if (!data.employees || !Array.isArray(data.employees)) {
        throw new Error('Invalid data format. Expected { employees: [...] }');
      }

      if (data.employees.length === 0) {
        throw new Error('No employees found in the data');
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/employees/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const result: ImportResult = await response.json();
      setImportResult(result);

      if (result.success) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.created} employees. ${result.skipped} skipped.`,
        });
      } else {
        toast({
          title: "Import Completed with Errors",
          description: `${result.created} employees created, ${result.errors.length} errors occurred.`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import employees",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setJsonData('');
    setCsvFile(null);
    setImportResult(null);
    setImportProgress(0);
    setActiveTab('json');
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Upload className="h-4 w-4" />
          <span>Bulk Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Bulk Employee Import</span>
          </DialogTitle>
          <DialogDescription>
            Import multiple employees at once using JSON or CSV format
          </DialogDescription>
        </DialogHeader>

        {!importResult ? (
          <div className="space-y-6">
            {/* Sample Downloads */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sample Files</CardTitle>
                <CardDescription>
                  Download sample files to understand the required format
                </CardDescription>
              </CardHeader>
              <CardContent className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSample('json')}
                  className="flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>JSON Sample</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSample('csv')}
                  className="flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>CSV Sample</span>
                </Button>
              </CardContent>
            </Card>

            {/* Import Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="json">JSON Import</TabsTrigger>
                <TabsTrigger value="csv">CSV Import</TabsTrigger>
              </TabsList>

              <TabsContent value="json" className="space-y-4">
                <div>
                  <Label htmlFor="json-data">JSON Data</Label>
                  <Textarea
                    id="json-data"
                    placeholder="Paste your JSON data here..."
                    value={jsonData}
                    onChange={(e) => setJsonData(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="csv" className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  />
                  {csvFile && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Progress */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Importing employees...</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}
          </div>
        ) : (
          /* Results */
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">{importResult.created}</p>
                      <p className="text-sm text-muted-foreground">Created</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{importResult.skipped}</p>
                      <p className="text-sm text-muted-foreground">Skipped</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold text-red-600">{importResult.errors.length}</p>
                      <p className="text-sm text-muted-foreground">Errors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Created Employees */}
            {importResult.createdEmployees.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Successfully Created Employees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {importResult.createdEmployees.map((emp, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-sm text-muted-foreground">{emp.email}</p>
                        </div>
                        <Badge variant="outline">{emp.department || 'No Dept'}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Errors */}
            {importResult.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-red-600">Import Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="p-2 bg-red-50 rounded">
                        <p className="font-medium text-red-800">Row {error.row}: {error.email}</p>
                        <p className="text-sm text-red-600">{error.error}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          {!importResult ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isImporting}
              >
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Employees'
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
