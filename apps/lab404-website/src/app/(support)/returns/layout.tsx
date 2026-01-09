import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Returns & Refunds',
  description: 'Our 30-day return policy ensures satisfaction. Learn how to return products and request refunds at Lab404 Electronics.',
  openGraph: {
    title: 'Returns & Refunds | Lab404 Electronics',
    description: 'Our 30-day return policy ensures satisfaction. Learn how to return products and request refunds at Lab404 Electronics.',
    type: 'website',
  },
};

export default function ReturnsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
