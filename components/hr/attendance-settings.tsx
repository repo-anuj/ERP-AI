'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Clock,
  MapPin,
  Bell,
  Shield,
  Archive as Database,
  Phone as Smartphone,
  Wifi,
  Save,
  RotateCcw,
  Info
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AttendanceSettings {
  // General Settings
  companyName: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  
  // Device Integration
  biometricEnabled: boolean;
  mobileAppEnabled: boolean;
  webCheckInEnabled: boolean;
  qrCodeCheckInEnabled: boolean;
  
  // Location Settings
  locationTrackingEnabled: boolean;
  gpsAccuracyMeters: number;
  allowedIpAddresses: string[];
  officeLocations: Array<{
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius: number;
  }>;
  
  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  managerNotifications: boolean;
  hrNotifications: boolean;
  
  // Security Settings
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordPolicy: string;
  auditLogging: boolean;
  
  // Data Settings
  dataRetentionDays: number;
  autoBackup: boolean;
  backupFrequency: string;
  exportFormat: string;
}

interface AttendanceSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function AttendanceSettings({
  open,
  onClose,
}: AttendanceSettingsProps) {
  const [settings, setSettings] = useState<AttendanceSettings>({
    companyName: '',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    biometricEnabled: false,
    mobileAppEnabled: true,
    webCheckInEnabled: true,
    qrCodeCheckInEnabled: false,
    locationTrackingEnabled: false,
    gpsAccuracyMeters: 100,
    allowedIpAddresses: [],
    officeLocations: [],
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    managerNotifications: true,
    hrNotifications: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordPolicy: 'medium',
    auditLogging: true,
    dataRetentionDays: 365,
    autoBackup: true,
    backupFrequency: 'daily',
    exportFormat: 'excel',
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // Load existing settings
  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/hr/attendance/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hr/attendance/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast({
        title: 'Success',
        description: 'Attendance settings saved successfully',
      });

      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save attendance settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset to defaults
  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings({
        companyName: '',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        biometricEnabled: false,
        mobileAppEnabled: true,
        webCheckInEnabled: true,
        qrCodeCheckInEnabled: false,
        locationTrackingEnabled: false,
        gpsAccuracyMeters: 100,
        allowedIpAddresses: [],
        officeLocations: [],
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        managerNotifications: true,
        hrNotifications: true,
        twoFactorAuth: false,
        sessionTimeout: 30,
        passwordPolicy: 'medium',
        auditLogging: true,
        dataRetentionDays: 365,
        autoBackup: true,
        backupFrequency: 'daily',
        exportFormat: 'excel',
      });
      setHasChanges(true);
    }
  };

  const updateSetting = (field: keyof AttendanceSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Attendance Settings</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSaveSettings} disabled={loading || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {hasChanges && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes. Don't forget to save your settings.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={settings.companyName}
                        onChange={(e) => updateSetting('companyName', e.target.value)}
                        placeholder="Your Company Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={settings.timezone} onValueChange={(value) => updateSetting('timezone', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                          <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select value={settings.dateFormat} onValueChange={(value) => updateSetting('dateFormat', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeFormat">Time Format</Label>
                      <Select value={settings.timeFormat} onValueChange={(value) => updateSetting('timeFormat', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24h">24 Hour</SelectItem>
                          <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="devices">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Device Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="biometricEnabled">Biometric Devices</Label>
                        <p className="text-sm text-muted-foreground">Enable integration with biometric attendance devices</p>
                      </div>
                      <Switch
                        id="biometricEnabled"
                        checked={settings.biometricEnabled}
                        onCheckedChange={(checked) => updateSetting('biometricEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="mobileAppEnabled">Mobile App Check-in</Label>
                        <p className="text-sm text-muted-foreground">Allow employees to check-in via mobile app</p>
                      </div>
                      <Switch
                        id="mobileAppEnabled"
                        checked={settings.mobileAppEnabled}
                        onCheckedChange={(checked) => updateSetting('mobileAppEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="webCheckInEnabled">Web Check-in</Label>
                        <p className="text-sm text-muted-foreground">Allow employees to check-in via web browser</p>
                      </div>
                      <Switch
                        id="webCheckInEnabled"
                        checked={settings.webCheckInEnabled}
                        onCheckedChange={(checked) => updateSetting('webCheckInEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="qrCodeCheckInEnabled">QR Code Check-in</Label>
                        <p className="text-sm text-muted-foreground">Enable QR code based attendance marking</p>
                      </div>
                      <Switch
                        id="qrCodeCheckInEnabled"
                        checked={settings.qrCodeCheckInEnabled}
                        onCheckedChange={(checked) => updateSetting('qrCodeCheckInEnabled', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="locationTrackingEnabled">Location Tracking</Label>
                      <p className="text-sm text-muted-foreground">Track employee location during check-in/out</p>
                    </div>
                    <Switch
                      id="locationTrackingEnabled"
                      checked={settings.locationTrackingEnabled}
                      onCheckedChange={(checked) => updateSetting('locationTrackingEnabled', checked)}
                    />
                  </div>

                  {settings.locationTrackingEnabled && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="gpsAccuracyMeters">GPS Accuracy (meters)</Label>
                        <Input
                          id="gpsAccuracyMeters"
                          type="number"
                          min="10"
                          max="1000"
                          value={settings.gpsAccuracyMeters}
                          onChange={(e) => updateSetting('gpsAccuracyMeters', Number(e.target.value))}
                        />
                      </div>
                    </div>
                  )}
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
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                      <Switch
                        id="emailNotifications"
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="smsNotifications">SMS Notifications</Label>
                      <Switch
                        id="smsNotifications"
                        checked={settings.smsNotifications}
                        onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="pushNotifications">Push Notifications</Label>
                      <Switch
                        id="pushNotifications"
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="managerNotifications">Manager Notifications</Label>
                      <Switch
                        id="managerNotifications"
                        checked={settings.managerNotifications}
                        onCheckedChange={(checked) => updateSetting('managerNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="hrNotifications">HR Notifications</Label>
                      <Switch
                        id="hrNotifications"
                        checked={settings.hrNotifications}
                        onCheckedChange={(checked) => updateSetting('hrNotifications', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security & Data Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">Require 2FA for attendance access</p>
                      </div>
                      <Switch
                        id="twoFactorAuth"
                        checked={settings.twoFactorAuth}
                        onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="auditLogging">Audit Logging</Label>
                      <Switch
                        id="auditLogging"
                        checked={settings.auditLogging}
                        onCheckedChange={(checked) => updateSetting('auditLogging', checked)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                        <Input
                          id="sessionTimeout"
                          type="number"
                          min="5"
                          max="480"
                          value={settings.sessionTimeout}
                          onChange={(e) => updateSetting('sessionTimeout', Number(e.target.value))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dataRetentionDays">Data Retention (days)</Label>
                        <Input
                          id="dataRetentionDays"
                          type="number"
                          min="30"
                          max="2555"
                          value={settings.dataRetentionDays}
                          onChange={(e) => updateSetting('dataRetentionDays', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="autoBackup">Automatic Backup</Label>
                        <p className="text-sm text-muted-foreground">Automatically backup attendance data</p>
                      </div>
                      <Switch
                        id="autoBackup"
                        checked={settings.autoBackup}
                        onCheckedChange={(checked) => updateSetting('autoBackup', checked)}
                      />
                    </div>

                    {settings.autoBackup && (
                      <div className="space-y-2">
                        <Label htmlFor="backupFrequency">Backup Frequency</Label>
                        <Select value={settings.backupFrequency} onValueChange={(value) => updateSetting('backupFrequency', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
