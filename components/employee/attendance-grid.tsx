'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'leave';
  notes?: string;
}

interface AttendanceGridProps {
  className?: string;
}

export function AttendanceGrid({ className }: AttendanceGridProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchAttendanceData();
  }, [currentMonth]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employee/attendance?month=${currentMonth.getMonth() + 1}&year=${currentMonth.getFullYear()}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.attendance || []);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceForDate = (date: Date): AttendanceRecord | null => {
    const dateStr = date.toISOString().split('T')[0];
    return attendanceData.find(record => record.date.split('T')[0] === dateStr) || null;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'present': return 'bg-green-500 hover:bg-green-600';
      case 'absent': return 'bg-red-500 hover:bg-red-600';
      case 'late': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'half-day': return 'bg-orange-500 hover:bg-orange-600';
      case 'leave': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-200 hover:bg-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-3 w-3" />;
      case 'absent': return <XCircle className="h-3 w-3" />;
      case 'late': return <AlertCircle className="h-3 w-3" />;
      case 'half-day': return <Clock className="h-3 w-3" />;
      case 'leave': return <Calendar className="h-3 w-3" />;
      default: return null;
    }
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getAttendanceStats = () => {
    const present = attendanceData.filter(record => record.status === 'present').length;
    const absent = attendanceData.filter(record => record.status === 'absent').length;
    const late = attendanceData.filter(record => record.status === 'late').length;
    const halfDay = attendanceData.filter(record => record.status === 'half-day').length;
    const leave = attendanceData.filter(record => record.status === 'leave').length;

    return { present, absent, late, halfDay, leave };
  };

  const stats = getAttendanceStats();
  const days = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Attendance Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Attendance Overview</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ←
              </button>
              <span className="font-medium">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                →
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-5 gap-2 text-xs">
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded mx-auto mb-1"></div>
              <div className="font-medium">{stats.present}</div>
              <div className="text-muted-foreground">Present</div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-red-500 rounded mx-auto mb-1"></div>
              <div className="font-medium">{stats.absent}</div>
              <div className="text-muted-foreground">Absent</div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-yellow-500 rounded mx-auto mb-1"></div>
              <div className="font-medium">{stats.late}</div>
              <div className="text-muted-foreground">Late</div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-orange-500 rounded mx-auto mb-1"></div>
              <div className="font-medium">{stats.halfDay}</div>
              <div className="text-muted-foreground">Half Day</div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-blue-500 rounded mx-auto mb-1"></div>
              <div className="font-medium">{stats.leave}</div>
              <div className="text-muted-foreground">Leave</div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground text-center">
              {weekDays.map(day => (
                <div key={day} className="p-1 font-medium">{day}</div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={index} className="w-6 h-6"></div>;
                }

                const attendance = getAttendanceForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div
                        className={`
                          w-6 h-6 rounded text-xs flex items-center justify-center cursor-pointer transition-colors
                          ${attendance ? getStatusColor(attendance.status) : isWeekend ? 'bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'}
                          ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                          ${attendance ? 'text-white' : 'text-gray-600'}
                        `}
                      >
                        {attendance && getStatusIcon(attendance.status)}
                        {!attendance && date.getDate()}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <div className="font-medium">{date.toLocaleDateString()}</div>
                        {attendance ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <Badge variant="outline" className="text-xs">
                                {attendance.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            {attendance.checkIn && (
                              <div>Check In: {new Date(attendance.checkIn).toLocaleTimeString()}</div>
                            )}
                            {attendance.checkOut && (
                              <div>Check Out: {new Date(attendance.checkOut).toLocaleTimeString()}</div>
                            )}
                            {attendance.notes && (
                              <div className="text-muted-foreground">{attendance.notes}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">
                            {isWeekend ? 'Weekend' : 'No record'}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
