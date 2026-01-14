import { getDb, quotations, quotationItems, quotationRevisions, eq, desc, sql } from '@lab404/database';
import { logger } from '../utils/logger';

interface RevisionSnapshot {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerCompany?: string | null;
  status: string;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discountType?: string | null;
  discountValue?: number;
  discountAmount: number;
  total: number;
  validUntil?: Date | null;
  notes?: string | null;
  termsAndConditions?: string | null;
  items: Array<{
    productId?: string | null;
    variantId?: string | null;
    name: string;
    description?: string | null;
    sku?: string | null;
    quantity: number;
    unitPrice: number;
  }>;
}

interface Revision {
  id: string;
  quotationId: string;
  versionNumber: number;
  snapshot: RevisionSnapshot;
  changeDescription: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date;
}

class QuotationRevisionService {
  /**
   * Create a revision snapshot before updating a quotation
   */
  async createRevision(
    quotationId: string,
    changeDescription?: string,
    createdBy?: string,
    createdByName?: string
  ): Promise<void> {
    try {
      const db = getDb();

      // Get current quotation state
      const [quotation] = await db
        .select()
        .from(quotations)
        .where(eq(quotations.id, quotationId));

      if (!quotation) {
        logger.warn('Cannot create revision: Quotation not found', { quotationId });
        return;
      }

      // Get current items
      const items = await db
        .select()
        .from(quotationItems)
        .where(eq(quotationItems.quotationId, quotationId));

      // Get the next version number
      const [lastRevision] = await db
        .select({ maxVersion: sql<number>`COALESCE(MAX(${quotationRevisions.versionNumber}), 0)` })
        .from(quotationRevisions)
        .where(eq(quotationRevisions.quotationId, quotationId));

      const nextVersion = (lastRevision?.maxVersion || 0) + 1;

      // Create snapshot
      const snapshot: RevisionSnapshot = {
        customerName: quotation.customerName,
        customerEmail: quotation.customerEmail,
        customerPhone: quotation.customerPhone,
        customerCompany: quotation.customerCompany,
        status: quotation.status,
        subtotal: Number(quotation.subtotal),
        taxRate: quotation.taxRate ? Number(quotation.taxRate) : undefined,
        taxAmount: quotation.taxAmount ? Number(quotation.taxAmount) : undefined,
        discountType: quotation.discountType,
        discountValue: quotation.discountValue ? Number(quotation.discountValue) : undefined,
        discountAmount: Number(quotation.discountAmount),
        total: Number(quotation.total),
        validUntil: quotation.validUntil,
        notes: quotation.notes,
        termsAndConditions: quotation.termsAndConditions,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          description: item.description,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
      };

      // Save revision
      await db.insert(quotationRevisions).values({
        quotationId,
        versionNumber: nextVersion,
        snapshot,
        changeDescription,
        createdBy,
        createdByName,
      });

      logger.debug('Revision created', {
        quotationId,
        versionNumber: nextVersion,
      });
    } catch (error) {
      // Don't throw - revision creation should not break main flow
      logger.error('Failed to create revision', { error, quotationId });
    }
  }

  /**
   * Get all revisions for a quotation
   */
  async getRevisions(quotationId: string): Promise<Revision[]> {
    const db = getDb();

    const revisions = await db
      .select()
      .from(quotationRevisions)
      .where(eq(quotationRevisions.quotationId, quotationId))
      .orderBy(desc(quotationRevisions.versionNumber));

    return revisions as Revision[];
  }

  /**
   * Get a specific revision
   */
  async getRevision(revisionId: string): Promise<Revision | null> {
    const db = getDb();

    const [revision] = await db
      .select()
      .from(quotationRevisions)
      .where(eq(quotationRevisions.id, revisionId));

    return (revision as Revision) || null;
  }

