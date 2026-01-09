import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Press & Media',
  description: 'Media resources and press information for Lab404 Electronics. Download brand assets and get the latest company news.',
  openGraph: {
    title: 'Press & Media | Lab404 Electronics',
    description: 'Media resources and press information for Lab404 Electronics. Download brand assets and get the latest company news.',
    type: 'website',
  },
};

export default function PressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
