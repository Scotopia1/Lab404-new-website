"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  Download,
  Loader2,
  Calendar,
  AlertTriangle,
  Building,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import { format } from "date-fns";

interface QuotationItem {
  name: string;
  description: string | null;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface QuotationData {
  id: string;
  quotationNumber: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string | null;
  items: QuotationItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  notes: string | null;
  termsAndConditions: string | null;
  validUntil: string | null;
  createdAt: string;
  company: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    website: string | null;
  };
  canAccept: boolean;
  canReject: boolean;
}

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Draft", color: "text-gray-700", bgColor: "bg-gray-100" },
  sent: { label: "Awaiting Response", color: "text-blue-700", bgColor: "bg-blue-100" },
  accepted: { label: "Accepted", color: "text-green-700", bgColor: "bg-green-100" },
  rejected: { label: "Rejected", color: "text-red-700", bgColor: "bg-red-100" },
  expired: { label: "Expired", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  converted: { label: "Converted to Order", color: "text-emerald-700", bgColor: "bg-emerald-100" },
};

export default function QuotationViewPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionComplete, setActionComplete] = useState<"accepted" | "rejected" | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

  useEffect(() => {
    async function fetchQuotation() {
      try {
        const response = await api.get(`/quotations/public/${token}`);
        setQuotation(response.data.data);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
              "Failed to load quotation";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchQuotation();
    }
  }, [token]);

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await api.post(`/quotations/public/${token}/accept`);
      setActionComplete("accepted");
      setQuotation((prev) => prev ? { ...prev, status: "accepted", canAccept: false, canReject: false } : null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Failed to accept quotation";
      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await api.post(`/quotations/public/${token}/reject`, { reason: rejectReason });
      setActionComplete("rejected");
      setShowRejectModal(false);
      setQuotation((prev) => prev ? { ...prev, status: "rejected", canAccept: false, canReject: false } : null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Failed to reject quotation";
      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Unable to Load Quotation</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <p className="mt-4 text-sm text-gray-500">
            If you believe this is an error, please contact us at{" "}
            <a href="mailto:support@lab404electronics.com" className="text-blue-600 hover:underline">
              support@lab404electronics.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return null;
  }

  const statusInfo = statusConfig[quotation.status] || statusConfig.draft;
  const isExpired = quotation.validUntil && new Date(quotation.validUntil) < new Date();

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            {quotation.company.name}
          </h1>
          {quotation.company.website && (
            <a
              href={quotation.company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
            >
              <Globe className="h-3 w-3" />
              {quotation.company.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>

      {/* Success/Action Complete Message */}
      {actionComplete && (
        <div className="max-w-4xl mx-auto mb-6">
          <div
            className={cn(
              "p-4 rounded-lg text-center",
              actionComplete === "accepted" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            )}
          >
            {actionComplete === "accepted" ? (
              <>
                <CheckCircle className="h-10 w-10 text-green-600 mx-auto" />
                <h2 className="mt-2 text-lg font-semibold text-green-800">Quotation Accepted!</h2>
                <p className="text-green-700 text-sm">
                  Thank you for accepting this quotation. We will be in touch shortly to process your order.
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-10 w-10 text-red-600 mx-auto" />
                <h2 className="mt-2 text-lg font-semibold text-red-800">Quotation Declined</h2>
                <p className="text-red-700 text-sm">
                  We&apos;ve noted your decision. If you&apos;d like to discuss alternative options, please contact us.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Quotation Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Quotation {quotation.quotationNumber}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Prepared for: {quotation.customerName}
                  {quotation.customerCompany && ` (${quotation.customerCompany})`}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
                    statusInfo.bgColor,
                    statusInfo.color
                  )}
                >
                  {statusInfo.label}
                </span>
                {quotation.validUntil && (
                  <p className={cn("text-sm mt-2", isExpired ? "text-red-600" : "text-gray-600")}>
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {isExpired ? "Expired: " : "Valid until: "}
                    {format(new Date(quotation.validUntil), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="px-6 py-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 pr-4 text-sm font-medium text-gray-500">Item</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Price</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Qty</th>
                    <th className="text-right py-3 pl-4 text-sm font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quotation.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-4 pr-4">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        {item.sku && <div className="text-xs text-gray-500">SKU: {item.sku}</div>}
                        {item.description && (
                          <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-700">
                        {formatCurrency(item.unitPrice, quotation.currency)}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-700">{item.quantity}</td>
                      <td className="py-4 pl-4 text-right font-medium text-gray-900">
                        {formatCurrency(item.lineTotal, quotation.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="max-w-xs ml-auto space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(quotation.subtotal, quotation.currency)}</span>
                </div>
                {quotation.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(quotation.discountAmount, quotation.currency)}</span>
                  </div>
                )}
                {quotation.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({(quotation.taxRate * 100).toFixed(0)}%)</span>
                    <span className="text-gray-900">{formatCurrency(quotation.taxAmount, quotation.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(quotation.total, quotation.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.notes}</p>
            </div>
          )}

          {/* Terms and Conditions */}
          {quotation.termsAndConditions && (
            <div className="px-6 py-5 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Terms & Conditions</h3>
              <div
                className="prose prose-sm max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: quotation.termsAndConditions }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Download PDF */}
              <a
                href={`${apiBaseUrl}/quotations/public/${token}/pdf`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                download
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </a>

              {/* Accept/Reject Buttons */}
              {quotation.canAccept && quotation.canReject && !actionComplete && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={actionLoading}
                    className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Accept Quotation
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Company Contact Info */}
          <div className="px-6 py-4 border-t border-gray-200 bg-white text-center text-sm text-gray-500">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {quotation.company.email && (
                <a href={`mailto:${quotation.company.email}`} className="inline-flex items-center hover:text-blue-600">
                  <Mail className="h-4 w-4 mr-1" />
                  {quotation.company.email}
                </a>
              )}
              {quotation.company.phone && (
                <a href={`tel:${quotation.company.phone}`} className="inline-flex items-center hover:text-blue-600">
                  <Phone className="h-4 w-4 mr-1" />
                  {quotation.company.phone}
                </a>
              )}
              {quotation.company.address && (
                <span className="inline-flex items-center">
                  <Building className="h-4 w-4 mr-1" />
                  {quotation.company.address}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Decline Quotation</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please let us know why you&apos;re declining this quotation (optional). Your feedback helps us improve our offerings.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for declining (optional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm Decline"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
