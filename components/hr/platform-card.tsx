'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Zap
} from 'lucide-react';

interface PlatformConfig {
  enabled: boolean;
  apiKey?: string;
  companyId?: string;
  employerId?: string;
  autoPost: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'active' | 'inactive';
  lastSync?: string;
}

interface PlatformCardProps {
  platform: 'linkedin' | 'indeed' | 'website' | 'glassdoor' | 'naukri' | 'monster';
  title: string;
  description?: string;
  icon: React.ReactNode;
  config?: PlatformConfig;
  onUpdate: (config: PlatformConfig) => void;
  onSync?: () => void;
  onTest?: () => void;
  isLoading?: boolean;
}

const defaultConfig: PlatformConfig = {
  enabled: false,
  autoPost: false,
  status: 'disconnected'
};

export function PlatformCard({
  platform,
  title,
  description,
  icon,
  config = defaultConfig,
  onUpdate,
  onSync,
  onTest,
  isLoading = false
}: PlatformCardProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const getStatusIcon = () => {
    switch (config.status) {
      case 'connected':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (config.status) {
      case 'connected':
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Not Connected</Badge>;
    }
  };

  const handleSync = async () => {
    if (!onSync) return;
    
    setIsSyncing(true);
    try {
      await onSync();
      toast({
        title: 'Sync Successful',
        description: `${title} has been synced successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: `Failed to sync ${title}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTest = async () => {
    if (!onTest) return;
    
    setIsTesting(true);
    try {
      await onTest();
      toast({
        title: 'Connection Test Successful',
        description: `${title} connection is working properly.`,
      });
    } catch (error) {
      toast({
        title: 'Connection Test Failed',
        description: `Failed to connect to ${title}. Please check your credentials.`,
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const updateConfig = (updates: Partial<PlatformConfig>) => {
    onUpdate({ ...config, ...updates });
  };

  const isWebsite = platform === 'website';
  const requiresApiKey = !isWebsite;

  return (
    <Card className={`transition-all duration-200 ${config.enabled ? 'ring-2 ring-blue-200' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gray-100">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <CardDescription className="text-sm">{description}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Enable {title}</Label>
            <p className="text-xs text-gray-500">
              {isWebsite ? 'Publish jobs on your company website' : `Post jobs automatically to ${title}`}
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => updateConfig({ enabled })}
            disabled={isLoading}
          />
        </div>

        {config.enabled && (
          <>
            <Separator />
            
            {/* Auto-post Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center space-x-1">
                  <Zap className="h-3 w-3" />
                  <span>Auto-post</span>
                </Label>
                <p className="text-xs text-gray-500">
                  Automatically post new jobs to this platform
                </p>
              </div>
              <Switch
                checked={config.autoPost}
                onCheckedChange={(autoPost) => updateConfig({ autoPost })}
                disabled={isLoading}
              />
            </div>

            {/* Configuration Section */}
            {requiresApiKey && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {isExpanded ? 'Hide' : 'Show'} Configuration
                  </Button>

                  {isExpanded && (
                    <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                      {/* API Key */}
                      <div className="space-y-2">
                        <Label htmlFor={`${platform}-api-key`} className="text-sm">
                          API Key {platform === 'indeed' ? '(Publisher ID)' : ''}
                        </Label>
                        <div className="relative">
                          <Input
                            id={`${platform}-api-key`}
                            type={showApiKey ? 'text' : 'password'}
                            value={config.apiKey || ''}
                            onChange={(e) => updateConfig({ apiKey: e.target.value })}
                            placeholder="Enter your API key"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Company/Employer ID */}
                      {(platform === 'linkedin' || platform === 'indeed') && (
                        <div className="space-y-2">
                          <Label htmlFor={`${platform}-company-id`} className="text-sm">
                            {platform === 'linkedin' ? 'Company ID' : 'Employer ID'}
                          </Label>
                          <Input
                            id={`${platform}-company-id`}
                            value={platform === 'linkedin' ? config.companyId || '' : config.employerId || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (platform === 'linkedin') {
                                updateConfig({ companyId: value });
                              } else {
                                updateConfig({ employerId: value });
                              }
                            }}
                            placeholder={`Enter your ${platform === 'linkedin' ? 'company' : 'employer'} ID`}
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTest}
                          disabled={isTesting || !config.apiKey}
                          className="flex-1"
                        >
                          {isTesting ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ExternalLink className="h-4 w-4 mr-2" />
                          )}
                          Test Connection
                        </Button>

                        {onSync && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSync}
                            disabled={isSyncing || config.status !== 'connected'}
                            className="flex-1"
                          >
                            {isSyncing ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Sync Now
                          </Button>
                        )}
                      </div>

                      {/* Last Sync Info */}
                      {config.lastSync && (
                        <p className="text-xs text-gray-500 pt-2">
                          Last synced: {new Date(config.lastSync).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Website-specific settings */}
            {isWebsite && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">SEO Optimized</Label>
                      <p className="text-xs text-gray-500">
                        Generate SEO-friendly job posting pages
                      </p>
                    </div>
                    <Switch
                      checked={(config as any).seoOptimized || false}
                      onCheckedChange={(seoOptimized) => updateConfig({ ...config, seoOptimized } as any)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
