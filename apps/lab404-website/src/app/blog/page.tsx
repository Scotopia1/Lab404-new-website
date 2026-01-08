'use client';

import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useBlogs } from '@/hooks/use-blogs';
import { Loader2 } from 'lucide-react';

// Note: For client components, we set metadata via layout.tsx or use next/head
// For now, we rely on the template in root layout

export default function BlogPage() {
    const { data, isLoading, error } = useBlogs({ limit: 12 });

    return (
        <MainLayout>
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight">Lab404 Blog</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Tutorials, guides, and news from the world of electronics.
                </p>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {error && (
                <div className="text-center py-20">
                    <p className="text-destructive">Failed to load blog posts</p>
                </div>
            )}

            {data?.data && data.data.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-muted-foreground">No blog posts available yet.</p>
                </div>
            )}

            {data?.data && data.data.length > 0 && (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {data.data.map((post) => (
                        <Card key={post.id} className="overflow-hidden flex flex-col">
                            <div className="aspect-video relative bg-muted">
                                {post.featuredImageUrl ? (
                                    <Image
                                        src={post.featuredImageUrl}
                                        alt={post.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                        Image Placeholder
                                    </div>
                                )}
                            </div>
                            <CardHeader>
                                <div className="text-sm text-muted-foreground mb-2">
                                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Draft'}
                                    {post.tags && post.tags.length > 0 && ` • ${post.tags[0]}`}
                                </div>
                                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <p className="text-muted-foreground line-clamp-3 mb-4 flex-1">
                                    {post.excerpt || post.content.substring(0, 150) + '...'}
                                </p>
                                <Link href={`/blog/${post.slug}`}>
                                    <Button variant="outline" className="w-full">Read More</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </MainLayout>
    );
}
