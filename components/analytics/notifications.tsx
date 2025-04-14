'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAlertsStore, AlertThreshold, ThresholdType } from '@/lib/alerts-service';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export function NotificationsPopover() {
  const { 
    notifications, 
    thresholds,
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAllNotifications,
    addThreshold,
    updateThreshold,
    removeThreshold,
    getUnreadCount
  } = useAlertsStore();
  
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Update unread count when notifications change
  useEffect(() => {
    setUnreadCount(getUnreadCount());
  }, [notifications, getUnreadCount]);
  
  // Mark all as read when popover is closed
  useEffect(() => {
    if (!open && unreadCount > 0) {
      markAllAsRead();
    }
  }, [open, unreadCount, markAllAsRead]);
  
  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Get module badge color
  const getModuleColor = (module: string) => {
    switch (module) {
      case 'inventory':
        return 'bg-purple-100 text-purple-800';
      case 'sales':
        return 'bg-blue-100 text-blue-800';
      case 'finance':
        return 'bg-green-100 text-green-800';
      case 'employees':
        return 'bg-orange-100 text-orange-800';
      case 'projects':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between border-b px-3 py-2">
            <h4 className="font-medium">Notifications</h4>
            <TabsList className="grid w-[220px] grid-cols-2">
              <TabsTrigger value="notifications">Alerts</TabsTrigger>
              <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="notifications" className="p-0">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Bell className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 p-2">
                    {notifications.map((notification) => (
                      <Card key={notification.id} className={notification.read ? 'opacity-70' : ''}>
                        <CardHeader className="p-3 pb-1 flex flex-row items-start justify-between space-y-0">
                          <div className="flex items-center gap-2">
                            {getNotificationIcon(notification.type)}
                            <CardTitle className="text-sm font-medium">
                              {notification.title}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3" />
                                <span className="sr-only">Mark as read</span>
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={() => removeNotification(notification.id)}
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-1">
                          <p className="text-xs">{notification.message}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-muted-foreground">
                              {formatTime(notification.timestamp)}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] ${getModuleColor(notification.module)}`}
                            >
                              {notification.module}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex items-center justify-between border-t p-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={markAllAsRead}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all as read
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-red-500 hover:text-red-600"
                    onClick={clearAllNotifications}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="thresholds" className="p-0">
            <div className="p-2 border-b flex justify-between items-center">
              <h4 className="text-sm font-medium">Alert Thresholds</h4>
              <ThresholdDialog 
                onSave={(threshold) => {
                  addThreshold(threshold);
                  toast.success('Threshold added successfully');
                }}
              />
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 p-2">
                {thresholds.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No thresholds configured</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create thresholds to get alerts when metrics reach certain values
                    </p>
                  </div>
                ) : (
                  thresholds.map((threshold) => (
                    <ThresholdCard 
                      key={threshold.id} 
                      threshold={threshold}
                      onUpdate={(updates) => {
                        updateThreshold(threshold.id, updates);
                        toast.success('Threshold updated');
                      }}
                      onDelete={() => {
                        removeThreshold(threshold.id);
                        toast.success('Threshold removed');
                      }}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

interface ThresholdCardProps {
  threshold: AlertThreshold;
  onUpdate: (updates: Partial<AlertThreshold>) => void;
  onDelete: () => void;
}

function ThresholdCard({ threshold, onUpdate, onDelete }: ThresholdCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Get threshold type description
  const getThresholdTypeDescription = (type: ThresholdType, value: number) => {
    switch (type) {
      case ThresholdType.GREATER_THAN:
        return `> ${value}`;
      case ThresholdType.LESS_THAN:
        return `< ${value}`;
      case ThresholdType.EQUAL_TO:
        return `= ${value}`;
      case ThresholdType.NOT_EQUAL_TO:
        return `≠ ${value}`;
      case ThresholdType.PERCENTAGE_CHANGE:
        return `Δ ${value}%`;
      default:
        return `${value}`;
    }
  };
  
  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {threshold.name}
          </CardTitle>
          <Switch 
            checked={threshold.enabled} 
            onCheckedChange={(checked) => onUpdate({ enabled: checked })}
          />
        </div>
        <CardDescription className="text-xs">
          {threshold.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">{threshold.metric}</p>
            <p className="text-xs text-muted-foreground">
              {getThresholdTypeDescription(threshold.type, threshold.value)}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={`text-[10px] ${
              threshold.module === 'inventory' ? 'bg-purple-100 text-purple-800' :
              threshold.module === 'sales' ? 'bg-blue-100 text-blue-800' :
              threshold.module === 'finance' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}
          >
            {threshold.module}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-2 pt-0 flex justify-between">
        <div className="text-[10px] text-muted-foreground">
          Updated: {new Date(threshold.updatedAt).toLocaleDateString()}
        </div>
        <div className="flex gap-1">
          <ThresholdDialog 
            threshold={threshold}
            onSave={(updates) => {
              onUpdate(updates);
              setIsEditing(false);
            }}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

interface ThresholdDialogProps {
  threshold?: AlertThreshold;
  onSave: (threshold: Omit<AlertThreshold, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

function ThresholdDialog({ threshold, onSave }: ThresholdDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(threshold?.name || '');
  const [description, setDescription] = useState(threshold?.description || '');
  const [module, setModule] = useState(threshold?.module || 'inventory');
  const [metric, setMetric] = useState(threshold?.metric || '');
  const [type, setType] = useState<ThresholdType>(threshold?.type || ThresholdType.GREATER_THAN);
  const [value, setValue] = useState(threshold?.value?.toString() || '0');
  const [enabled, setEnabled] = useState(threshold?.enabled ?? true);
  
  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(threshold?.name || '');
      setDescription(threshold?.description || '');
      setModule(threshold?.module || 'inventory');
      setMetric(threshold?.metric || '');
      setType(threshold?.type || ThresholdType.GREATER_THAN);
      setValue(threshold?.value?.toString() || '0');
      setEnabled(threshold?.enabled ?? true);
    }
  }, [open, threshold]);
  
  // Handle save
  const handleSave = () => {
    if (!name || !metric || !value) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    onSave({
      name,
      description,
      module,
      metric,
      type,
      value: parseFloat(value),
      enabled
    });
    
    setOpen(false);
  };
  
  // Get metrics for selected module
  const getMetricsForModule = (module: string) => {
    switch (module) {
      case 'inventory':
        return [
          'totalItems',
          'totalQuantity',
          'totalValue',
          'lowStock',
          'stockHealth',
          'turnoverRate'
        ];
      case 'sales':
        return [
          'totalSales',
          'totalRevenue',
          'averageSaleValue',
          'salesGrowth',
          'customerCount'
        ];
      case 'finance':
        return [
          'totalIncome',
          'totalExpenses',
          'netCashflow',
          'profitMargin',
          'budgetVariance'
        ];
      case 'employees':
        return [
          'totalEmployees',
          'departmentCount',
          'averageSalary',
          'productivity'
        ];
      case 'projects':
        return [
          'totalProjects',
          'activeProjects',
          'completedProjects',
          'projectCompletion'
        ];
      default:
        return [];
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          {threshold ? 'Edit' : 'Add Threshold'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{threshold ? 'Edit Threshold' : 'Create Threshold'}</DialogTitle>
          <DialogDescription>
            Set up alerts for when metrics reach certain values
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Low Stock Alert"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Alert when stock is low"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="module" className="text-right">
              Module
            </Label>
            <Select value={module} onValueChange={setModule}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="employees">Employees</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="metric" className="text-right">
              Metric
            </Label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {getMetricsForModule(module).map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Condition
            </Label>
            <Select value={type} onValueChange={(v) => setType(v as ThresholdType)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ThresholdType.GREATER_THAN}>Greater than</SelectItem>
                <SelectItem value={ThresholdType.LESS_THAN}>Less than</SelectItem>
                <SelectItem value={ThresholdType.EQUAL_TO}>Equal to</SelectItem>
                <SelectItem value={ThresholdType.NOT_EQUAL_TO}>Not equal to</SelectItem>
                <SelectItem value={ThresholdType.PERCENTAGE_CHANGE}>Percentage change</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="value" className="text-right">
              Value
            </Label>
            <Input
              id="value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="enabled" className="text-right">
              Enabled
            </Label>
            <div className="flex items-center space-x-2 col-span-3">
              <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
              <Label htmlFor="enabled">{enabled ? 'Active' : 'Inactive'}</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
