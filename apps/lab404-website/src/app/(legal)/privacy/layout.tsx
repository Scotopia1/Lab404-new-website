import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Lab404 Electronics collects, uses, and protects your personal information. We prioritize your privacy and data security.',
  openGraph: {
    title: 'Privacy Policy | Lab404 Electronics',
    description: 'How Lab404 Electronics collects, uses, and protects your personal information. We prioritize your privacy and data security.',
    type: 'website',
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
