"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  FileText,
  Tag,
  BarChart3,
  Settings,
  FileSpreadsheet,
  Import,
  ChevronLeft,
  Quote,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Categories", href: "/categories", icon: FolderTree },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Customers", href: "/customers", icon: Users },
  { type: "separator" as const },
  { name: "Blog Posts", href: "/blogs", icon: FileText },
  { name: "Newsletter", href: "/newsletter", icon: Mail },
  { name: "Promo Codes", href: "/promo-codes", icon: Tag },
  { name: "Quotations", href: "/quotations", icon: Quote },
  { type: "separator" as const },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Import/Export", href: "/import-export", icon: Import },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!sidebarCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              L4
            </div>
            <span className="font-semibold text-sidebar-foreground">
              Lab404 Admin
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn("h-8 w-8", sidebarCollapsed && "mx-auto")}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              sidebarCollapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {navigation.map((item, index) => {
            if ("type" in item && item.type === "separator") {
              return (
                <li key={`sep-${index}`} className="py-2">
                  <Separator />
                </li>
              );
            }

            const navItem = item as {
              name: string;
              href: string;
              icon: React.ComponentType<{ className?: string }>;
            };
            const isActive =
              pathname === navItem.href ||
              (navItem.href !== "/" && pathname.startsWith(navItem.href));

            const linkContent = (
              <Link
                href={navItem.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <navItem.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{navItem.name}</span>}
              </Link>
            );

            if (sidebarCollapsed) {
              return (
                <li key={navItem.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">
                      {navItem.name}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            }

            return <li key={navItem.name}>{linkContent}</li>;
          })}
        </ul>
      </nav>

      {/* Version */}
      {!sidebarCollapsed && (
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-muted-foreground">Version 1.0.0</p>
        </div>
      )}
    </aside>
  );
}
