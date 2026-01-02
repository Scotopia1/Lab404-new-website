import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Checkout',
    description: 'Complete your order at Lab404 Electronics.',
    robots: {
        index: false,
        follow: false,
    },
};

export default function CheckoutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
