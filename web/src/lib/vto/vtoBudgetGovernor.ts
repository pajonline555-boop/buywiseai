export type VtoProviderMode = "DISABLED" | "CONTROLLED" | "PRODUCTION";

export interface VtoBudgetConfig {
  providerMode: VtoProviderMode;
  emergencyStop: boolean;
  perUserMonthlyLimit: number;
  perUserDailyLimit: number;
  globalDailyLimit: number;
  globalMonthlyLimit: number;
  maxConcurrentPerUser: number;
}

export interface BudgetCheckResult {
  allowed: boolean;
  code?: string;
  message?: string;
  userMonthlyRemaining: number;
  userDailyRemaining: number;
  globalDailyRemaining: number;
  globalMonthlyRemaining: number;
  reservationId?: string;
}

export interface VtoBudgetMetrics {
  providerMode: VtoProviderMode;
  emergencyStop: boolean;
  todayCount: number;
  monthCount: number;
  remainingGlobalDaily: number;
  remainingGlobalMonthly: number;
  totalSpendEstimatedUsd: number;
  activeConcurrentRequests: number;
  limits: {
    perUserMonthlyLimit: number;
    perUserDailyLimit: number;
    globalDailyLimit: number;
    globalMonthlyLimit: number;
  };
}

class VtoBudgetGovernor {
  private config: VtoBudgetConfig = {
    providerMode: (process.env.VTO_PROVIDER_MODE as VtoProviderMode) || "CONTROLLED",
    emergencyStop: process.env.VTO_EMERGENCY_STOP === "true",
    perUserMonthlyLimit: parseInt(process.env.VTO_PER_USER_MONTHLY_LIMIT || "3", 10),
    perUserDailyLimit: parseInt(process.env.VTO_PER_USER_DAILY_LIMIT || "1", 10),
    globalDailyLimit: parseInt(process.env.VTO_DAILY_GENERATION_LIMIT || "5", 10),
    globalMonthlyLimit: parseInt(process.env.VTO_MONTHLY_GENERATION_LIMIT || "50", 10),
    maxConcurrentPerUser: parseInt(process.env.VTO_MAX_CONCURRENT_PER_USER || "1", 10)
  };

  private userDailyMap = new Map<string, { dateStr: string; count: number }>();
  private userMonthlyMap = new Map<string, { monthStr: string; count: number }>();
  private userActiveRequests = new Map<string, number>();

  private globalDaily = { dateStr: this.getDateStr(), count: 0 };
  private globalMonthly = { monthStr: this.getMonthStr(), count: 0 };
  private totalSpendEstimatedUsd = 0;

  private getDateStr(): string {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  }

  private getMonthStr(): string {
    return new Date().toISOString().substring(0, 7); // YYYY-MM
  }

