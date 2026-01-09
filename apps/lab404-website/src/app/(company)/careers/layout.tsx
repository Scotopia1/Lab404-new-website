import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join the Lab404 Electronics team. Explore current openings and discover opportunities to grow with a passionate electronics community.',
  openGraph: {
    title: 'Careers | Lab404 Electronics',
    description: 'Join the Lab404 Electronics team. Explore current openings and discover opportunities to grow with a passionate electronics community.',
    type: 'website',
  },
};

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
