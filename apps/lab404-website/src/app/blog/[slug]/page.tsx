'use client';

import MainLayout from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useBlog } from '@/hooks/use-blogs';
import Image from 'next/image';

export default function BlogPostPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { data: post, isLoading, error } = useBlog(slug);

    return (
        <MainLayout>
            <div className="container py-10 max-w-3xl">
                <Link href="/blog">
                    <Button variant="ghost" size="sm" className="mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Blog
                    </Button>
                </Link>

                {isLoading && (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {error && (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
                        <p className="text-muted-foreground">The blog post you're looking for doesn't exist.</p>
                    </div>
                )}

                {post && (
                    <article className="prose prose-neutral dark:prose-invert lg:prose-xl mx-auto">
                        <h1>{post.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground not-prose mb-8">
                            <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Draft'}</span>
                            {post.tags && post.tags.length > 0 && (
                                <>
                                    <span>•</span>
                                    <div className="flex gap-2">
                                        {post.tags.map((tag) => (
                                            <span key={tag} className="px-2 py-1 bg-muted rounded-md text-xs">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {post.featuredImageUrl && (
                            <div className="aspect-video relative bg-muted rounded-xl mb-8 overflow-hidden not-prose">
                                <Image
                                    src={post.featuredImageUrl}
                                    alt={post.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}

                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                    </article>
                )}
            </div>
        </MainLayout>
    );
}
