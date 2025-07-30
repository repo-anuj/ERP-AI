"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Award,
  Star,
  TrendingUp,
  Calendar,
  Users,
  Target,
  Package,
  Zap,
  Award as Trophy,
  Package as Gift,
  Shield
} from "lucide-react";
import { format } from "date-fns";

interface EmployeePoints {
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  currentLevel: number;
  pointsToNextLevel: number;
  monthlyPoints: Record<string, number>;
  yearlyPoints: Record<string, number>;
}

interface EmployeeBadge {
  id: string;
  earnedAt: string;
  reason?: string;
  badge: {
    id: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    rarity: string;
    category: string;
  };
}

interface RecentReward {
  id: string;
  points: number;
  reason?: string;
  createdAt: string;
  rewardType: {
    name: string;
    category: string;
    icon?: string;
    color?: string;
  };
}

interface LeaderboardEntry {
  rank: number;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    department?: { name: string };
  };
  totalPoints: number;
  currentLevel: number;
}

interface EmployeeRewardDashboardProps {
  employeeId: string;
}

export function EmployeeRewardDashboard({ employeeId }: EmployeeRewardDashboardProps) {
  const { toast } = useToast();
  const [points, setPoints] = useState<EmployeePoints | null>(null);
  const [badges, setBadges] = useState<EmployeeBadge[]>([]);
  const [recentRewards, setRecentRewards] = useState<RecentReward[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch employee reward data
  const fetchRewardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/employees/${employeeId}/rewards`);
      if (response.ok) {
        const data = await response.json();
        setPoints(data.points);
        setBadges(data.badges);
        setRecentRewards(data.recentRewards);
      } else {
        throw new Error('Failed to fetch reward data');
      }
    } catch (error) {
      console.error('Error fetching reward data:', error);
      toast({
        title: "Error",
        description: "Failed to load reward data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/rewards/leaderboard?limit=10');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  useEffect(() => {
    fetchRewardData();
    fetchLeaderboard();
  }, [employeeId]);

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: "bg-gray-100 text-gray-800 border-gray-300",
      rare: "bg-blue-100 text-blue-800 border-blue-300",
      epic: "bg-purple-100 text-purple-800 border-purple-300",
      legendary: "bg-yellow-100 text-yellow-800 border-yellow-300",
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      performance: Trophy,
      attendance: Calendar,
      learning: Star,
      collaboration: Users,
      innovation: Target,
      milestone: Award,
    };
    return icons[category as keyof typeof icons] || Trophy;
  };

  const getLevelIcon = (level: number) => {
    if (level >= 10) return Shield;
    if (level >= 5) return Trophy;
    return Star;
  };

  const currentEmployee = leaderboard.find(entry => entry.employee.id === employeeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Trophy className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading your rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{points?.totalPoints || 0}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime: {points?.lifetimePoints || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
            {points && React.createElement(getLevelIcon(points.currentLevel), { 
              className: "h-4 w-4 text-blue-600" 
            })}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Level {points?.currentLevel || 1}</div>
            <p className="text-xs text-muted-foreground">
              {points?.pointsToNextLevel || 100} to next level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{badges.length}</div>
            <p className="text-xs text-muted-foreground">
              Achievements unlocked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leaderboard Rank</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{currentEmployee?.rank || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Company ranking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      {points && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Level Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Level {points.currentLevel}</span>
                <span>Level {points.currentLevel + 1}</span>
              </div>
              <Progress 
                value={((points.totalPoints % 100) / 100) * 100} 
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                {points.pointsToNextLevel} more points to reach Level {points.currentLevel + 1}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Recent Badges</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {badges.slice(0, 3).length > 0 ? (
                  <div className="space-y-3">
                    {badges.slice(0, 3).map((employeeBadge) => (
                      <div key={employeeBadge.id} className="flex items-center space-x-3">
                        <div 
                          className="text-2xl p-2 rounded-lg border"
                          style={{ backgroundColor: employeeBadge.badge.color }}
                        >
                          {employeeBadge.badge.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{employeeBadge.badge.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(employeeBadge.earnedAt), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <Badge className={getRarityColor(employeeBadge.badge.rarity)}>
                          {employeeBadge.badge.rarity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No badges earned yet</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Rewards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-5 w-5" />
                  <span>Recent Rewards</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentRewards.slice(0, 5).length > 0 ? (
                  <div className="space-y-3">
                    {recentRewards.slice(0, 5).map((reward) => {
                      const IconComponent = getCategoryIcon(reward.rewardType.category);
                      return (
                        <div key={reward.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: reward.rewardType.color || '#3B82F6', color: 'white' }}
                            >
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{reward.rewardType.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(reward.createdAt), "MMM dd")}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">+{reward.points} pts</Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No rewards earned yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          {badges.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {badges.map((employeeBadge) => (
                <Card key={employeeBadge.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="text-3xl p-3 rounded-lg border"
                        style={{ backgroundColor: employeeBadge.badge.color }}
                      >
                        {employeeBadge.badge.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{employeeBadge.badge.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getRarityColor(employeeBadge.badge.rarity)}>
                            {employeeBadge.badge.rarity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Earned on {format(new Date(employeeBadge.earnedAt), "MMMM dd, yyyy")}
                      </p>
                      {employeeBadge.reason && (
                        <p className="text-sm">{employeeBadge.reason}</p>
                      )}
                      {employeeBadge.badge.description && (
                        <p className="text-sm text-muted-foreground">
                          {employeeBadge.badge.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Badges Yet</h3>
                <p className="text-muted-foreground text-center">
                  Keep working hard to earn your first badge!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reward History</CardTitle>
              <CardDescription>
                Your complete reward and point earning history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentRewards.length > 0 ? (
                <div className="space-y-4">
                  {recentRewards.map((reward) => {
                    const IconComponent = getCategoryIcon(reward.rewardType.category);
                    return (
                      <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: reward.rewardType.color || '#3B82F6', color: 'white' }}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{reward.rewardType.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {reward.reason || 'Reward earned'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(reward.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-green-600">
                          +{reward.points} pts
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No reward history available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Leaderboard</CardTitle>
              <CardDescription>
                See how you rank against your colleagues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((entry) => (
                    <div 
                      key={entry.employee.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        entry.employee.id === employeeId ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-bold">
                          {entry.rank <= 3 ? (
                            entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'
                          ) : (
                            entry.rank
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {entry.employee.firstName} {entry.employee.lastName}
                            {entry.employee.id === employeeId && (
                              <span className="text-blue-600 ml-2">(You)</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {entry.employee.department?.name || 'No Department'} • Level {entry.currentLevel}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {entry.totalPoints} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No leaderboard data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
