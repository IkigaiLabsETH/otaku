import {
  logger,
  Service,
  type IAgentRuntime,
  type UUID,
} from '@elizaos/core';
import { desc, eq } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { leaderboardSnapshotsTable, pointBalancesTable } from '../schema';

interface RuntimeWithDb {
  db?: PgDatabase<PgQueryResultHKT>;
}

/**
 * LeaderboardService - Read-only service for leaderboard queries
 * 
 * SCHEDULING: Aggregation and weekly resets are handled by pg_cron jobs.
 * See: migrations/001_pg_cron_setup.sql
 * 
 * This service provides:
 * - Reading from pre-aggregated leaderboard snapshots (fast)
 * - Manual aggregation methods for testing/one-off runs
 */
export class LeaderboardService extends Service {
  static serviceType = 'leaderboard-sync';
  capabilityDescription = 'Reads leaderboard snapshots aggregated by pg_cron';

  private getDb(): PgDatabase<PgQueryResultHKT> | undefined {
    return (this.runtime as unknown as RuntimeWithDb).db;
  }

  /**
   * Check if a userId belongs to an agent (not a human user)
   */
  private isAgent(userId: UUID): boolean {
    return userId === this.runtime.agentId || userId === this.runtime.character.id;
  }

  static async start(runtime: IAgentRuntime): Promise<LeaderboardService> {
    const service = new LeaderboardService(runtime);
    logger.info('[LeaderboardService] Initialized (pg_cron handles scheduling)');
    return service;
  }

  /**
   * Get cached leaderboard from snapshots (fast - reads from pre-aggregated table)
   */
  async getCachedLeaderboard(scope: 'weekly' | 'all_time', limit = 100): Promise<Array<{
    rank: number;
    userId: string;
    points: number;
  }>> {
    const db = this.getDb();
    if (!db) {
      logger.error('[LeaderboardService] Database not available');
      return [];
    }

    const snapshots = await db
      .select({
        rank: leaderboardSnapshotsTable.rank,
        userId: leaderboardSnapshotsTable.userId,
        points: leaderboardSnapshotsTable.points,
      })
      .from(leaderboardSnapshotsTable)
      .where(eq(leaderboardSnapshotsTable.scope, scope))
      .orderBy(leaderboardSnapshotsTable.rank)
      .limit(limit);

    return snapshots.map(s => ({
      rank: s.rank,
      userId: s.userId,
      points: s.points,
    }));
  }

  /**
   * Get last snapshot timestamp
   */
  async getLastSnapshotTime(scope: 'weekly' | 'all_time'): Promise<Date | null> {
    const db = this.getDb();
    if (!db) return null;

    const [result] = await db
      .select({ snapshotAt: leaderboardSnapshotsTable.snapshotAt })
      .from(leaderboardSnapshotsTable)
      .where(eq(leaderboardSnapshotsTable.scope, scope))
      .orderBy(desc(leaderboardSnapshotsTable.snapshotAt))
      .limit(1);

    return result?.snapshotAt || null;
  }

  /**
   * Manual aggregation - useful for testing or one-off runs
   * In production, pg_cron handles this every 5 minutes
   */
  async aggregateSnapshots(): Promise<void> {
    const db = this.getDb();
    if (!db) {
      logger.error('[LeaderboardService] Database not available');
      return;
    }

    try {
      // Aggregate all-time leaderboard (excluding agents)
      const allTimeBalancesRaw = await db
        .select({
          userId: pointBalancesTable.userId,
          points: pointBalancesTable.allTimePoints,
        })
        .from(pointBalancesTable)
        .orderBy(desc(pointBalancesTable.allTimePoints));

      const allTimeBalances = allTimeBalancesRaw
        .filter((balance) => !this.isAgent(balance.userId as UUID))
        .slice(0, 100);

      // Aggregate weekly leaderboard (excluding agents)
      const weeklyBalancesRaw = await db
        .select({
          userId: pointBalancesTable.userId,
          points: pointBalancesTable.weeklyPoints,
        })
        .from(pointBalancesTable)
        .orderBy(desc(pointBalancesTable.weeklyPoints));

      const weeklyBalances = weeklyBalancesRaw
        .filter((balance) => !this.isAgent(balance.userId as UUID))
        .slice(0, 100);

      // Prepare batch inserts
      const allTimeSnapshots = allTimeBalances.map((balance, i) => ({
        scope: 'all_time' as const,
        rank: i + 1,
        userId: balance.userId,
        points: balance.points,
      }));

      const weeklySnapshots = weeklyBalances.map((balance, i) => ({
        scope: 'weekly' as const,
        rank: i + 1,
        userId: balance.userId,
        points: balance.points,
      }));

      // Use transaction for atomicity
      await db.transaction(async (tx) => {
        await tx.delete(leaderboardSnapshotsTable).where(eq(leaderboardSnapshotsTable.scope, 'all_time'));
        await tx.delete(leaderboardSnapshotsTable).where(eq(leaderboardSnapshotsTable.scope, 'weekly'));

        if (allTimeSnapshots.length > 0) {
          await tx.insert(leaderboardSnapshotsTable).values(allTimeSnapshots);
        }
        if (weeklySnapshots.length > 0) {
          await tx.insert(leaderboardSnapshotsTable).values(weeklySnapshots);
        }
      });

      logger.debug('[LeaderboardService] Manual snapshot aggregation completed');
    } catch (error) {
      logger.error({ error }, '[LeaderboardService] Error in aggregateSnapshots');
      throw error;
    }
  }

  /**
   * Manual weekly reset - useful for testing
   * In production, pg_cron handles this every Monday at 00:00 UTC
   * Note: Mirrors the cron job behavior (updates updatedAt)
   */
  async resetWeeklyPoints(): Promise<void> {
    const db = this.getDb();
    if (!db) {
      logger.error('[LeaderboardService] Database not available');
      return;
    }

    await db
      .update(pointBalancesTable)
      .set({ 
        weeklyPoints: 0,
        updatedAt: new Date(),
      });

    logger.info('[LeaderboardService] Manual weekly points reset completed');
  }

  async stop(): Promise<void> {
    logger.info('[LeaderboardService] Stopped');
  }
}
