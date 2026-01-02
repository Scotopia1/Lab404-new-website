import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Blog',
    description: 'Read tutorials, guides, and news from the world of electronics. Learn about Arduino, Raspberry Pi, sensors, and DIY projects.',
    openGraph: {
        title: 'Blog | Lab404 Electronics',
        description: 'Tutorials, guides, and news from the world of electronics.',
    },
};

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
