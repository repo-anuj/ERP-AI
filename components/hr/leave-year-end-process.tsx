'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, AlertTriangle, CheckCircle, Calendar, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface LeaveYearEndProcessProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LeaveYearEndProcess({
  open,
  onClose,
  onSuccess,
}: LeaveYearEndProcessProps) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [completed, setCompleted] = useState(false);
  const [processResults, setProcessResults] = useState<any>(null);
  const { toast } = useToast();

  // Process configuration
  const [processConfig, setProcessConfig] = useState({
    fromYear: new Date().getFullYear(),
    toYear: new Date().getFullYear() + 1,
    carryOverEnabled: true,
    maxCarryOverDays: 5,
    encashmentEnabled: false,
    encashmentRate: 1.0,
    resetUnusedLeave: false,
    processAllEmployees: true,
    selectedDepartments: [] as string[],
  });

  const processSteps = [
    'Validating leave balances',
    'Calculating carry over days',
    'Processing encashments',
    'Creating new year balances',
    'Updating employee records',
    'Generating reports',
    'Finalizing process',
  ];

  const handleStartProcess = async () => {
    try {
      setProcessing(true);
      setProgress(0);
      setCompleted(false);
      setProcessResults(null);

      // Simulate year-end process with progress updates
      for (let i = 0; i < processSteps.length; i++) {
        setCurrentStep(processSteps[i]);
        setProgress(((i + 1) / processSteps.length) * 100);
        
        // Simulate API call for each step
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Simulate final results
      const mockResults = {
        totalEmployees: 45,
        processedEmployees: 45,
        totalCarryOver: 127.5,
        totalEncashment: 0,
        newYearBalances: 45,
        errors: [],
      };

      setProcessResults(mockResults);
      setCompleted(true);

      toast({
        title: 'Success',
        description: 'Year-end process completed successfully',
      });

      onSuccess?.();

    } catch (error) {
      console.error('Error processing year-end:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete year-end process',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
      // Reset state
      setProgress(0);
      setCurrentStep('');
      setCompleted(false);
      setProcessResults(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Year-End Leave Process
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!processing && !completed && (
            <>
              {/* Warning */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <div className="font-medium text-orange-800">Important Notice</div>
                  <div className="text-sm text-orange-700 mt-1">
                    This process will finalize leave balances for the current year and create new balances for the next year. 
                    This action cannot be undone. Please ensure all leave applications are processed before proceeding.
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Year</Label>
                    <Select 
                      value={processConfig.fromYear.toString()} 
                      onValueChange={(value) => setProcessConfig(prev => ({ ...prev, fromYear: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 3 }, (_, i) => {
                          const year = new Date().getFullYear() - 1 + i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>To Year</Label>
                    <Select 
                      value={processConfig.toYear.toString()} 
                      onValueChange={(value) => setProcessConfig(prev => ({ ...prev, toYear: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 3 }, (_, i) => {
                          const year = new Date().getFullYear() + i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Carry Over</Label>
                      <p className="text-sm text-muted-foreground">Allow unused leave to carry over to next year</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={processConfig.carryOverEnabled}
                      onChange={(e) =>
                        setProcessConfig(prev => ({ ...prev, carryOverEnabled: e.target.checked }))
                      }
                      className="rounded"
                    />
                  </div>

                  {processConfig.carryOverEnabled && (
                    <div className="space-y-2 ml-6">
                      <Label>Maximum Carry Over Days</Label>
                      <Select 
                        value={processConfig.maxCarryOverDays.toString()} 
                        onValueChange={(value) => setProcessConfig(prev => ({ ...prev, maxCarryOverDays: parseInt(value) }))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 11 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i} days
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Leave Encashment</Label>
                      <p className="text-sm text-muted-foreground">Convert unused leave to cash payment</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={processConfig.encashmentEnabled}
                      onChange={(e) =>
                        setProcessConfig(prev => ({ ...prev, encashmentEnabled: e.target.checked }))
                      }
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Reset Unused Leave</Label>
                      <p className="text-sm text-muted-foreground">Reset all unused leave to zero (no carry over)</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={processConfig.resetUnusedLeave}
                      onChange={(e) =>
                        setProcessConfig(prev => ({ ...prev, resetUnusedLeave: e.target.checked }))
                      }
                      className="rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Process Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Process Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Year Transition:</span>
                    <span className="font-medium">{processConfig.fromYear} → {processConfig.toYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carry Over:</span>
                    <span className="font-medium">
                      {processConfig.carryOverEnabled ? `Max ${processConfig.maxCarryOverDays} days` : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Encashment:</span>
                    <span className="font-medium">
                      {processConfig.encashmentEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reset Unused:</span>
                    <span className="font-medium">
                      {processConfig.resetUnusedLeave ? 'Yes' : 'No'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Processing State */}
          {processing && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium">Processing Year-End...</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Please do not close this window
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{currentStep}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                {processSteps.map((step, index) => {
                  const stepProgress = (index + 1) / processSteps.length * 100;
                  const isCompleted = progress >= stepProgress;
                  const isCurrent = currentStep === step;

                  return (
                    <div key={step} className={`flex items-center gap-2 text-sm ${
                      isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : isCurrent ? (
                        <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                      )}
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completion State */}
          {completed && processResults && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <div className="text-lg font-medium">Year-End Process Completed</div>
                <div className="text-sm text-muted-foreground mt-1">
                  All leave balances have been successfully processed
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Process Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Employees:</span>
                    <span className="font-medium">{processResults.totalEmployees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processed Successfully:</span>
                    <span className="font-medium text-green-600">{processResults.processedEmployees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Carry Over Days:</span>
                    <span className="font-medium">{processResults.totalCarryOver}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Year Balances Created:</span>
                    <span className="font-medium">{processResults.newYearBalances}</span>
                  </div>
                  {processResults.errors.length > 0 && (
                    <div className="flex justify-between">
                      <span>Errors:</span>
                      <span className="font-medium text-red-600">{processResults.errors.length}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={processing}>
              {completed ? 'Close' : 'Cancel'}
            </Button>
            {!processing && !completed && (
              <Button onClick={handleStartProcess}>
                Start Year-End Process
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
