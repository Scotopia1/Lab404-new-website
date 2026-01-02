import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'My Account',
    robots: {
        index: false,
        follow: false,
    },
};

export default function AccountRouteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
