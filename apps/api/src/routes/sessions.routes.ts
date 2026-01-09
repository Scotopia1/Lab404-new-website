import { Router, Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/session.service';
import { requireAuth } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const sessionsRoutes = Router();

/**
 * GET /api/auth/sessions
 * List all active sessions for current user
 */
sessionsRoutes.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = req.user?.customerId;
      const currentSessionId = req.user?.sessionId;

      if (!customerId) {
        return sendError(res, 'Customer ID not found', 400);
      }

      // Get all active sessions
      const sessions = await sessionService.getActiveSessions(customerId);

      // Add isCurrent flag
      const sessionsWithCurrent = sessions.map((session) => ({
        ...session,
        isCurrent: session.id === currentSessionId,
      }));

      sendSuccess(res, {
        sessions: sessionsWithCurrent,
        currentSessionId,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke specific session
 */
sessionsRoutes.delete(
  '/:sessionId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const customerId = req.user?.customerId;

      if (!customerId) {
        return sendError(res, 'Customer ID not found', 400);
      }

      // Verify session belongs to customer
      const sessions = await sessionService.getActiveSessions(customerId);
      const session = sessions.find((s) => s.id === sessionId);

      if (!session) {
        return sendError(res, 'Session not found or already revoked', 404);
      }

      // Revoke session
      await sessionService.revokeSession(sessionId, 'user_action');

      logger.info('Session revoked via API', {
        sessionId,
        customerId,
        deviceName: session.deviceName,
      });

      sendSuccess(res, { message: 'Session revoked successfully' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/sessions/logout-others
 * Logout all other sessions except current
 */
sessionsRoutes.post(
  '/logout-others',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = req.user?.customerId;
      const currentSessionId = req.user?.sessionId;

      if (!customerId || !currentSessionId) {
        return sendError(res, 'Session information not found', 400);
      }

      const count = await sessionService.revokeOtherSessions(customerId, currentSessionId);

      logger.info('Other sessions revoked', { customerId, count });

      sendSuccess(res, {
        message: `${count} session(s) logged out successfully`,
        count,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/sessions/logout-all
 * Logout all sessions including current
 */
sessionsRoutes.post(
  '/logout-all',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customerId = req.user?.customerId;

      if (!customerId) {
        return sendError(res, 'Customer ID not found', 400);
      }

      const count = await sessionService.revokeAllSessions(customerId);

      // Clear current cookie
      res.clearCookie('auth_token');

      logger.info('All sessions revoked', { customerId, count });

      sendSuccess(res, {
        message: `All ${count} session(s) logged out successfully`,
        count,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { sessionsRoutes };
