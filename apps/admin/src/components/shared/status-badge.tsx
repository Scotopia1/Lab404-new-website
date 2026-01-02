import { Badge } from "@/components/ui/badge";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type ProductStatus = "draft" | "active" | "archived";

type BlogStatus = "draft" | "published";

const orderStatusConfig: Record<
  OrderStatus,
  { label: string; variant: "warning" | "info" | "purple" | "default" | "success" | "destructive" }
> = {
  pending: { label: "Pending", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "info" },
  processing: { label: "Processing", variant: "purple" },
  shipped: { label: "Shipped", variant: "default" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const productStatusConfig: Record<
  ProductStatus,
  { label: string; variant: "secondary" | "success" | "destructive" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  active: { label: "Active", variant: "success" },
  archived: { label: "Archived", variant: "destructive" },
};

const blogStatusConfig: Record<
  BlogStatus,
  { label: string; variant: "secondary" | "success" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  published: { label: "Published", variant: "success" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = orderStatusConfig[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const config = productStatusConfig[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function BlogStatusBadge({ status }: { status: BlogStatus }) {
  const config = blogStatusConfig[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
