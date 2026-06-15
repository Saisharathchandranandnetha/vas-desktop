import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@vas/shared';
import { getDatabase, requestLogs, agents, providers, mcpServers } from '@vas/database';
import { sql, desc, eq } from 'drizzle-orm';

export function registerObservabilityHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.OBSERVABILITY_STATS, async () => {
    try {
      const db = getDatabase();

      // Aggregate stats
      const statsResult = db.select({
        totalRequests: sql<number>`count(*)`,
        totalTokens: sql<number>`sum(${requestLogs.totalTokens})`,
        totalCost: sql<number>`sum(${requestLogs.estimatedCost})`,
        avgLatencyMs: sql<number>`avg(${requestLogs.latencyMs})`,
      }).from(requestLogs).get();

      // RPM (last 1 minute)
      const oneMinuteAgo = new Date(Date.now() - 60000);
      const rpmResult = db.select({
        rpm: sql<number>`count(*)`
      }).from(requestLogs).where(sql`${requestLogs.createdAt} >= ${oneMinuteAgo}`).get();

      // Active counts
      const activeProvidersResult = db.select({ count: sql<number>`count(*)` }).from(providers).where(eq(providers.isEnabled, true)).get();
      const activeAgentsResult = db.select({ count: sql<number>`count(*)` }).from(agents).where(eq(agents.isRunning, true)).get();
      const activeMcpResult = db.select({ count: sql<number>`count(*)` }).from(mcpServers).where(eq(mcpServers.isRunning, true)).get();

      return {
        success: true,
        data: {
          totalRequests: statsResult?.totalRequests || 0,
          totalTokens: statsResult?.totalTokens || 0,
          totalCost: statsResult?.totalCost || 0,
          avgLatencyMs: Math.round(statsResult?.avgLatencyMs || 0),
          requestsPerMinute: rpmResult?.rpm || 0,
          activeProviders: activeProvidersResult?.count || 0,
          activeAgents: activeAgentsResult?.count || 0,
          activeMcpServers: activeMcpResult?.count || 0,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.OBSERVABILITY_RECENT, async (_event, limit?: number) => {
    try {
      const db = getDatabase();
      const numLimit = limit ?? 50;
      const recentLogs = db.select()
        .from(requestLogs)
        .orderBy(desc(requestLogs.createdAt))
        .limit(numLimit)
        .all();

      return { success: true, data: recentLogs };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
