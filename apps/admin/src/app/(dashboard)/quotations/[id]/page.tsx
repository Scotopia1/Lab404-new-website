"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Pencil,
  Send,
  ShoppingCart,
  ArrowLeft,
  User,
  Calendar,
  FileText,
  Download,
  Phone,
  Building,
  Copy,
  MapPin,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
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
  useQuotation,
  useSendQuotation,
  useConvertQuotation,
  useDuplicateQuotation,
  useUpdateQuotation,
  Quotation,
} from "@/hooks/use-quotations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityTimeline } from "@/components/quotations/activity-timeline";
import { RevisionHistory } from "@/components/quotations/revision-history";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { useState } from "react";
import { toast } from "sonner";

const statusConfig: Record<
  Quotation["status"],
  { label: string; variant: "default" | "secondary" | "success" | "destructive" | "warning" | "info" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "info" },
  accepted: { label: "Accepted", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  expired: { label: "Expired", variant: "warning" },
  converted: { label: "Converted", variant: "default" },
};

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [convertOpen, setConvertOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusChangeOpen, setStatusChangeOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Quotation["status"] | null>(null);

  const { data: quotation, isLoading } = useQuotation(id);
  const sendQuotation = useSendQuotation();
  const convertQuotation = useConvertQuotation();
  const duplicateQuotation = useDuplicateQuotation();
  const updateQuotation = useUpdateQuotation();

  const handleConvert = async () => {
    const result = await convertQuotation.mutateAsync(id);
    setConvertOpen(false);
    router.push(`/orders/${result.orderId}`);
  };

  const handleDuplicate = async () => {
    const result = await duplicateQuotation.mutateAsync(id);
    router.push(`/quotations/${result.id}/edit`);
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === quotation?.status) return;
    setPendingStatus(newStatus as Quotation["status"]);
    setStatusChangeOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus || pendingStatus === "converted") return;
    try {
      await updateQuotation.mutateAsync({
        id,
        data: { status: pendingStatus as "draft" | "sent" | "accepted" | "rejected" | "expired" },
      });
      toast.success(`Status changed to ${statusConfig[pendingStatus].label}`);
    } catch {
      toast.error("Failed to change status");
    } finally {
      setStatusChangeOpen(false);
      setPendingStatus(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!quotation) return;

    setIsDownloading(true);
    try {
      const response = await api.get(`/quotations/${id}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation-${quotation.quotationNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully');
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quotation) {
    return <div>Quotation not found</div>;
  }

  const config = statusConfig[quotation.status];

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {quotation.quotationNumber}
              </h1>
              {quotation.status === "draft" || quotation.status === "converted" ? (
                <Badge variant={config.variant}>{config.label}</Badge>
              ) : (
                <Select
                  value={quotation.status}
                  onValueChange={handleStatusChange}
                  disabled={updateQuotation.isPending}
                >
                  <SelectTrigger className="w-[140px] h-7">
                    <Badge variant={config.variant} className="mr-1">
                      {config.label}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sent">
                      <div className="flex items-center gap-2">
                        <Badge variant="info" className="text-xs">Sent</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="accepted">
                      <div className="flex items-center gap-2">
                        <Badge variant="success" className="text-xs">Accepted</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">Rejected</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="expired">
                      <div className="flex items-center gap-2">
                        <Badge variant="warning" className="text-xs">Expired</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <p className="text-muted-foreground">
              Created {formatDateTime(quotation.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {quotation.status === "draft" && (
            <Button variant="outline" asChild>
              <Link href={`/quotations/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDuplicate}
            disabled={duplicateQuotation.isPending}
          >
            <Copy className="mr-2 h-4 w-4" />
            {duplicateQuotation.isPending ? "Duplicating..." : "Duplicate"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isDownloading ? "Downloading..." : "Download PDF"}
          </Button>
          {quotation.status === "draft" && (
            <Button
              onClick={() => sendQuotation.mutate(id)}
              disabled={sendQuotation.isPending}
            >
              <Send className="mr-2 h-4 w-4" />
              {sendQuotation.isPending ? "Sending..." : "Send to Customer"}
            </Button>
          )}
          {quotation.status === "accepted" && (
            <Button onClick={() => setConvertOpen(true)}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Convert to Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                {quotation.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-0"
                  >
                    <div className="col-span-6">
                      <div className="font-medium">{item.name}</div>
                      {item.sku && (
                        <div className="text-xs text-muted-foreground">
                          SKU: {item.sku}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 text-right">
                      {formatCurrency(item.unitPrice)}
                    </div>
                    <div className="col-span-2 text-right">{item.quantity}</div>
                    <div className="col-span-2 text-right font-medium">
                      {formatCurrency(item.lineTotal)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(quotation.subtotal)}</span>
                </div>
                {quotation.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(quotation.discountAmount)}</span>
                  </div>
                )}
                {quotation.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tax ({((quotation.taxRate || 0) * 100).toFixed(0)}%)
                    </span>
                    <span>{formatCurrency(quotation.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-bold text-lg">
                  <span>Total ({quotation.currency || "USD"})</span>
                  <span>{formatCurrency(quotation.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {quotation.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{quotation.notes}</p>
              </CardContent>
            </Card>
          )}

          {quotation.termsAndConditions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Terms & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: quotation.termsAndConditions }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Customer name and email */}
              <div>
                <div className="font-medium">
                  {quotation.customer
                    ? `${quotation.customer.firstName} ${quotation.customer.lastName}`
                    : quotation.customerName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {quotation.customer?.email || quotation.customerEmail}
                </div>
              </div>

              {/* Phone */}
              {quotation.customerPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{quotation.customerPhone}</span>
                </div>
              )}

              {/* Company */}
              {quotation.customerCompany && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{quotation.customerCompany}</span>
                </div>
              )}

              {/* Address */}
              {quotation.customerAddress && (
                <div className="flex gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    {quotation.customerAddress.addressLine1 && (
                      <div>{quotation.customerAddress.addressLine1}</div>
                    )}
                    {quotation.customerAddress.addressLine2 && (
                      <div>{quotation.customerAddress.addressLine2}</div>
                    )}
                    {(quotation.customerAddress.city ||
                      quotation.customerAddress.state ||
                      quotation.customerAddress.postalCode) && (
                      <div>
                        {[
                          quotation.customerAddress.city,
                          quotation.customerAddress.state,
                          quotation.customerAddress.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                    {quotation.customerAddress.country && (
                      <div>{quotation.customerAddress.country}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Link to customer profile if linked */}
              {quotation.customer && (
                <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                  <Link href={`/customers/${quotation.customer.id}`}>
                    View customer profile
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Validity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(quotation.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valid Until</span>
                <span>
                  {quotation.validUntil
                    ? formatDate(quotation.validUntil)
                    : "No expiry"}
                </span>
              </div>
              {quotation.validUntil && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days Left</span>
                  <span>
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(quotation.validUntil).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )}{" "}
                    days
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span>{quotation.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Quantity</span>
                <span>
                  {quotation.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total Value</span>
                <span>{formatCurrency(quotation.total)}</span>
              </div>
            </CardContent>
          </Card>

          <ActivityTimeline quotationId={id} />

          <RevisionHistory quotationId={id} currentStatus={quotation.status} />
        </div>
      </div>

      <AlertDialog open={convertOpen} onOpenChange={setConvertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Order</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new order based on this quotation. The quotation
              status will be changed to "Converted" and you will be redirected to
              the new order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert}>
              Convert to Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={statusChangeOpen} onOpenChange={setStatusChangeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Quotation Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status from{" "}
              <Badge variant={config.variant} className="mx-1">
                {config.label}
              </Badge>{" "}
              to{" "}
              {pendingStatus && (
                <Badge variant={statusConfig[pendingStatus].variant} className="mx-1">
                  {statusConfig[pendingStatus].label}
                </Badge>
              )}
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={updateQuotation.isPending}
            >
              {updateQuotation.isPending ? "Changing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
