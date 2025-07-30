"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Clock,
  MapPin,
  Calendar,
  Timer,
  CheckCircle,
  AlertCircle,
  PlayCircle as Play,
  Square
} from "lucide-react";
import { format } from "date-fns";

interface ClockStatus {
  attendance: any;
  isClockedIn: boolean;
  currentWorkingHours: number;
  expectedStartTime: string;
  expectedEndTime: string;
}

export function EmployeeClock() {
  const { toast } = useToast();
  const [clockStatus, setClockStatus] = useState<ClockStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClocking, setIsClocking] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch clock status
  const fetchClockStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/attendance/clock');
      if (response.ok) {
        const data = await response.json();
        setClockStatus(data);
      } else {
        throw new Error('Failed to fetch clock status');
      }
    } catch (error) {
      console.error('Error fetching clock status:', error);
      toast({
        title: "Error",
        description: "Failed to load clock status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClockStatus();
  }, []);

  // Get user's location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocation('Location unavailable');
        }
      );
    } else {
      setLocation('Geolocation not supported');
    }
  };

  // Handle clock in/out
  const handleClock = async (action: 'clock_in' | 'clock_out') => {
    try {
      setIsClocking(true);
      
      const response = await fetch('/api/attendance/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          location: location || undefined,
          notes: notes || undefined
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message,
        });
        
        // Clear form and refresh status
        setNotes('');
        setLocation('');
        fetchClockStatus();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clock in/out');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clock in/out",
        variant: "destructive",
      });
    } finally {
      setIsClocking(false);
    }
  };

  const getStatusColor = () => {
    if (!clockStatus?.attendance) return "bg-gray-100 text-gray-800";
    
    if (clockStatus.isClockedIn) {
      return "bg-green-100 text-green-800";
    } else if (clockStatus.attendance.checkOut) {
      return "bg-blue-100 text-blue-800";
    } else {
      return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = () => {
    if (!clockStatus?.attendance) return "Not clocked in";
    
    if (clockStatus.isClockedIn) {
      return "Clocked In";
    } else if (clockStatus.attendance.checkOut) {
      return "Clocked Out";
    } else {
      return "Not clocked in";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading clock status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Time Clock</span>
          </CardTitle>
          <CardDescription>
            Track your work hours and attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {format(currentTime, "HH:mm:ss")}
              </div>
              <p className="text-sm text-muted-foreground">
                {format(currentTime, "EEEE, MMMM dd, yyyy")}
              </p>
            </div>
            
            <div className="text-center">
              <Badge className={getStatusColor()}>
                {getStatusText()}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Current Status
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-xl font-bold mb-1">
                {clockStatus?.currentWorkingHours.toFixed(2)}h
              </div>
              <p className="text-sm text-muted-foreground">
                Hours Today
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Attendance */}
      {clockStatus?.attendance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Today's Attendance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Check In</span>
                  <div className="flex items-center space-x-2">
                    {clockStatus.attendance.checkIn ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">
                          {format(new Date(clockStatus.attendance.checkIn), "HH:mm")}
                        </span>
                        {clockStatus.attendance.isLate && (
                          <Badge variant="destructive" className="text-xs">Late</Badge>
                        )}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-muted-foreground">Not checked in</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Check Out</span>
                  <div className="flex items-center space-x-2">
                    {clockStatus.attendance.checkOut ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">
                          {format(new Date(clockStatus.attendance.checkOut), "HH:mm")}
                        </span>
                        {clockStatus.attendance.isEarlyLeave && (
                          <Badge variant="secondary" className="text-xs">Early</Badge>
                        )}
                      </>
                    ) : (
                      <>
                        <Timer className="h-4 w-4 text-gray-400" />
                        <span className="text-muted-foreground">Not checked out</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expected Hours</span>
                  <span className="font-medium">
                    {clockStatus.expectedStartTime} - {clockStatus.expectedEndTime}
                  </span>
                </div>
                
                {clockStatus.attendance.totalHours && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Hours</span>
                    <span className="font-medium">
                      {clockStatus.attendance.totalHours.toFixed(2)}h
                    </span>
                  </div>
                )}
                
                {clockStatus.attendance.overtimeHours > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Overtime</span>
                    <Badge variant="secondary">
                      +{clockStatus.attendance.overtimeHours.toFixed(2)}h
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clock In/Out Actions */}
      <Card>
        <CardHeader>
          <CardTitle>
            {clockStatus?.isClockedIn ? 'Clock Out' : 'Clock In'}
          </CardTitle>
          <CardDescription>
            {clockStatus?.isClockedIn 
              ? 'End your work day and record your hours'
              : 'Start your work day and begin tracking time'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <div className="flex space-x-2">
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter your location or use GPS"
              />
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                className="flex items-center space-x-2"
              >
                <MapPin className="h-4 w-4" />
                <span>GPS</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about your work day..."
              rows={3}
            />
          </div>

          <Button
            onClick={() => handleClock(clockStatus?.isClockedIn ? 'clock_out' : 'clock_in')}
            disabled={isClocking}
            className="w-full"
            size="lg"
          >
            {isClocking ? (
              'Processing...'
            ) : clockStatus?.isClockedIn ? (
              <>
                <Square className="h-5 w-5 mr-2" />
                Clock Out
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Clock In
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
