import type { ElizaOS } from '@elizaos/core';
import { logger } from '@elizaos/core';
import express from 'express';
import { requireAuth, requireAdmin, type AuthenticatedRequest } from '../../middleware';
import type { AgentServer } from '../../index';

/**
 * Health monitoring and status endpoints
 */
export function createHealthRouter(elizaOS: ElizaOS, serverInstance: AgentServer): express.Router {
  const router = express.Router();

  // Health check
  router.get('/ping', (_req, res) => {
    res.json({ pong: true, timestamp: Date.now() });
  });

  // Hello world endpoint
  router.get('/hello', (_req, res) => {
    logger.info('Hello endpoint hit');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ message: 'Hello World!' }));
  });

  // System status endpoint
  router.get('/status', (_req, res) => {
    logger.info('Status endpoint hit');
    res.setHeader('Content-Type', 'application/json');
    res.send(
      JSON.stringify({
        status: 'ok',
        agentCount: elizaOS.getAgents().length,
        timestamp: new Date().toISOString(),
      })
    );
  });

  // Comprehensive health check - verifies server and database connectivity
  // Returns agent list similar to /api/agents for Railway healthcheck
  router.get('/health', async (_req, res) => {
    logger.log({ apiRoute: '/health' }, 'Health check route hit');
    const db = serverInstance?.database;
    
    // Prevent 304 responses - always return fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    try {
      if (!db) {
        return res.status(503).json({
          success: false,
          error: { code: 'DB_ERROR', message: 'Database not available' },
        });
      }
      
      // Query agents to verify database connectivity (same as /api/agents)
      const allAgents = await db.getAgents();
      const runtimes = elizaOS.getAgents().map((a) => a.agentId);

      const agents = allAgents
        .map((agent: any) => ({
          id: agent.id,
          name: agent.name || '',
          status: agent.id && runtimes.includes(agent.id) ? 'active' : 'inactive',
        }))
        .filter((agent: any) => agent.id);

      res.status(200).json({ success: true, data: { agents } });
    } catch (error) {
      logger.error('[Health] Database connectivity check failed:', error);
      res.status(503).json({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Database connection failed',
          details: error instanceof Error ? error.message : String(error),
        },
      });
    }
  });

  // Server stop endpoint (admin only)
  router.post('/stop', requireAuth as any, requireAdmin as any, (_req: AuthenticatedRequest, res) => {
    logger.log({ apiRoute: '/stop' }, 'Server stopping...');
    serverInstance?.stop(); // Use optional chaining in case server is undefined
    res.json({ message: 'Server stopping...' });
  });

  return router;
}
