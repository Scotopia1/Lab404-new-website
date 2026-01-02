import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Products',
    description: 'Browse our extensive collection of electronic components, sensors, microcontrollers, and DIY kits. Find everything you need for your next electronics project.',
    openGraph: {
        title: 'Products | Lab404 Electronics',
        description: 'Browse our extensive collection of electronic components, sensors, microcontrollers, and DIY kits.',
    },
};

export default function ProductsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
