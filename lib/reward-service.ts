import { prisma } from '@/lib/prisma';

export interface RewardTriggerData {
  employeeId: string;
  companyId: string;
  triggerType: 'task_completion' | 'attendance' | 'certification' | 'learning' | 'collaboration' | 'custom';
  metadata?: Record<string, any>;
  reason?: string;
}

export interface BadgeTriggerData {
  employeeId: string;
  companyId: string;
  badgeId: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export class RewardService {
  
  /**
   * Award points to an employee based on a reward type
   */
  static async awardReward(data: RewardTriggerData): Promise<void> {
    try {
      const { employeeId, companyId, triggerType, metadata, reason } = data;

      // Find matching reward types for this trigger
      const rewardTypes = await prisma.rewardType.findMany({
        where: {
          companyId,
          category: this.mapTriggerToCategory(triggerType),
          isActive: true
        }
      });

      if (rewardTypes.length === 0) {
        console.log(`No reward types found for trigger: ${triggerType}`);
        return;
      }

      // For now, use the first matching reward type
      // In the future, we can add more sophisticated matching logic
      const rewardType = rewardTypes[0];

      // Create the reward record
      await prisma.reward.create({
        data: {
          employeeId,
          rewardTypeId: rewardType.id,
          companyId,
          points: rewardType.pointValue,
          reason: reason || `${rewardType.name} reward`,
          metadata: metadata || {},
          isAutomatic: true
        }
      });

      // Update employee points
      await this.updateEmployeePoints(employeeId, rewardType.pointValue);

      // Check for badge eligibility
      await this.checkBadgeEligibility(employeeId, companyId, triggerType, metadata);

      console.log(`Awarded ${rewardType.pointValue} points to employee ${employeeId} for ${triggerType}`);
    } catch (error) {
      console.error('Error awarding reward:', error);
      throw error;
    }
  }

  /**
   * Award a specific badge to an employee
   */
  static async awardBadge(data: BadgeTriggerData): Promise<void> {
    try {
      const { employeeId, badgeId, reason, metadata } = data;

      // Check if employee already has this badge
      const existingBadge = await prisma.employeeBadge.findUnique({
        where: {
          employeeId_badgeId: {
            employeeId,
            badgeId
          }
        }
      });

      if (existingBadge) {
        console.log(`Employee ${employeeId} already has badge ${badgeId}`);
        return;
      }

      // Award the badge
      await prisma.employeeBadge.create({
        data: {
          employeeId,
          badgeId,
          reason: reason || 'Badge earned',
          metadata: metadata || {}
        }
      });

      console.log(`Awarded badge ${badgeId} to employee ${employeeId}`);
    } catch (error) {
      console.error('Error awarding badge:', error);
      throw error;
    }
  }

  /**
   * Update employee points and level
   */
  static async updateEmployeePoints(employeeId: string, pointsToAdd: number): Promise<void> {
    try {
      // Get or create employee points record
      let employeePoints = await prisma.employeePoints.findUnique({
        where: { employeeId }
      });

      if (!employeePoints) {
        employeePoints = await prisma.employeePoints.create({
          data: {
            employeeId,
            totalPoints: 0,
            availablePoints: 0,
            lifetimePoints: 0,
            currentLevel: 1,
            pointsToNextLevel: 100
          }
        });
      }

      const newTotalPoints = employeePoints.totalPoints + pointsToAdd;
      const newLifetimePoints = employeePoints.lifetimePoints + pointsToAdd;
      const newAvailablePoints = employeePoints.availablePoints + pointsToAdd;

      // Calculate new level
      const { newLevel, pointsToNextLevel } = this.calculateLevel(newTotalPoints);

      // Update monthly and yearly tracking
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const yearKey = now.getFullYear().toString();

      const monthlyPoints = employeePoints.monthlyPoints as Record<string, number> || {};
      const yearlyPoints = employeePoints.yearlyPoints as Record<string, number> || {};

      monthlyPoints[monthKey] = (monthlyPoints[monthKey] || 0) + pointsToAdd;
      yearlyPoints[yearKey] = (yearlyPoints[yearKey] || 0) + pointsToAdd;

      // Update the record
      await prisma.employeePoints.update({
        where: { employeeId },
        data: {
          totalPoints: newTotalPoints,
          availablePoints: newAvailablePoints,
          lifetimePoints: newLifetimePoints,
          currentLevel: newLevel,
          pointsToNextLevel,
          monthlyPoints,
          yearlyPoints
        }
      });

      console.log(`Updated points for employee ${employeeId}: +${pointsToAdd} points, Level ${newLevel}`);
    } catch (error) {
      console.error('Error updating employee points:', error);
      throw error;
    }
  }

  /**
   * Check if employee is eligible for any badges based on their activity
   */
  static async checkBadgeEligibility(
    employeeId: string, 
    companyId: string, 
    triggerType: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Get employee's current points
      const employeePoints = await prisma.employeePoints.findUnique({
        where: { employeeId }
      });

      if (!employeePoints) return;

      // Get badges that the employee doesn't have yet
      const availableBadges = await prisma.badge.findMany({
        where: {
          companyId,
          isActive: true,
          employeeBadges: {
            none: { employeeId }
          }
        }
      });

      for (const badge of availableBadges) {
        let shouldAward = false;
        let reason = '';

        // Check point-based badges
        if (badge.pointsRequired && employeePoints.totalPoints >= badge.pointsRequired) {
          shouldAward = true;
          reason = `Reached ${badge.pointsRequired} points`;
        }

        // Check category-based badges
        if (badge.category === this.mapTriggerToCategory(triggerType)) {
          // Simple logic for now - award badge after certain activities
          // This can be made more sophisticated with criteria checking
          const categoryRewards = await prisma.reward.count({
            where: {
              employeeId,
              rewardType: {
                category: badge.category
              }
            }
          });

          // Award badge after 5 rewards in the same category
          if (categoryRewards >= 5) {
            shouldAward = true;
            reason = `Earned 5 rewards in ${badge.category} category`;
          }
        }

        if (shouldAward) {
          await this.awardBadge({
            employeeId,
            companyId,
            badgeId: badge.id,
            reason,
            metadata
          });
        }
      }
    } catch (error) {
      console.error('Error checking badge eligibility:', error);
    }
  }

