'use client';

import { useState } from 'react';
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
  Users, 
  Target,
  Bell,
  Shield,
  Save,
  RotateCcw
} from 'lucide-react';

interface PerformanceSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function PerformanceSettings({
  open,
  onClose,
}: PerformanceSettingsProps) {
  const [settings, setSettings] = useState({
    // Review Settings
    reviewCycle: 'annual',
    reviewPeriod: 12,
    selfReviewEnabled: true,
    peerReviewEnabled: false,
    managerReviewRequired: true,
    
    // Goal Settings
    goalVisibility: 'public',
    goalUpdateFrequency: 'monthly',
    goalApprovalRequired: true,
    cascadingGoalsEnabled: true,
    
    // Notification Settings
    emailNotifications: true,
    reviewReminders: true,
    goalDeadlineReminders: true,
    feedbackNotifications: true,
    
    // Rating Settings
    ratingScale: 5,
    ratingLabels: ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'],
    calibrationRequired: false,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Performance Management Settings
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

          <Tabs defaultValue="reviews" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="ratings">Ratings</TabsTrigger>
            </TabsList>

            <TabsContent value="reviews">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Review Cycle Settings</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Review Cycle</Label>
                      <select className="w-full p-2 border rounded">
                        <option value="annual">Annual</option>
                        <option value="semi-annual">Semi-Annual</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Review Period (months)</Label>
                      <Input
                        type="number"
                        value={settings.reviewPeriod}
                        onChange={(e) => setSettings(prev => ({ ...prev, reviewPeriod: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Self Review Enabled</Label>
                        <p className="text-sm text-muted-foreground">Allow employees to review themselves</p>
                      </div>
                      <Switch checked={settings.selfReviewEnabled} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Peer Review Enabled</Label>
                        <p className="text-sm text-muted-foreground">Enable peer-to-peer reviews</p>
                      </div>
                      <Switch checked={settings.peerReviewEnabled} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Manager Review Required</Label>
                        <p className="text-sm text-muted-foreground">Require manager approval for reviews</p>
                      </div>
                      <Switch checked={settings.managerReviewRequired} />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="goals">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Goal Management Settings</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Goal Visibility</Label>
                      <select className="w-full p-2 border rounded">
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="team">Team Only</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Update Frequency</Label>
                      <select className="w-full p-2 border rounded">
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Goal Approval Required</Label>
                        <p className="text-sm text-muted-foreground">Require manager approval for new goals</p>
                      </div>
                      <Switch checked={settings.goalApprovalRequired} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Cascading Goals</Label>
                        <p className="text-sm text-muted-foreground">Enable goal cascading from company to individual</p>
                      </div>
                      <Switch checked={settings.cascadingGoalsEnabled} />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Notification Settings</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Email Notifications</Label>
                      <Switch checked={settings.emailNotifications} />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Review Reminders</Label>
                      <Switch checked={settings.reviewReminders} />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Goal Deadline Reminders</Label>
                      <Switch checked={settings.goalDeadlineReminders} />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Feedback Notifications</Label>
                      <Switch checked={settings.feedbackNotifications} />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ratings">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Rating Scale Settings</h4>
                  
                  <div className="space-y-2">
                    <Label>Rating Scale (1-10)</Label>
                    <Input
                      type="number"
                      min="3"
                      max="10"
                      value={settings.ratingScale}
                      onChange={(e) => setSettings(prev => ({ ...prev, ratingScale: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Calibration Required</Label>
                        <p className="text-sm text-muted-foreground">Require rating calibration sessions</p>
                      </div>
                      <Switch checked={settings.calibrationRequired} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Rating Labels</Label>
                    <div className="space-y-2">
                      {settings.ratingLabels.slice(0, settings.ratingScale).map((label, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-8 text-sm">{index + 1}:</span>
                          <Input
                            value={label}
                            onChange={(e) => {
                              const newLabels = [...settings.ratingLabels];
                              newLabels[index] = e.target.value;
                              setSettings(prev => ({ ...prev, ratingLabels: newLabels }));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
