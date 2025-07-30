'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Clock, 
  AlertTriangle, 
  Shield,
  Save,
  RotateCcw,
  Info
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AttendancePolicy {
  id?: string;
  // Working Hours
  standardWorkingHours: number;
  workingDaysPerWeek: number;
  weekStartDay: string;
  
  // Timing Rules
  graceTimeMinutes: number;
  lateMarkAfterMinutes: number;
  halfDayThresholdHours: number;
  minimumWorkingHours: number;
  
  // Overtime Rules
  overtimeEnabled: boolean;
  overtimeThresholdHours: number;
  overtimeMultiplier: number;
  maxOvertimeHoursPerDay: number;
  maxOvertimeHoursPerMonth: number;
  
  // Break Rules
  breakTimeEnabled: boolean;
  breakDurationMinutes: number;
  maxBreaksPerDay: number;
  unpaidBreakThresholdMinutes: number;
  
  // Location Rules
  locationTrackingEnabled: boolean;
  allowedLocations: string[];
  locationRadiusMeters: number;
  
  // Approval Rules
  manualAttendanceRequiresApproval: boolean;
  lateEntryRequiresApproval: boolean;
  earlyExitRequiresApproval: boolean;
  
  // Notifications
  lateArrivalNotification: boolean;
  absenteeNotification: boolean;
  overtimeNotification: boolean;
  
  // Compliance
  complianceMode: string;
  auditTrailEnabled: boolean;
  dataRetentionDays: number;
}