  /**
   * Compare two revisions or a revision with current state
   */
  async compareRevisions(
    quotationId: string,
    revisionIdA: string,
    revisionIdB?: string // If not provided, compare with current state
  ): Promise<{
    versionA: number | 'current';
    versionB: number | 'current';
    snapshotA: RevisionSnapshot;
    snapshotB: RevisionSnapshot;
    changes: Array<{
      field: string;
      oldValue: unknown;
      newValue: unknown;
    }>;
  } | null> {
    const db = getDb();

    // Get revision A
    const revisionA = await this.getRevision(revisionIdA);
    if (!revisionA) {return null;}

    let snapshotB: RevisionSnapshot;
    let versionB: number | 'current';

    if (revisionIdB) {
      // Compare with another revision
      const revisionB = await this.getRevision(revisionIdB);
      if (!revisionB) {return null;}
      snapshotB = revisionB.snapshot;
      versionB = revisionB.versionNumber;
    } else {
      // Compare with current state
      const [quotation] = await db
        .select()
        .from(quotations)
        .where(eq(quotations.id, quotationId));

      if (!quotation) {return null;}

      const items = await db
        .select()
        .from(quotationItems)
        .where(eq(quotationItems.quotationId, quotationId));

      snapshotB = {
        customerName: quotation.customerName,
        customerEmail: quotation.customerEmail,
        customerPhone: quotation.customerPhone,
        customerCompany: quotation.customerCompany,
        status: quotation.status,
        subtotal: Number(quotation.subtotal),
        taxRate: quotation.taxRate ? Number(quotation.taxRate) : undefined,
        taxAmount: quotation.taxAmount ? Number(quotation.taxAmount) : undefined,
        discountType: quotation.discountType,
        discountValue: quotation.discountValue ? Number(quotation.discountValue) : undefined,
        discountAmount: Number(quotation.discountAmount),
        total: Number(quotation.total),
        validUntil: quotation.validUntil,
        notes: quotation.notes,
        termsAndConditions: quotation.termsAndConditions,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          description: item.description,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
      };
      versionB = 'current';
    }

    // Compute changes
    const changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];

    const fieldsToCompare = [
      'customerName',
      'customerEmail',
      'customerPhone',
      'customerCompany',
      'status',
      'subtotal',
      'taxRate',
      'taxAmount',
      'discountType',
      'discountValue',
      'discountAmount',
      'total',
      'notes',
      'termsAndConditions',
    ];

    for (const field of fieldsToCompare) {
      const oldValue = (revisionA.snapshot as unknown as Record<string, unknown>)[field];
      const newValue = (snapshotB as unknown as Record<string, unknown>)[field];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ field, oldValue, newValue });
      }
    }

    // Compare items (simplified - just check if different)
    if (JSON.stringify(revisionA.snapshot.items) !== JSON.stringify(snapshotB.items)) {
      changes.push({
        field: 'items',
        oldValue: `${revisionA.snapshot.items.length} items`,
        newValue: `${snapshotB.items.length} items`,
      });
    }

    return {
      versionA: revisionA.versionNumber,
      versionB,
      snapshotA: revisionA.snapshot,
      snapshotB,
      changes,
    };
  }

  /**
   * Restore a quotation to a previous revision
   */
  async restoreRevision(
    quotationId: string,
    revisionId: string,
    restoredBy?: string,
    restoredByName?: string
  ): Promise<boolean> {
    const db = getDb();

    const revision = await this.getRevision(revisionId);
    if (!revision || revision.quotationId !== quotationId) {
      return false;
    }

    // Create a revision of current state before restoring
    await this.createRevision(
      quotationId,
      `Restored from version ${revision.versionNumber}`,
      restoredBy,
      restoredByName
    );

    // Delete current items
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId));

    // Restore quotation fields
    await db
      .update(quotations)
      .set({
        customerName: revision.snapshot.customerName,
        customerEmail: revision.snapshot.customerEmail,
        customerPhone: revision.snapshot.customerPhone,
        customerCompany: revision.snapshot.customerCompany,
        status: revision.snapshot.status as 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired',
        subtotal: String(revision.snapshot.subtotal),
        taxRate: revision.snapshot.taxRate ? String(revision.snapshot.taxRate) : null,
        taxAmount: revision.snapshot.taxAmount ? String(revision.snapshot.taxAmount) : null,
        discountType: revision.snapshot.discountType,
        discountValue: revision.snapshot.discountValue ? String(revision.snapshot.discountValue) : null,
        discountAmount: String(revision.snapshot.discountAmount),
        total: String(revision.snapshot.total),
        notes: revision.snapshot.notes,
        termsAndConditions: revision.snapshot.termsAndConditions,
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quotationId));

    // Restore items
    for (const item of revision.snapshot.items) {
      await db.insert(quotationItems).values({
        quotationId,
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        description: item.description,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: String(item.unitPrice),
      });
    }

    logger.info('Quotation restored from revision', {
      quotationId,
      revisionId,
      versionNumber: revision.versionNumber,
    });

    return true;
  }
}

export const quotationRevisionService = new QuotationRevisionService();
