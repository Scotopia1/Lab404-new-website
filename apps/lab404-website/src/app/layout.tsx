import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://lab404electronics.com'),
  title: {
    default: 'Lab404 Electronics - Electronic Components, Sensors & DIY Kits',
    template: '%s | Lab404 Electronics',
  },
  description: 'Shop premium electronic components, sensors, Arduino kits, and DIY electronics at Lab404 Electronics. Fast shipping, expert support, and competitive prices for makers and engineers.',
  keywords: [
    'electronics',
    'electronic components',
    'sensors',
    'Arduino',
    'Raspberry Pi',
    'DIY electronics',
    'electronic parts',
    'microcontrollers',
    'capacitors',
    'resistors',
    'LED',
    'PCB',
    'maker supplies',
  ],
  authors: [{ name: 'Lab404 Electronics' }],
  creator: 'Lab404 Electronics',
  publisher: 'Lab404 Electronics',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lab404electronics.com',
    siteName: 'Lab404 Electronics',
    title: 'Lab404 Electronics - Electronic Components, Sensors & DIY Kits',
    description: 'Shop premium electronic components, sensors, Arduino kits, and DIY electronics. Fast shipping, expert support, and competitive prices.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Lab404 Electronics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lab404 Electronics - Electronic Components & Sensors',
    description: 'Shop premium electronic components, sensors, and DIY kits at Lab404 Electronics.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-background focus:text-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
