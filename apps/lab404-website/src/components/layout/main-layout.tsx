import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

interface MainLayoutProps {
    children: React.ReactNode;
    /** Use full width without container constraints */
    fullWidth?: boolean;
}

export default function MainLayout({ children, fullWidth = false }: MainLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                {fullWidth ? (
                    children
                ) : (
                    <div className="container-main py-6 lg:py-8">
                        {children}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
