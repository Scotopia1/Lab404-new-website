import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Find quick answers to common questions about ordering, shipping, returns, and products at Lab404 Electronics.',
  openGraph: {
    title: 'Frequently Asked Questions | Lab404 Electronics',
    description: 'Find quick answers to common questions about ordering, shipping, returns, and products at Lab404 Electronics.',
    type: 'website',
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