  public getConfig(): VtoBudgetConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<VtoBudgetConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log("[VTO Budget Governor]: Configuration updated dynamically by admin.", this.config);
  }

  /**
   * Evaluates user and global budget limits before any external VTO provider is called.
   * Atomically reserves a budget slot if allowed.
   */
  public checkAndReserveSlot(userId: string): BudgetCheckResult {
    const today = this.getDateStr();
    const currentMonth = this.getMonthStr();

    // Reset daily global counter if date changed
    if (this.globalDaily.dateStr !== today) {
      this.globalDaily = { dateStr: today, count: 0 };
    }

    // Reset monthly global counter if month changed
    if (this.globalMonthly.monthStr !== currentMonth) {
      this.globalMonthly = { monthStr: currentMonth, count: 0 };
    }

    // 1. Emergency Stop Check
    if (this.config.emergencyStop) {
      return {
        allowed: false,
        code: "VTO_EMERGENCY_STOP",
        message: "Free Try-On is temporarily paused for maintenance. Please try again later.",
        userMonthlyRemaining: 0,
        userDailyRemaining: 0,
        globalDailyRemaining: 0,
        globalMonthlyRemaining: 0
      };
    }

    // 2. Provider Mode Check
    if (this.config.providerMode === "DISABLED") {
      return {
        allowed: false,
        code: "VTO_DISABLED",
        message: "Virtual Try-On is currently disabled. Please try again later.",
        userMonthlyRemaining: 0,
        userDailyRemaining: 0,
        globalDailyRemaining: 0,
        globalMonthlyRemaining: 0
      };
    }

    // 3. User Concurrency Lock Check
    const activeReqs = this.userActiveRequests.get(userId) || 0;
    if (activeReqs >= this.config.maxConcurrentPerUser) {
      return {
        allowed: false,
        code: "VTO_CONCURRENT_LIMIT",
        message: "You already have an active Try-On request processing. Please wait a moment.",
        userMonthlyRemaining: 0,
        userDailyRemaining: 0,
        globalDailyRemaining: Math.max(0, this.config.globalDailyLimit - this.globalDaily.count),
        globalMonthlyRemaining: Math.max(0, this.config.globalMonthlyLimit - this.globalMonthly.count)
      };
    }

    // 4. Per-User Daily Limit Check
    const userDaily = this.userDailyMap.get(userId);
    const userDailyCount = (userDaily && userDaily.dateStr === today) ? userDaily.count : 0;
    const userDailyRemaining = Math.max(0, this.config.perUserDailyLimit - userDailyCount);

    if (userDailyCount >= this.config.perUserDailyLimit) {
      return {
        allowed: false,
        code: "VTO_USER_DAILY_LIMIT",
        message: "You've reached your daily free Try-On limit (1/day). Please try again tomorrow! 🎉",
        userMonthlyRemaining: Math.max(0, this.config.perUserMonthlyLimit - (this.userMonthlyMap.get(userId)?.count || 0)),
        userDailyRemaining: 0,
        globalDailyRemaining: Math.max(0, this.config.globalDailyLimit - this.globalDaily.count),
        globalMonthlyRemaining: Math.max(0, this.config.globalMonthlyLimit - this.globalMonthly.count)
      };
    }

    // 5. Per-User Monthly Limit Check
    const userMonthly = this.userMonthlyMap.get(userId);
    const userMonthlyCount = (userMonthly && userMonthly.monthStr === currentMonth) ? userMonthly.count : 0;
    const userMonthlyRemaining = Math.max(0, this.config.perUserMonthlyLimit - userMonthlyCount);

    if (userMonthlyCount >= this.config.perUserMonthlyLimit) {
      return {
        allowed: false,
        code: "VTO_USER_MONTHLY_LIMIT",
        message: `You've used your free Try-Ons for this month (${userMonthlyCount}/${this.config.perUserMonthlyLimit}). 🎉 Your allowance will reset next month.`,
        userMonthlyRemaining: 0,
        userDailyRemaining: userDailyRemaining,
        globalDailyRemaining: Math.max(0, this.config.globalDailyLimit - this.globalDaily.count),
        globalMonthlyRemaining: Math.max(0, this.config.globalMonthlyLimit - this.globalMonthly.count)
      };
    }

    // 6. Global Daily Cap Check
    const globalDailyRemaining = Math.max(0, this.config.globalDailyLimit - this.globalDaily.count);
    if (this.globalDaily.count >= this.config.globalDailyLimit) {
      return {
        allowed: false,
        code: "VTO_GLOBAL_DAILY_LIMIT",
        message: "Free Try-On is temporarily unavailable today as daily community capacity has been reached. Please try again tomorrow!",
        userMonthlyRemaining,
        userDailyRemaining,
        globalDailyRemaining: 0,
        globalMonthlyRemaining: Math.max(0, this.config.globalMonthlyLimit - this.globalMonthly.count)
      };
    }

    // 7. Global Monthly Cap Check
    const globalMonthlyRemaining = Math.max(0, this.config.globalMonthlyLimit - this.globalMonthly.count);
    if (this.globalMonthly.count >= this.config.globalMonthlyLimit) {
      return {
        allowed: false,
        code: "VTO_GLOBAL_MONTHLY_LIMIT",
        message: "Free Try-On monthly limit reached for this period. Please try again next month!",
        userMonthlyRemaining,
        userDailyRemaining,
        globalDailyRemaining,
        globalMonthlyRemaining: 0
      };
    }

    // ATOMIC RESERVATION: Increment active concurrent lock and temporary counters
    this.userActiveRequests.set(userId, activeReqs + 1);
    this.userDailyMap.set(userId, { dateStr: today, count: userDailyCount + 1 });
    this.userMonthlyMap.set(userId, { monthStr: currentMonth, count: userMonthlyCount + 1 });
    this.globalDaily.count += 1;
    this.globalMonthly.count += 1;

    const reservationId = `gov_res_${userId}_${Date.now()}`;

    return {
      allowed: true,
      reservationId,
      userMonthlyRemaining: userMonthlyRemaining - 1,
      userDailyRemaining: userDailyRemaining - 1,
      globalDailyRemaining: globalDailyRemaining - 1,
      globalMonthlyRemaining: globalMonthlyRemaining - 1
    };
  }

  /**
   * Called upon successful VTO generation to commit cost tracking.
   */
  public commitSlot(userId: string, estimatedCostUsd: number = 0) {
    const activeReqs = this.userActiveRequests.get(userId) || 1;
    this.userActiveRequests.set(userId, Math.max(0, activeReqs - 1));
    this.totalSpendEstimatedUsd += estimatedCostUsd;
    console.log(`[VTO Budget Governor]: Slot committed for ${userId}. Total spend estimated: $${this.totalSpendEstimatedUsd.toFixed(4)}`);
  }

  /**
   * Called upon provider failure or quality gate rejection to refund slot & counters.
   */
  public releaseSlot(userId: string) {
    const today = this.getDateStr();
    const currentMonth = this.getMonthStr();

    // Release concurrent request lock
    const activeReqs = this.userActiveRequests.get(userId) || 1;
    this.userActiveRequests.set(userId, Math.max(0, activeReqs - 1));

    // Refund user daily counter
    const userDaily = this.userDailyMap.get(userId);
    if (userDaily && userDaily.dateStr === today && userDaily.count > 0) {
      this.userDailyMap.set(userId, { dateStr: today, count: userDaily.count - 1 });
    }

    // Refund user monthly counter
    const userMonthly = this.userMonthlyMap.get(userId);
    if (userMonthly && userMonthly.monthStr === currentMonth && userMonthly.count > 0) {
      this.userMonthlyMap.set(userId, { monthStr: currentMonth, count: userMonthly.count - 1 });
    }

    // Refund global counters
    if (this.globalDaily.count > 0) this.globalDaily.count -= 1;
    if (this.globalMonthly.count > 0) this.globalMonthly.count -= 1;

    console.log(`[VTO Budget Governor]: Slot & counters refunded for user ${userId}.`);
  }

  public getMetrics(): VtoBudgetMetrics {
    const today = this.getDateStr();
    const currentMonth = this.getMonthStr();

    const todayCount = (this.globalDaily.dateStr === today) ? this.globalDaily.count : 0;
    const monthCount = (this.globalMonthly.monthStr === currentMonth) ? this.globalMonthly.count : 0;

    let activeConcurrentTotal = 0;
    this.userActiveRequests.forEach((count) => { activeConcurrentTotal += count; });

    return {
      providerMode: this.config.providerMode,
      emergencyStop: this.config.emergencyStop,
      todayCount,
      monthCount,
      remainingGlobalDaily: Math.max(0, this.config.globalDailyLimit - todayCount),
      remainingGlobalMonthly: Math.max(0, this.config.globalMonthlyLimit - monthCount),
      totalSpendEstimatedUsd: this.totalSpendEstimatedUsd,
      activeConcurrentRequests: activeConcurrentTotal,
      limits: {
        perUserMonthlyLimit: this.config.perUserMonthlyLimit,
        perUserDailyLimit: this.config.perUserDailyLimit,
        globalDailyLimit: this.config.globalDailyLimit,
        globalMonthlyLimit: this.config.globalMonthlyLimit
      }
    };
  }
}

export const vtoBudgetGovernor = new VtoBudgetGovernor();
