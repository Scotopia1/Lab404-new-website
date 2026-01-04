import { getDb, quotationActivities, desc, eq } from '@lab404/database';
import { logger } from '../utils/logger';

type ActivityType =
  | 'created'
  | 'updated'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted'
  | 'duplicated'
  | 'pdf_generated'
  | 'note_added'
  | 'status_changed';

type ActorType = 'system' | 'admin' | 'customer';

interface LogActivityParams {
  quotationId: string;
  activityType: ActivityType;
  description: string;
  actorType?: ActorType;
  actorId?: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
}

interface Activity {
  id: string;
  quotationId: string;
  activityType: string;
  description: string;
  actorType: string;
  actorId: string | null;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

class QuotationActivityService {
  /**
   * Log an activity for a quotation
   */
  async logActivity(params: LogActivityParams): Promise<void> {
    try {
      const db = getDb();

      await db.insert(quotationActivities).values({
        quotationId: params.quotationId,
        activityType: params.activityType,
        description: params.description,
        actorType: params.actorType || 'system',
        actorId: params.actorId,
        actorName: params.actorName,
        metadata: params.metadata,
      });

      logger.debug('Activity logged', {
        quotationId: params.quotationId,
        activityType: params.activityType,
      });
    } catch (error) {
      // Don't throw - activity logging should not break main flow
      logger.error('Failed to log activity', { error, params });
    }
  }

  /**
   * Get activities for a quotation
   */
  async getActivities(quotationId: string, limit = 50): Promise<Activity[]> {
    const db = getDb();

    const activities = await db
      .select()
      .from(quotationActivities)
      .where(eq(quotationActivities.quotationId, quotationId))
      .orderBy(desc(quotationActivities.createdAt))
      .limit(limit);

    return activities as Activity[];
  }

  // Helper methods for common activity types

  async logCreated(quotationId: string, quotationNumber: string, actorName?: string): Promise<void> {
    await this.logActivity({
      quotationId,
      activityType: 'created',
      description: `Quotation ${quotationNumber} was created`,
      actorType: actorName ? 'admin' : 'system',
      actorName,
      metadata: { quotationNumber },
    });
  }

  async logUpdated(quotationId: string, quotationNumber: string, changes?: string[], actorName?: string): Promise<void> {
    const description = changes?.length
      ? `Quotation updated: ${changes.join(', ')}`
      : `Quotation ${quotationNumber} was updated`;

    await this.logActivity({
      quotationId,
      activityType: 'updated',
      description,
      actorType: actorName ? 'admin' : 'system',
      actorName,
      metadata: { changes },
    });
  }

  async logSent(quotationId: string, recipientEmail: string, actorName?: string): Promise<void> {
    await this.logActivity({
      quotationId,
      activityType: 'sent',
      description: `Quotation sent to ${recipientEmail}`,
      actorType: actorName ? 'admin' : 'system',
      actorName,
      metadata: { recipientEmail },
    });
  }

  async logViewed(quotationId: string, viewerInfo?: string): Promise<void> {
    await this.logActivity({
      quotationId,
      activityType: 'viewed',
      description: viewerInfo ? `Quotation viewed by ${viewerInfo}` : 'Quotation was viewed',
      actorType: 'customer',
      metadata: { viewerInfo },
    });
  }

  async logAccepted(quotationId: string, customerName?: string): Promise<void> {
    await this.logActivity({
      quotationId,
      activityType: 'accepted',
      description: customerName
        ? `Quotation accepted by ${customerName}`
        : 'Quotation was accepted',
      actorType: 'customer',
      actorName: customerName,
    });
  }

  async logRejected(quotationId: string, reason?: string, customerName?: string): Promise<void> {
    await this.logActivity({
      quotationId,
      activityType: 'rejected',
      description: reason
        ? `Quotation rejected: ${reason}`
        : 'Quotation was rejected',
      actorType: 'customer',
      actorName: customerName,
      metadata: { reason },
    });
  }

  async logExpired(quotationId: string): Promise<void> {
    await this.logActivity({
      quotationId,
      activityType: 'expired',
      description: 'Quotation has expired',
      actorType: 'system',
    });
  }

  async logConverted(quotationId: string, orderId: string, orderNumber: string, actorName?: string): Promise<void> {
    await this.logActivity({
      quotationId,
      activityType: 'converted',
      description: `Quotation converted to order ${orderNumber}`,
      actorType: actorName ? 'admin' : 'system',
      actorName,
      metadata: { orderId, orderNumber },
    });
  }

  async logDuplicated(quotationId: string, newQuotationId: string, newQuotationNumber: string, actorName?: string): Promise<void> {
    await this.logActivity({
      quotationId,
      activityType: 'duplicated',
      description: `Quotation duplicated as ${newQuotationNumber}`,
      actorType: actorName ? 'admin' : 'system',
      actorName,
      metadata: { newQuotationId, newQuotationNumber },
    });
  }

  async logPdfGenerated(quotationId: string): Promise<void> {
    await this.logActivity({
      quotationId,
      activityType: 'pdf_generated',
      description: 'PDF was generated',
      actorType: 'system',
    });
  }

  async logStatusChanged(quotationId: string, oldStatus: string, newStatus: string, actorName?: string): Promise<void> {
    await this.logActivity({
      quotationId,
      activityType: 'status_changed',
      description: `Status changed from ${oldStatus} to ${newStatus}`,
      actorType: actorName ? 'admin' : 'system',
      actorName,
      metadata: { oldStatus, newStatus },
    });
  }
}

export const quotationActivityService = new QuotationActivityService();