  /**
   * Calculate employee level based on total points
   */
  static calculateLevel(totalPoints: number): { newLevel: number; pointsToNextLevel: number } {
    // Level calculation: Level 1 = 0-99 points, Level 2 = 100-299 points, etc.
    // Each level requires 100 more points than the previous
    let level = 1;
    let pointsNeeded = 100;
    let totalPointsForLevel = 0;

    while (totalPoints >= totalPointsForLevel + pointsNeeded) {
      totalPointsForLevel += pointsNeeded;
      level++;
      pointsNeeded += 50; // Each level requires 50 more points than the previous
    }

    const pointsToNextLevel = (totalPointsForLevel + pointsNeeded) - totalPoints;

    return { newLevel: level, pointsToNextLevel };
  }

  /**
   * Map trigger types to reward categories
   */
  static mapTriggerToCategory(triggerType: string): string {
    const mapping: Record<string, string> = {
      'task_completion': 'performance',
      'attendance': 'attendance',
      'certification': 'learning',
      'learning': 'learning',
      'collaboration': 'collaboration',
      'custom': 'milestone'
    };

    return mapping[triggerType] || 'performance';
  }

  /**
   * Get employee's reward summary
   */
  static async getEmployeeRewardSummary(employeeId: string) {
    try {
      const [points, badges, recentRewards] = await Promise.all([
        prisma.employeePoints.findUnique({
          where: { employeeId }
        }),
        prisma.employeeBadge.findMany({
          where: { employeeId },
          include: { badge: true },
          orderBy: { earnedAt: 'desc' }
        }),
        prisma.reward.findMany({
          where: { employeeId },
          include: { rewardType: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);

      return {
        points: points || {
          totalPoints: 0,
          availablePoints: 0,
          currentLevel: 1,
          pointsToNextLevel: 100
        },
        badges,
        recentRewards
      };
    } catch (error) {
      console.error('Error getting employee reward summary:', error);
      throw error;
    }
  }

  /**
   * Get company leaderboard
   */
  static async getCompanyLeaderboard(companyId: string, limit: number = 10) {
    try {
      const leaderboard = await prisma.employeePoints.findMany({
        where: {
          employee: {
            companyId
          }
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              department: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { totalPoints: 'desc' },
        take: limit
      });

      return leaderboard;
    } catch (error) {
      console.error('Error getting company leaderboard:', error);
      throw error;
    }
  }
}

// Trigger functions for different events
export const RewardTriggers = {
  
  // Task completion trigger
  onTaskCompletion: async (employeeId: string, companyId: string, taskData?: any) => {
    await RewardService.awardReward({
      employeeId,
      companyId,
      triggerType: 'task_completion',
      metadata: { taskId: taskData?.id, taskName: taskData?.name },
      reason: `Completed task: ${taskData?.name || 'Task'}`
    });
  },

  // Perfect attendance trigger
  onPerfectAttendance: async (employeeId: string, companyId: string, period: 'daily' | 'weekly' | 'monthly') => {
    await RewardService.awardReward({
      employeeId,
      companyId,
      triggerType: 'attendance',
      metadata: { period, date: new Date().toISOString() },
      reason: `Perfect ${period} attendance`
    });
  },

  // Certification completion trigger
  onCertificationEarned: async (employeeId: string, companyId: string, certificationData?: any) => {
    await RewardService.awardReward({
      employeeId,
      companyId,
      triggerType: 'certification',
      metadata: { certificationId: certificationData?.id, certificationName: certificationData?.name },
      reason: `Earned certification: ${certificationData?.name || 'Certification'}`
    });
  },

  // Learning completion trigger
  onLearningCompleted: async (employeeId: string, companyId: string, learningData?: any) => {
    await RewardService.awardReward({
      employeeId,
      companyId,
      triggerType: 'learning',
      metadata: { courseId: learningData?.id, courseName: learningData?.name },
      reason: `Completed course: ${learningData?.name || 'Course'}`
    });
  },

  // Collaboration trigger
  onCollaboration: async (employeeId: string, companyId: string, collaborationData?: any) => {
    await RewardService.awardReward({
      employeeId,
      companyId,
      triggerType: 'collaboration',
      metadata: collaborationData,
      reason: 'Team collaboration contribution'
    });
  }
};
