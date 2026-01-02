'use client';

import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

// Mock data
const posts = [
    {
        id: '1',
        title: 'Getting Started with Arduino',
        excerpt: 'Learn the basics of Arduino programming and hardware interfacing in this comprehensive guide for beginners.',
        date: '2023-12-15',
        author: 'John Smith',
        slug: 'getting-started-with-arduino',
        image: '/images/blog/arduino-starter.jpg', // Placeholder
    },
    {
        id: '2',
        title: 'Top 5 Sensors for IoT Projects',
        excerpt: 'Discover the essential sensors you need to build smart home and IoT applications.',
        date: '2023-12-10',
        author: 'Jane Doe',
        slug: 'top-5-sensors-iot',
        image: '/images/blog/sensors.jpg', // Placeholder
    },
];

export default function BlogPage() {
    return (
        <MainLayout>
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight">Lab404 Blog</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Tutorials, guides, and news from the world of electronics.
                </p>
            </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                        <Card key={post.id} className="overflow-hidden flex flex-col">
                            <div className="aspect-video relative bg-muted">
                                {/* <Image src={post.image} alt={post.title} fill className="object-cover" /> */}
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                    Image Placeholder
                                </div>
                            </div>
                            <CardHeader>
                                <div className="text-sm text-muted-foreground mb-2">
                                    {post.date} • {post.author}
                                </div>
                                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <p className="text-muted-foreground line-clamp-3 mb-4 flex-1">
                                    {post.excerpt}
                                </p>
                                <Link href={`/blog/${post.slug}`}>
                                    <Button variant="outline" className="w-full">Read More</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
        </MainLayout>
    );
}
