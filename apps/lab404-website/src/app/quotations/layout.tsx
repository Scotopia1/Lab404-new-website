import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "View Quotation | Lab404 Electronics",
  description: "Review and respond to your quotation from Lab404 Electronics.",
};

export default function QuotationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
