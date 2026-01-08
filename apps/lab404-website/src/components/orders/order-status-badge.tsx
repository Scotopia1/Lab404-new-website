import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

/**
 * Display order status with appropriate color
 * - pending: yellow (waiting for confirmation)
 * - confirmed: blue (order confirmed, preparing)
 * - processing: blue (being prepared)
 * - shipped: purple (in transit)
 * - delivered: green (successfully delivered)
 * - cancelled: red (cancelled)
 */
export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const variants = {
    pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    confirmed: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    processing: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    shipped: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    delivered: 'bg-green-100 text-green-800 hover:bg-green-100',
    cancelled: 'bg-red-100 text-red-800 hover:bg-red-100',
  };

  const labels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  return (
    <Badge
      variant="secondary"
      className={cn(variants[status], className)}
    >
      {labels[status]}
    </Badge>
  );
}
