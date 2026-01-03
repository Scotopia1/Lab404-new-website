"use client";

import { Check, Clock, Package, Truck, MapPin, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";

interface OrderTimelineProps {
  status: string;
  createdAt: string;
  confirmedAt?: string;
  processingAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

interface TimelineStep {
  status: string;
  label: string;
  icon: React.ElementType;
  timestamp?: string;
  isActive: boolean;
  isCompleted: boolean;
  isCancelled?: boolean;
}

const statusOrder = ["pending", "confirmed", "processing", "shipped", "delivered"];

export function OrderTimeline({
  status,
  createdAt,
  confirmedAt,
  processingAt,
  shippedAt,
  deliveredAt,
}: OrderTimelineProps) {
  const currentIndex = status === "cancelled" ? -1 : statusOrder.indexOf(status);
  const isCancelled = status === "cancelled";

  const steps: TimelineStep[] = [
    {
      status: "pending",
      label: "Order Placed",
      icon: Clock,
      timestamp: createdAt,
      isActive: status === "pending",
      isCompleted: currentIndex > 0,
    },
    {
      status: "confirmed",
      label: "Confirmed",
      icon: Check,
      timestamp: confirmedAt,
      isActive: status === "confirmed",
      isCompleted: currentIndex > 1,
    },
    {
      status: "processing",
      label: "Processing",
      icon: Package,
      timestamp: processingAt,
      isActive: status === "processing",
      isCompleted: currentIndex > 2,
    },
    {
      status: "shipped",
      label: "Shipped",
      icon: Truck,
      timestamp: shippedAt,
      isActive: status === "shipped",
      isCompleted: currentIndex > 3,
    },
    {
      status: "delivered",
      label: "Delivered",
      icon: MapPin,
      timestamp: deliveredAt,
      isActive: status === "delivered",
      isCompleted: false,
    },
  ];

  if (isCancelled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
          <div className="p-2 rounded-full bg-destructive text-white">
            <XCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-destructive">Order Cancelled</p>
            <p className="text-sm text-muted-foreground">
              Originally placed on {formatDateTime(createdAt)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const showStep = step.isCompleted || step.isActive || index <= currentIndex + 1;
        if (!showStep && index > currentIndex + 1) return null;

        return (
          <div key={step.status} className="relative">
            {/* Connector line */}
            {index < steps.length - 1 && index <= currentIndex && (
              <div
                className={cn(
                  "absolute left-[15px] top-[32px] w-[2px] h-[calc(100%-8px)]",
                  step.isCompleted || step.isActive
                    ? "bg-primary"
                    : "bg-muted-foreground/20"
                )}
              />
            )}

            <div className="flex items-start gap-3 pb-4">
              {/* Icon */}
              <div
                className={cn(
                  "p-2 rounded-full shrink-0 z-10",
                  step.isActive && "bg-primary text-white ring-4 ring-primary/20",
                  step.isCompleted && "bg-primary text-white",
                  !step.isActive && !step.isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                <step.icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="pt-0.5">
                <p
                  className={cn(
                    "font-medium",
                    (step.isActive || step.isCompleted) && "text-foreground",
                    !step.isActive && !step.isCompleted && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {step.timestamp && (step.isActive || step.isCompleted) && (
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(step.timestamp)}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
