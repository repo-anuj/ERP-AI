'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Settings,
  Calendar,
  Bell,
  Shield,
  Save,
  RotateCcw
} from 'lucide-react';

interface LeaveSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function LeaveSettings({
  open,
  onClose,
}: LeaveSettingsProps) {
  const [settings, setSettings] = useState({
    // General Settings
    financialYearStart: 'april',
    weekendDays: ['saturday', 'sunday'],
    defaultLeaveYear: 'financial',
    
    // Approval Settings
    requireManagerApproval: true,
    requireHRApproval: true,
    autoApproveAfterDays: 0,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    reminderDays: 7,
    
    // Policy Settings
    allowNegativeBalance: false,
    carryOverEnabled: true,
    maxCarryOverDays: 5,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Leave Management Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="approvals">Approvals</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Financial Year Start</Label>
                      <select className="w-full p-2 border rounded">
                        <option value="april">April</option>
                        <option value="january">January</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Default Leave Year</Label>
                      <select className="w-full p-2 border rounded">
                        <option value="financial">Financial Year</option>
                        <option value="calendar">Calendar Year</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Weekend Days</Label>
                    <div className="flex gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <label key={day} className="flex items-center gap-1">
                          <input type="checkbox" />
                          <span className="text-sm">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approvals">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Approval Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Require Manager Approval</Label>
                        <p className="text-sm text-muted-foreground">All leave applications require manager approval</p>
                      </div>
                      <Switch checked={settings.requireManagerApproval} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Require HR Approval</Label>
                        <p className="text-sm text-muted-foreground">All leave applications require HR approval</p>
                      </div>
                      <Switch checked={settings.requireHRApproval} />
                    </div>

                    <div className="space-y-2">
                      <Label>Auto-approve after (days)</Label>
                      <Input
                        type="number"
                        value={settings.autoApproveAfterDays}
                        placeholder="0 = disabled"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Email Notifications</Label>
                      <Switch checked={settings.emailNotifications} />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>SMS Notifications</Label>
                      <Switch checked={settings.smsNotifications} />
                    </div>

                    <div className="space-y-2">
                      <Label>Reminder Days Before Leave</Label>
                      <Input
                        type="number"
                        value={settings.reminderDays}
                        placeholder="7"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="policies">
              <Card>
                <CardHeader>
                  <CardTitle>Policy Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow Negative Balance</Label>
                        <p className="text-sm text-muted-foreground">Allow employees to take leave beyond their balance</p>
                      </div>
                      <Switch checked={settings.allowNegativeBalance} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Carry Over</Label>
                        <p className="text-sm text-muted-foreground">Allow unused leave to carry over to next year</p>
                      </div>
                      <Switch checked={settings.carryOverEnabled} />
                    </div>

                    <div className="space-y-2">
                      <Label>Maximum Carry Over Days</Label>
                      <Input
                        type="number"
                        value={settings.maxCarryOverDays}
                        placeholder="5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
