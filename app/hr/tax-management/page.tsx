'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  Search,
  FileText,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  RefreshCw,
  Download,
  FileText as Receipt
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaxCalculationDialog } from '@/components/hr/tax-calculation-dialog';
import { TaxDeclarationDialog } from '@/components/hr/tax-declaration-dialog';
import { TaxCalculationTable } from '@/components/hr/tax-calculation-table';
import { TaxDeclarationTable } from '@/components/hr/tax-declaration-table';
import { Form16Table } from '@/components/hr/form16-table';

interface TaxCalculation {
  id: string;
  financialYear: string;
  taxRegime: 'old' | 'new';
  grossAnnualSalary: number;
  taxableIncome: number;
  totalTaxAfterRebate: number;
  monthlyTds: number;
  calculatedAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    email: string;
    department: {
      id: string;
      name: string;
    };
  };
}

interface TaxDeclaration {
  id: string;
  financialYear: string;
  section80C: number;
  section80D: number;
  taxRegime: 'old' | 'new';
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    email: string;
    department: {
      id: string;
      name: string;
    };
  };
}

interface Form16Record {
  id: string;
  financialYear: string;
  assessmentYear: string;
  form16Data: any;
  generatedAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    email: string;
    panNumber?: string;
    department: {
      id: string;
      name: string;
    };
  };
}

export default function TaxManagementPage() {
  const [taxCalculations, setTaxCalculations] = useState<TaxCalculation[]>([]);
  const [taxDeclarations, setTaxDeclarations] = useState<TaxDeclaration[]>([]);
  const [form16Records, setForm16Records] = useState<Form16Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>('2024-25');
  const [isCalculationDialogOpen, setIsCalculationDialogOpen] = useState(false);
  const [isDeclarationDialogOpen, setIsDeclarationDialogOpen] = useState(false);
  const { toast } = useToast();

  // Generate financial year options
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-based month
  const defaultFinancialYear = currentMonth >= 4 ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}` : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
  
  const financialYearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i;
    return {
      value: `${year}-${(year + 1).toString().slice(-2)}`,
      label: `FY ${year}-${year + 1}`
    };
  });

  // Fetch all tax data
  const fetchTaxData = async () => {
    try {
      setLoading(true);
      
      // Fetch tax calculations
      const calculationsResponse = await fetch(`/api/hr/tax-calculations?financialYear=${selectedFinancialYear}`);
      if (calculationsResponse.ok) {
        const calculations = await calculationsResponse.json();
        setTaxCalculations(calculations);
      }

      // Fetch tax declarations
      const declarationsResponse = await fetch(`/api/hr/tax-declarations?financialYear=${selectedFinancialYear}`);
      if (declarationsResponse.ok) {
        const declarations = await declarationsResponse.json();
        setTaxDeclarations(declarations);
      }

      // Fetch Form 16 records
      const form16Response = await fetch(`/api/hr/form16?financialYear=${selectedFinancialYear}`);
      if (form16Response.ok) {
        const form16s = await form16Response.json();
        setForm16Records(form16s);
      }

    } catch (error) {
      console.error('Error fetching tax data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tax data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedFinancialYear(defaultFinancialYear);
  }, []);

  useEffect(() => {
    if (selectedFinancialYear) {
      fetchTaxData();
    }
  }, [selectedFinancialYear]);

  // Calculate summary statistics
  const totalEmployees = new Set([
    ...taxCalculations.map(tc => tc.employee.id),
    ...taxDeclarations.map(td => td.employee.id),
    ...form16Records.map(f16 => f16.employee.id)
  ]).size;

  const totalTaxLiability = taxCalculations.reduce((sum, tc) => sum + tc.totalTaxAfterRebate, 0);
  const totalMonthlyTds = taxCalculations.reduce((sum, tc) => sum + tc.monthlyTds, 0);
  const pendingDeclarations = taxDeclarations.filter(td => td.status === 'draft' || td.status === 'submitted').length;

  const handleCalculationSuccess = () => {
    fetchTaxData();
    setIsCalculationDialogOpen(false);
  };

  const handleDeclarationSuccess = () => {
    fetchTaxData();
    setIsDeclarationDialogOpen(false);
  };

  const handleGenerateForm16 = async (employeeId: string) => {
    try {
      const assessmentYear = `${parseInt(selectedFinancialYear.split('-')[0]) + 1}-${(parseInt(selectedFinancialYear.split('-')[0]) + 2).toString().slice(-2)}`;
      
      const response = await fetch('/api/hr/form16', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          financialYear: selectedFinancialYear,
          assessmentYear,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Form 16');
      }

      toast({
        title: 'Success',
        description: 'Form 16 generated successfully',
      });

      fetchTaxData();
    } catch (error) {
      console.error('Error generating Form 16:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate Form 16',
        variant: 'destructive',
      });
    }
  };

  const getSelectedFinancialYearLabel = () => {
    const option = financialYearOptions.find(fy => fy.value === selectedFinancialYear);
    return option ? option.label : selectedFinancialYear;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tax Management</h1>
          <p className="text-muted-foreground">
            Manage employee tax calculations, declarations, and Form 16 for {getSelectedFinancialYearLabel()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsDeclarationDialogOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Tax Declaration
          </Button>
          <Button onClick={() => setIsCalculationDialogOpen(true)}>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Tax
          </Button>
        </div>
      </div>

      {/* Financial Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Financial Year
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Financial Year</label>
              <Select value={selectedFinancialYear} onValueChange={setSelectedFinancialYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select financial year" />
                </SelectTrigger>
                <SelectContent>
                  {financialYearOptions.map((fy) => (
                    <SelectItem key={fy.value} value={fy.value}>
                      {fy.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 flex items-end">
              <Button variant="outline" onClick={fetchTaxData} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              With tax records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tax Liability</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalTaxLiability.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Annual tax liability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly TDS</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalMonthlyTds.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total monthly deduction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Declarations</CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingDeclarations}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name, ID, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="calculations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calculations">Tax Calculations</TabsTrigger>
          <TabsTrigger value="declarations">Tax Declarations</TabsTrigger>
          <TabsTrigger value="form16">Form 16</TabsTrigger>
        </TabsList>

        <TabsContent value="calculations">
          <Card>
            <CardHeader>
              <CardTitle>Tax Calculations ({taxCalculations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <TaxCalculationTable
                data={taxCalculations}
                loading={loading}
                searchTerm={searchTerm}
                onRefresh={fetchTaxData}
                onGenerateForm16={handleGenerateForm16}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="declarations">
          <Card>
            <CardHeader>
              <CardTitle>Tax Declarations ({taxDeclarations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <TaxDeclarationTable
                data={taxDeclarations}
                loading={loading}
                searchTerm={searchTerm}
                onRefresh={fetchTaxData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form16">
          <Card>
            <CardHeader>
              <CardTitle>Form 16 Records ({form16Records.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Form16Table
                data={form16Records}
                loading={loading}
                searchTerm={searchTerm}
                onRefresh={fetchTaxData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TaxCalculationDialog
        open={isCalculationDialogOpen}
        onClose={() => setIsCalculationDialogOpen(false)}
        onSuccess={handleCalculationSuccess}
        defaultFinancialYear={selectedFinancialYear}
      />

      <TaxDeclarationDialog
        open={isDeclarationDialogOpen}
        onClose={() => setIsDeclarationDialogOpen(false)}
        onSuccess={handleDeclarationSuccess}
        defaultFinancialYear={selectedFinancialYear}
      />
    </div>
  );
}