export function AttendancePolicyManagement() {
  const [policy, setPolicy] = useState<AttendancePolicy>({
    standardWorkingHours: 8,
    workingDaysPerWeek: 5,
    weekStartDay: 'monday',
    graceTimeMinutes: 15,
    lateMarkAfterMinutes: 30,
    halfDayThresholdHours: 4,
    minimumWorkingHours: 6,
    overtimeEnabled: true,
    overtimeThresholdHours: 8,
    overtimeMultiplier: 1.5,
    maxOvertimeHoursPerDay: 4,
    maxOvertimeHoursPerMonth: 40,
    breakTimeEnabled: true,
    breakDurationMinutes: 60,
    maxBreaksPerDay: 2,
    unpaidBreakThresholdMinutes: 90,
    locationTrackingEnabled: false,
    allowedLocations: [],
    locationRadiusMeters: 100,
    manualAttendanceRequiresApproval: true,
    lateEntryRequiresApproval: false,
    earlyExitRequiresApproval: true,
    lateArrivalNotification: true,
    absenteeNotification: true,
    overtimeNotification: true,
    complianceMode: 'standard',
    auditTrailEnabled: true,
    dataRetentionDays: 365,
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // Load existing policy
  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const response = await fetch('/api/hr/attendance/policy');
      if (response.ok) {
        const data = await response.json();
        setPolicy(data);
      }
    } catch (error) {
      console.error('Error fetching policy:', error);
    }
  };

  // Save policy
  const handleSavePolicy = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hr/attendance/policy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policy),
      });

      if (!response.ok) {
        throw new Error('Failed to save policy');
      }

      toast({
        title: 'Success',
        description: 'Attendance policy saved successfully',
      });

      setHasChanges(false);
    } catch (error) {
      console.error('Error saving policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to save attendance policy',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset to defaults
  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setPolicy({
        standardWorkingHours: 8,
        workingDaysPerWeek: 5,
        weekStartDay: 'monday',
        graceTimeMinutes: 15,
        lateMarkAfterMinutes: 30,
        halfDayThresholdHours: 4,
        minimumWorkingHours: 6,
        overtimeEnabled: true,
        overtimeThresholdHours: 8,
        overtimeMultiplier: 1.5,
        maxOvertimeHoursPerDay: 4,
        maxOvertimeHoursPerMonth: 40,
        breakTimeEnabled: true,
        breakDurationMinutes: 60,
        maxBreaksPerDay: 2,
        unpaidBreakThresholdMinutes: 90,
        locationTrackingEnabled: false,
        allowedLocations: [],
        locationRadiusMeters: 100,
        manualAttendanceRequiresApproval: true,
        lateEntryRequiresApproval: false,
        earlyExitRequiresApproval: true,
        lateArrivalNotification: true,
        absenteeNotification: true,
        overtimeNotification: true,
        complianceMode: 'standard',
        auditTrailEnabled: true,
        dataRetentionDays: 365,
      });
      setHasChanges(true);
    }
  };

  const updatePolicy = (field: keyof AttendancePolicy, value: any) => {
    setPolicy(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Attendance Policy Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure attendance rules, overtime policies, and compliance settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSavePolicy} disabled={loading || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Policy
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Don't forget to save your policy configuration.
          </AlertDescription>
        </Alert>
      )}

      {/* Policy Configuration Tabs */}
      <Tabs defaultValue="working-hours" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="working-hours">Working Hours</TabsTrigger>
          <TabsTrigger value="overtime">Overtime</TabsTrigger>
          <TabsTrigger value="breaks">Breaks</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="working-hours">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Working Hours Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="standardWorkingHours">Standard Working Hours per Day</Label>
                  <Input
                    id="standardWorkingHours"
                    type="number"
                    min="1"
                    max="24"
                    value={policy.standardWorkingHours}
                    onChange={(e) => updatePolicy('standardWorkingHours', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workingDaysPerWeek">Working Days per Week</Label>
                  <Input
                    id="workingDaysPerWeek"
                    type="number"
                    min="1"
                    max="7"
                    value={policy.workingDaysPerWeek}
                    onChange={(e) => updatePolicy('workingDaysPerWeek', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weekStartDay">Week Start Day</Label>
                  <Select value={policy.weekStartDay} onValueChange={(value) => updatePolicy('weekStartDay', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumWorkingHours">Minimum Working Hours</Label>
                  <Input
                    id="minimumWorkingHours"
                    type="number"
                    min="1"
                    max="24"
                    value={policy.minimumWorkingHours}
                    onChange={(e) => updatePolicy('minimumWorkingHours', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Late Arrival Rules</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="graceTimeMinutes">Grace Time (minutes)</Label>
                    <Input
                      id="graceTimeMinutes"
                      type="number"
                      min="0"
                      max="60"
                      value={policy.graceTimeMinutes}
                      onChange={(e) => updatePolicy('graceTimeMinutes', Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lateMarkAfterMinutes">Mark Late After (minutes)</Label>
                    <Input
                      id="lateMarkAfterMinutes"
                      type="number"
                      min="0"
                      max="120"
                      value={policy.lateMarkAfterMinutes}
                      onChange={(e) => updatePolicy('lateMarkAfterMinutes', Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="halfDayThresholdHours">Half Day Threshold (hours)</Label>
                    <Input
                      id="halfDayThresholdHours"
                      type="number"
                      min="1"
                      max="12"
                      value={policy.halfDayThresholdHours}
                      onChange={(e) => updatePolicy('halfDayThresholdHours', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overtime">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Overtime Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="overtimeEnabled"
                  checked={policy.overtimeEnabled}
                  onCheckedChange={(checked) => updatePolicy('overtimeEnabled', checked)}
                />
                <Label htmlFor="overtimeEnabled">Enable Overtime Tracking</Label>
              </div>

              {policy.overtimeEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="overtimeThresholdHours">Overtime Threshold (hours)</Label>
                    <Input
                      id="overtimeThresholdHours"
                      type="number"
                      min="1"
                      max="24"
                      value={policy.overtimeThresholdHours}
                      onChange={(e) => updatePolicy('overtimeThresholdHours', Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="overtimeMultiplier">Overtime Pay Multiplier</Label>
                    <Input
                      id="overtimeMultiplier"
                      type="number"
                      min="1"
                      max="3"
                      step="0.1"
                      value={policy.overtimeMultiplier}
                      onChange={(e) => updatePolicy('overtimeMultiplier', Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxOvertimeHoursPerDay">Max Overtime per Day (hours)</Label>
                    <Input
                      id="maxOvertimeHoursPerDay"
                      type="number"
                      min="1"
                      max="12"
                      value={policy.maxOvertimeHoursPerDay}
                      onChange={(e) => updatePolicy('maxOvertimeHoursPerDay', Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxOvertimeHoursPerMonth">Max Overtime per Month (hours)</Label>
                    <Input
                      id="maxOvertimeHoursPerMonth"
                      type="number"
                      min="1"
                      max="200"
                      value={policy.maxOvertimeHoursPerMonth}
                      onChange={(e) => updatePolicy('maxOvertimeHoursPerMonth', Number(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breaks">
          <Card>
            <CardHeader>
              <CardTitle>Break Time Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="breakTimeEnabled"
                  checked={policy.breakTimeEnabled}
                  onCheckedChange={(checked) => updatePolicy('breakTimeEnabled', checked)}
                />
                <Label htmlFor="breakTimeEnabled">Enable Break Time Tracking</Label>
              </div>

              {policy.breakTimeEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="breakDurationMinutes">Standard Break Duration (minutes)</Label>
                    <Input
                      id="breakDurationMinutes"
                      type="number"
                      min="15"
                      max="120"
                      value={policy.breakDurationMinutes}
                      onChange={(e) => updatePolicy('breakDurationMinutes', Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxBreaksPerDay">Max Breaks per Day</Label>
                    <Input
                      id="maxBreaksPerDay"
                      type="number"
                      min="1"
                      max="10"
                      value={policy.maxBreaksPerDay}
                      onChange={(e) => updatePolicy('maxBreaksPerDay', Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unpaidBreakThresholdMinutes">Unpaid Break Threshold (minutes)</Label>
                    <Input
                      id="unpaidBreakThresholdMinutes"
                      type="number"
                      min="30"
                      max="240"
                      value={policy.unpaidBreakThresholdMinutes}
                      onChange={(e) => updatePolicy('unpaidBreakThresholdMinutes', Number(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Approval Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="manualAttendanceRequiresApproval">Manual Attendance Requires Approval</Label>
                    <p className="text-sm text-muted-foreground">Require approval for manually added attendance records</p>
                  </div>
                  <Switch
                    id="manualAttendanceRequiresApproval"
                    checked={policy.manualAttendanceRequiresApproval}
                    onCheckedChange={(checked) => updatePolicy('manualAttendanceRequiresApproval', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="lateEntryRequiresApproval">Late Entry Requires Approval</Label>
                    <p className="text-sm text-muted-foreground">Require approval for late check-ins</p>
                  </div>
                  <Switch
                    id="lateEntryRequiresApproval"
                    checked={policy.lateEntryRequiresApproval}
                    onCheckedChange={(checked) => updatePolicy('lateEntryRequiresApproval', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="earlyExitRequiresApproval">Early Exit Requires Approval</Label>
                    <p className="text-sm text-muted-foreground">Require approval for early check-outs</p>
                  </div>
                  <Switch
                    id="earlyExitRequiresApproval"
                    checked={policy.earlyExitRequiresApproval}
                    onCheckedChange={(checked) => updatePolicy('earlyExitRequiresApproval', checked)}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Notification Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="lateArrivalNotification">Late Arrival Notifications</Label>
                    <Switch
                      id="lateArrivalNotification"
                      checked={policy.lateArrivalNotification}
                      onCheckedChange={(checked) => updatePolicy('lateArrivalNotification', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="absenteeNotification">Absentee Notifications</Label>
                    <Switch
                      id="absenteeNotification"
                      checked={policy.absenteeNotification}
                      onCheckedChange={(checked) => updatePolicy('absenteeNotification', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="overtimeNotification">Overtime Notifications</Label>
                    <Switch
                      id="overtimeNotification"
                      checked={policy.overtimeNotification}
                      onCheckedChange={(checked) => updatePolicy('overtimeNotification', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance & Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="complianceMode">Compliance Mode</Label>
                  <Select value={policy.complianceMode} onValueChange={(value) => updatePolicy('complianceMode', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="strict">Strict</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataRetentionDays">Data Retention (days)</Label>
                  <Input
                    id="dataRetentionDays"
                    type="number"
                    min="30"
                    max="2555"
                    value={policy.dataRetentionDays}
                    onChange={(e) => updatePolicy('dataRetentionDays', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auditTrailEnabled">Enable Audit Trail</Label>
                  <p className="text-sm text-muted-foreground">Track all attendance-related changes and actions</p>
                </div>
                <Switch
                  id="auditTrailEnabled"
                  checked={policy.auditTrailEnabled}
                  onCheckedChange={(checked) => updatePolicy('auditTrailEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
