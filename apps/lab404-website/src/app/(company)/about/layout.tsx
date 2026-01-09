import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Lab404 Electronics is your trusted source for premium electronic components. Learn about our mission, values, and commitment to makers.',
  openGraph: {
    title: 'About Us | Lab404 Electronics',
    description: 'Lab404 Electronics is your trusted source for premium electronic components. Learn about our mission, values, and commitment to makers.',
    type: 'website',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
