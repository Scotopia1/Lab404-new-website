"use client";

import { useState } from "react";
import { History, RotateCcw, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useQuotationRevisions,
  useRestoreQuotationRevision,
  QuotationRevision,
} from "@/hooks/use-quotations";
import { formatCurrency, formatDate } from "@/lib/utils";

interface RevisionHistoryProps {
  quotationId: string;
  currentStatus: string;
}

function RevisionItem({
  revision,
  isLatest,
  onRestore,
  canRestore,
}: {
  revision: QuotationRevision;
  isLatest: boolean;
  onRestore: () => void;
  canRestore: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-lg">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium">Version {revision.versionNumber}</span>
                {isLatest && (
                  <Badge variant="secondary" className="text-xs">
                    Latest
                  </Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDate(revision.createdAt)}
                {revision.createdByName && ` by ${revision.createdByName}`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                {isOpen ? (
                  <>
                    Hide <ChevronUp className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    View <ChevronDown className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            {canRestore && !isLatest && (
              <Button variant="outline" size="sm" onClick={onRestore}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Restore
              </Button>
            )}
          </div>
        </div>
        <CollapsibleContent>
          <div className="border-t p-3 space-y-4 bg-muted/30">
            {/* Snapshot Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium mb-2">Customer</h4>
                <div className="text-sm">
                  <p>{revision.snapshot.customerName}</p>
                  <p className="text-muted-foreground">
                    {revision.snapshot.customerEmail}
                  </p>
                  {revision.snapshot.customerPhone && (
                    <p className="text-muted-foreground">
                      {revision.snapshot.customerPhone}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Pricing</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatCurrency(revision.snapshot.subtotal)}</span>
                  </div>
                  {revision.snapshot.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(revision.snapshot.discountAmount)}</span>
                    </div>
                  )}
                  {revision.snapshot.taxAmount && revision.snapshot.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax:</span>
                      <span>{formatCurrency(revision.snapshot.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium pt-1 border-t">
                    <span>Total:</span>
                    <span>{formatCurrency(revision.snapshot.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="text-sm font-medium mb-2">
                Items ({revision.snapshot.items.length})
              </h4>
              <div className="space-y-1">
                {revision.snapshot.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-sm py-1 border-b last:border-0"
                  >
                    <div>
                      <span>{item.name}</span>
                      <span className="text-muted-foreground ml-2">
                        × {item.quantity}
                      </span>
                    </div>
                    <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {revision.snapshot.notes && (
              <div>
                <h4 className="text-sm font-medium mb-1">Notes</h4>
                <p className="text-sm text-muted-foreground">
                  {revision.snapshot.notes}
                </p>
              </div>
            )}

            {/* Change Description */}
            {revision.changeDescription && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground italic">
                  Change: {revision.changeDescription}
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function RevisionHistory({ quotationId, currentStatus }: RevisionHistoryProps) {
  const { data: revisions, isLoading } = useQuotationRevisions(quotationId);
  const restoreRevision = useRestoreQuotationRevision();
  const [restoreId, setRestoreId] = useState<string | null>(null);

  const canRestore = currentStatus === "draft";

  const handleRestore = async () => {
    if (!restoreId) return;
    await restoreRevision.mutateAsync({
      quotationId,
      revisionId: restoreId,
    });
    setRestoreId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Revision History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Revision History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revisions && revisions.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {revisions.map((revision, index) => (
                  <RevisionItem
                    key={revision.id}
                    revision={revision}
                    isLatest={index === 0}
                    canRestore={canRestore}
                    onRestore={() => setRestoreId(revision.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No revision history available</p>
              <p className="text-sm mt-1">
                Revisions are created when you edit the quotation
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoreId} onOpenChange={() => setRestoreId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Revision</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore this quotation to a previous version?
              This will replace the current quotation data with the selected revision.
              A new revision will be created to preserve the current state before restoring.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={restoreRevision.isPending}
            >
              {restoreRevision.isPending ? "Restoring..." : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
