"use client";

import {
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuotationStats } from "@/hooks/use-quotations";
import { formatCurrency } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

function StatCard({ title, value, description, icon, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "text-muted-foreground",
    success: "text-green-500",
    warning: "text-yellow-500",
    danger: "text-red-500",
    info: "text-blue-500",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={variantStyles[variant]}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-32 mt-2" />
      </CardContent>
    </Card>
  );
}

export function QuotationStatsCards() {
  const { data: stats, isLoading } = useQuotationStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="Total Quotations"
        value={stats.total}
        description={`${stats.thisMonth} created this month`}
        icon={<FileText className="h-4 w-4" />}
      />
      <StatCard
        title="Draft"
        value={stats.byStatus.draft}
        description="Pending to be sent"
        icon={<Clock className="h-4 w-4" />}
        variant="default"
      />
      <StatCard
        title="Sent"
        value={stats.byStatus.sent}
        description="Awaiting response"
        icon={<Send className="h-4 w-4" />}
        variant="info"
      />
      <StatCard
        title="Accepted"
        value={stats.byStatus.accepted + stats.byStatus.converted}
        description={`${stats.byStatus.converted} converted to orders`}
        icon={<CheckCircle className="h-4 w-4" />}
        variant="success"
      />
      <StatCard
        title="Conversion Rate"
        value={`${stats.conversionRate}%`}
        description="Accepted vs decided"
        icon={<TrendingUp className="h-4 w-4" />}
        variant={stats.conversionRate >= 50 ? "success" : stats.conversionRate >= 25 ? "warning" : "danger"}
      />
      <StatCard
        title="Expiring Soon"
        value={stats.expiringSoon}
        description="Within 7 days"
        icon={<AlertTriangle className="h-4 w-4" />}
        variant={stats.expiringSoon > 0 ? "warning" : "default"}
      />
    </div>
  );
}

export function QuotationValueCards() {
  const { data: stats, isLoading } = useQuotationStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StatCard
        title="Total Quotation Value"
        value={formatCurrency(stats.totalValue)}
        description="All quotations combined"
        icon={<DollarSign className="h-4 w-4" />}
      />
      <StatCard
        title="Accepted Value"
        value={formatCurrency(stats.acceptedValue)}
        description="Value of accepted quotations"
        icon={<ShoppingCart className="h-4 w-4" />}
        variant="success"
      />
    </div>
  );
}

export default QuotationStatsCards;
