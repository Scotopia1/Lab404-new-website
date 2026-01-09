import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Learn about how Lab404 Electronics uses cookies to improve your shopping experience and provide personalized service.',
  openGraph: {
    title: 'Cookie Policy | Lab404 Electronics',
    description: 'Learn about how Lab404 Electronics uses cookies to improve your shopping experience and provide personalized service.',
    type: 'website',
  },
};

export default function CookiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
