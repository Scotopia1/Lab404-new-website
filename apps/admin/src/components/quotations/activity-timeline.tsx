"use client";

import {
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingCart,
  Copy,
  Eye,
  Download,
  Edit,
  AlertTriangle,
  User,
  Bot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuotationActivities, QuotationActivity } from "@/hooks/use-quotations";
import { formatDistanceToNow, format } from "date-fns";

interface ActivityTimelineProps {
  quotationId: string;
}

const activityIcons: Record<string, React.ReactNode> = {
  created: <FileText className="h-4 w-4" />,
  updated: <Edit className="h-4 w-4" />,
  sent: <Send className="h-4 w-4" />,
  viewed: <Eye className="h-4 w-4" />,
  accepted: <CheckCircle className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
  expired: <AlertTriangle className="h-4 w-4" />,
  converted: <ShoppingCart className="h-4 w-4" />,
  duplicated: <Copy className="h-4 w-4" />,
  pdf_generated: <Download className="h-4 w-4" />,
  note_added: <FileText className="h-4 w-4" />,
  status_changed: <Clock className="h-4 w-4" />,
};

const activityColors: Record<string, string> = {
  created: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  updated: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  sent: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  viewed: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  accepted: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  expired: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  converted: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  duplicated: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  pdf_generated: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  note_added: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  status_changed: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

function getActorIcon(actorType: string) {
  switch (actorType) {
    case "admin":
      return <User className="h-3 w-3" />;
    case "customer":
      return <User className="h-3 w-3" />;
    case "system":
    default:
      return <Bot className="h-3 w-3" />;
  }
}

function ActivityItem({ activity }: { activity: QuotationActivity }) {
  const icon = activityIcons[activity.activityType] || <Clock className="h-4 w-4" />;
  const colorClass = activityColors[activity.activityType] || activityColors.updated;
  const date = new Date(activity.createdAt);

  return (
    <div className="flex gap-3 pb-4 last:pb-0">
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-full ${colorClass}`}>{icon}</div>
        <div className="w-px h-full bg-border mt-2 last:hidden" />
      </div>
      <div className="flex-1 pb-4 last:pb-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{activity.description}</p>
          <time
            className="text-xs text-muted-foreground whitespace-nowrap"
            title={format(date, "PPpp")}
          >
            {formatDistanceToNow(date, { addSuffix: true })}
          </time>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
          {getActorIcon(activity.actorType)}
          <span className="capitalize">
            {activity.actorName || activity.actorType}
          </span>
        </div>
      </div>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityTimeline({ quotationId }: ActivityTimelineProps) {
  const { data: activities, isLoading } = useQuotationActivities(quotationId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TimelineSkeleton />
        ) : activities && activities.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-0">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No activity recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ActivityTimeline;
