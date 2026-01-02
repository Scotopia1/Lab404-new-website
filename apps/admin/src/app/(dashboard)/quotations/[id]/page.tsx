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
  Quotation,
} from "@/hooks/use-quotations";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { useState } from "react";

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

  const { data: quotation, isLoading } = useQuotation(id);
  const sendQuotation = useSendQuotation();
  const convertQuotation = useConvertQuotation();

  const handleConvert = async () => {
    const result = await convertQuotation.mutateAsync(id);
    setConvertOpen(false);
    router.push(`/orders/${result.orderId}`);
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
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              Created {formatDateTime(quotation.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {quotation.status === "draft" && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/quotations/${id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button onClick={() => sendQuotation.mutate(id)}>
                <Send className="mr-2 h-4 w-4" />
                Send to Customer
              </Button>
            </>
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
                    <div className="col-span-6 font-medium">
                      {item.productName}
                    </div>
                    <div className="col-span-2 text-right">
                      {formatCurrency(item.price)}
                    </div>
                    <div className="col-span-2 text-right">{item.quantity}</div>
                    <div className="col-span-2 text-right font-medium">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(quotation.subtotal)}</span>
                </div>
                {quotation.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(quotation.discount)}</span>
                  </div>
                )}
                {quotation.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(quotation.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-bold text-lg">
                  <span>Total</span>
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quotation.customer ? (
                <div className="space-y-2">
                  <div className="font-medium">
                    {quotation.customer.firstName} {quotation.customer.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {quotation.customer.email}
                  </div>
                  <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                    <Link href={`/customers/${quotation.customer.id}`}>
                      View customer profile
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">No customer assigned</p>
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
    </div>
  );
}
