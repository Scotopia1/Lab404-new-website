"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const routeLabels: Record<string, string> = {
  products: "Products",
  categories: "Categories",
  orders: "Orders",
  customers: "Customers",
  blogs: "Blog Posts",
  "promo-codes": "Promo Codes",
  quotations: "Quotations",
  analytics: "Analytics",
  "import-export": "Import/Export",
  settings: "Settings",
  activity: "Activity Logs",
  new: "New",
  edit: "Edit",
  sales: "Sales",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    const isId = /^[0-9a-f-]{36}$/.test(segment) || /^\d+$/.test(segment);
    const label = isId ? "Details" : routeLabels[segment] || segment;

    return { href, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <Link
        href="/"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4" />
          {crumb.isLast ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
