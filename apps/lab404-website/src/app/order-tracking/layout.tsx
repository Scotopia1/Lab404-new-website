import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Track Your Order',
    description: 'Track the status of your Lab404 Electronics order. Enter your order number or email to get real-time updates on your shipment.',
    openGraph: {
        title: 'Track Your Order | Lab404 Electronics',
        description: 'Track the status of your Lab404 Electronics order.',
    },
};

export default function OrderTrackingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
