import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Lab404 Electronics. Email, phone, or live chat support available. We\'re here to help with your electronics needs.',
  openGraph: {
    title: 'Contact Us | Lab404 Electronics',
    description: 'Get in touch with Lab404 Electronics. Email, phone, or live chat support available. We\'re here to help with your electronics needs.',
    type: 'website',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
