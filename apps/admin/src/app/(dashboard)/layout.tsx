import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <Header />
        <main className="pl-64 pt-16 transition-all duration-300 data-[sidebar-collapsed=true]:pl-16">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
