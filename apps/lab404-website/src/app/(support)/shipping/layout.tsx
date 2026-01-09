import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Information',
  description: 'Learn about our shipping options, rates, processing times, and international delivery at Lab404 Electronics.',
  openGraph: {
    title: 'Shipping Information | Lab404 Electronics',
    description: 'Learn about our shipping options, rates, processing times, and international delivery at Lab404 Electronics.',
    type: 'website',
  },
};

export default function ShippingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
