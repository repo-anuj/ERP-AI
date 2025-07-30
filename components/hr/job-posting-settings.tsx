'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PlatformCard } from './platform-card';
import {
  Users,
  Globe,
  RefreshCw,
  Save,
  Bell,
  Clock,
  Zap,
  Building2
} from 'lucide-react';

interface PlatformConfig {
  enabled: boolean;
  apiKey?: string;
  companyId?: string;
  employerId?: string;
  autoPost: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'active' | 'inactive';
  lastSync?: string;
  seoOptimized?: boolean;
  autoPublish?: boolean;
}

interface JobBoardSettings {
  linkedin?: PlatformConfig;
  indeed?: PlatformConfig;
  website?: PlatformConfig;
  glassdoor?: PlatformConfig;
  naukri?: PlatformConfig;
  monster?: PlatformConfig;
  defaultPlatforms: string[];
  syncFrequency: 'manual' | 'hourly' | 'daily';
  notifications?: {
    syncSuccess: boolean;
    syncFailure: boolean;
    applicationReceived: boolean;
  };
  lastGlobalSync?: string;
}

const defaultSettings: JobBoardSettings = {
  defaultPlatforms: [],
  syncFrequency: 'manual',
  notifications: {
    syncSuccess: true,
    syncFailure: true,
    applicationReceived: true
  }
};

export function JobPostingSettings() {
  const [settings, setSettings] = useState<JobBoardSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Platform definitions
  const platforms = [
    {
      id: 'linkedin',
      title: 'LinkedIn',
      description: 'Professional networking platform',
      icon: <Users className="h-6 w-6 text-blue-600" />,
      requiresApiKey: true
    },
    {
      id: 'indeed',
      title: 'Indeed',
      description: 'World\'s largest job site',
      icon: <Globe className="h-6 w-6 text-blue-700" />,
      requiresApiKey: true
    },
    {
      id: 'website',
      title: 'Company Website',
      description: 'Your company career page',
      icon: <Building2 className="h-6 w-6 text-green-600" />,
      requiresApiKey: false
    },
    {
      id: 'glassdoor',
      title: 'Glassdoor',
      description: 'Company reviews and jobs',
      icon: <Globe className="h-6 w-6 text-green-500" />,
      requiresApiKey: true
    },
    {
      id: 'naukri',
      title: 'Naukri.com',
      description: 'India\'s leading job portal',
      icon: <Globe className="h-6 w-6 text-purple-600" />,
      requiresApiKey: true
    },
    {
      id: 'monster',
      title: 'Monster',
      description: 'Global job search platform',
      icon: <Globe className="h-6 w-6 text-orange-600" />,
      requiresApiKey: true
    }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hr/recruitment/settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job board settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/hr/recruitment/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to save settings');
      }

      toast({
        title: 'Success',
        description: 'Job board settings saved successfully!',
      });

    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePlatform = (platformId: string, config: PlatformConfig) => {
    setSettings(prev => ({
      ...prev,
      [platformId]: config
    }));
  };

  const syncPlatform = async (platformId: string) => {
    // Simulate sync operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update last sync time
    updatePlatform(platformId, {
      ...settings[platformId as keyof JobBoardSettings] as PlatformConfig,
      lastSync: new Date().toISOString(),
      status: 'connected'
    });
  };

  const testConnection = async (platformId: string) => {
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const config = settings[platformId as keyof JobBoardSettings] as PlatformConfig;
    if (config?.apiKey) {
      updatePlatform(platformId, {
        ...config,
        status: 'connected'
      });
    } else {
      throw new Error('API key is required');
    }
  };

  const updateDefaultPlatforms = (platformId: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      defaultPlatforms: checked
        ? [...prev.defaultPlatforms, platformId]
        : prev.defaultPlatforms.filter(id => id !== platformId)
    }));
  };

  const updateNotifications = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications!,
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((platform) => (
          <PlatformCard
            key={platform.id}
            platform={platform.id as any}
            title={platform.title}
            description={platform.description}
            icon={platform.icon}
            config={settings[platform.id as keyof JobBoardSettings] as PlatformConfig}
            onUpdate={(config) => updatePlatform(platform.id, config)}
            onSync={platform.requiresApiKey ? () => syncPlatform(platform.id) : undefined}
            onTest={platform.requiresApiKey ? () => testConnection(platform.id) : undefined}
            isLoading={saving}
          />
        ))}
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Global Settings</span>
          </CardTitle>
          <CardDescription>Configure default behavior for all job postings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Platforms */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Default Platforms</Label>
            <p className="text-xs text-gray-500 mb-3">
              These platforms will be automatically selected when creating new job postings
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {platforms.map((platform) => {
                const config = settings[platform.id as keyof JobBoardSettings] as PlatformConfig;
                const isEnabled = config?.enabled || false;
                const isSelected = settings.defaultPlatforms.includes(platform.id);
                
                return (
                  <div key={platform.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`default-${platform.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => updateDefaultPlatforms(platform.id, checked as boolean)}
                      disabled={!isEnabled}
                    />
                    <Label 
                      htmlFor={`default-${platform.id}`} 
                      className={`text-sm ${!isEnabled ? 'text-gray-400' : ''}`}
                    >
                      {platform.title}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Sync Frequency */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Sync Frequency</span>
            </Label>
            <Select 
              value={settings.syncFrequency} 
              onValueChange={(value: 'manual' | 'hourly' | 'daily') => 
                setSettings(prev => ({ ...prev, syncFrequency: value }))
              }
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Only</SelectItem>
                <SelectItem value="hourly">Every Hour</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              How often to automatically sync job postings with external platforms
            </p>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Sync Success</Label>
                  <p className="text-xs text-gray-500">Notify when job postings sync successfully</p>
                </div>
                <Switch
                  checked={settings.notifications?.syncSuccess || false}
                  onCheckedChange={(checked) => updateNotifications('syncSuccess', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Sync Failures</Label>
                  <p className="text-xs text-gray-500">Notify when sync operations fail</p>
                </div>
                <Switch
                  checked={settings.notifications?.syncFailure || false}
                  onCheckedChange={(checked) => updateNotifications('syncFailure', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">New Applications</Label>
                  <p className="text-xs text-gray-500">Notify when applications are received</p>
                </div>
                <Switch
                  checked={settings.notifications?.applicationReceived || false}
                  onCheckedChange={(checked) => updateNotifications('applicationReceived', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
