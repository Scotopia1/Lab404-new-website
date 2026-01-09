import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Our terms and conditions for using Lab404 Electronics. Learn about ordering, shipping, returns, and our commitment to customer service.',
  openGraph: {
    title: 'Terms of Service | Lab404 Electronics',
    description: 'Our terms and conditions for using Lab404 Electronics. Learn about ordering, shipping, returns, and our commitment to customer service.',
    type: 'website',
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
