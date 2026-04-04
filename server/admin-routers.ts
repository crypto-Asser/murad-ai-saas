import { protectedProcedure, router } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import {
  getTelegramUserCount,
  getConversationCount,
  getAllUsers,
  getUserConversations
} from './db';
import { logger, performanceMonitor, errorTracker, getSystemStatus } from './logging';
import { startBot, stopBot, getBotStats } from './telegram-bot';

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // Dashboard stats
  getStats: adminProcedure.query(async () => {
    try {
      const telegramUsers = await getTelegramUserCount();
      const conversations = await getConversationCount();
      const botStats = getBotStats();
      const systemStatus = getSystemStatus();

      return {
        telegram: {
          totalUsers: telegramUsers,
          activeUsers: botStats.activeUsers,
          queueLength: botStats.queueLength
        },
        conversations: conversations,
        system: {
          uptime: systemStatus.uptime,
          memory: systemStatus.memory,
          errors: systemStatus.errors
        }
      };
    } catch (error) {
      logger.error('Failed to get stats', error as Error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }
  }),

  // Bot control
  startBot: adminProcedure.mutation(async () => {
    try {
      await startBot();
      logger.info('Bot started by admin');
      return { success: true, message: 'Bot started successfully' };
    } catch (error) {
      logger.error('Failed to start bot', error as Error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to start bot' });
    }
  }),

  stopBot: adminProcedure.mutation(async () => {
    try {
      await stopBot();
      logger.info('Bot stopped by admin');
      return { success: true, message: 'Bot stopped successfully' };
    } catch (error) {
      logger.error('Failed to stop bot', error as Error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to stop bot' });
    }
  }),

  // User management
  getAllUsers: adminProcedure.query(async () => {
    try {
      const users = await getAllUsers();
      return users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastSignedIn: user.lastSignedIn
      }));
    } catch (error) {
      logger.error('Failed to get users', error as Error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }
  }),

  // Conversation history
  getUserConversations: adminProcedure
    .input((val: any) => ({
      telegramUserId: val.telegramUserId as number,
      limit: (val.limit || 10) as number
    }))
    .query(async ({ input }) => {
      try {
        const conversations = await getUserConversations(input.telegramUserId, input.limit);
        return conversations;
      } catch (error) {
        logger.error('Failed to get conversations', error as Error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }
    }),

  // System health
  getSystemStatus: adminProcedure.query(async () => {
    try {
      const status = getSystemStatus();
      return {
        uptime: status.uptime,
        memory: {
          heapUsed: status.memory.heapUsed,
          heapTotal: status.memory.heapTotal,
          external: status.memory.external
        },
        errors: status.errors,
        metrics: status.metrics,
        recentLogs: status.recentLogs.map(log => ({
          timestamp: log.timestamp,
          level: log.level,
          message: log.message
        }))
      };
    } catch (error) {
      logger.error('Failed to get system status', error as Error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }
  }),

  // Logs
  getLogs: adminProcedure
    .input((val: any) => ({
      limit: (val.limit || 50) as number
    }))
    .query(async ({ input }) => {
      try {
        return logger.getLogs(input.limit);
      } catch (error) {
        logger.error('Failed to get logs', error as Error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }
    }),

  // Error tracking
  getErrors: adminProcedure
    .input((val: any) => ({
      limit: (val.limit || 50) as number
    }))
    .query(async ({ input }) => {
      try {
        return errorTracker.getErrors(input.limit);
      } catch (error) {
        logger.error('Failed to get errors', error as Error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }
    }),

  getErrorStats: adminProcedure.query(async () => {
    try {
      return errorTracker.getErrorStats();
    } catch (error) {
      logger.error('Failed to get error stats', error as Error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }
  }),

  // Performance metrics
  getMetrics: adminProcedure.query(async () => {
    try {
      return performanceMonitor.getAllMetrics();
    } catch (error) {
      logger.error('Failed to get metrics', error as Error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }
  })
});
