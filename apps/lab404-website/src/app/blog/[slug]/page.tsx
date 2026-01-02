'use client';

import MainLayout from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function BlogPostPage() {
    const params = useParams();
    const slug = params.slug as string;

    return (
        <MainLayout>
            <div className="container py-10 max-w-3xl">
                <Link href="/blog">
                    <Button variant="ghost" size="sm" className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Blog
                    </Button>
                </Link>

                <article className="prose prose-neutral dark:prose-invert lg:prose-xl mx-auto">
                    <h1>Getting Started with Arduino</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground not-prose mb-8">
                        <span>December 15, 2023</span>
                        <span>•</span>
                        <span>John Smith</span>
                    </div>

                    <div className="aspect-video relative bg-muted rounded-xl mb-8 overflow-hidden not-prose">
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                            Feature Image Placeholder
                        </div>
                    </div>

                    <p>
                        Arduino is an open-source electronics platform based on easy-to-use hardware and software.
                        It's intended for anyone making interactive projects.
                    </p>
                    <h2>What is Arduino?</h2>
                    <p>
                        Arduino boards are able to read inputs - light on a sensor, a finger on a button, or a Twitter message -
                        and turn it into an output - activating a motor, turning on an LED, publishing something online.
                    </p>
                    {/* Content would be fetched from CMS/Markdown */}
                </article>
            </div>
        </MainLayout>
    );
}
