'use client';

import MainLayout from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFeaturedProducts } from '@/hooks/use-products';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Truck, Shield, Headphones, Zap } from 'lucide-react';

const trustBadges = [
  { icon: Truck, title: 'Free Shipping', description: 'On orders over $50' },
  { icon: Shield, title: 'Secure Payments', description: '256-bit SSL encryption' },
  { icon: Headphones, title: 'Expert Support', description: '24/7 customer service' },
  { icon: Zap, title: 'Fast Delivery', description: 'Same-day processing' },
];

export default function Home() {
  const { data: featuredProducts, isLoading } = useFeaturedProducts();

  return (
    <MainLayout fullWidth>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 md:py-24">
        <div className="container-main">
          <div className="flex flex-col items-center text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-1">
              New Arrivals Weekly
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Build Your Next
              <span className="text-primary"> Electronics </span>
              Project
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl md:text-xl">
              Premium microcontrollers, sensors, and electronic components for makers and engineers.
              Everything you need to bring your ideas to life.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <Button size="lg" className="text-lg px-8 py-6 font-semibold">
                  Shop Now
                </Button>
              </Link>
              <Link href="/products?category=kits">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 font-semibold">
                  Browse DIY Kits
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y bg-muted/50 py-8">
        <div className="container-main">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustBadges.map((badge) => (
              <div key={badge.title} className="flex items-center gap-3 justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <badge.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">{badge.title}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-20">
        <div className="container-main">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Featured Products</h2>
              <p className="text-muted-foreground mt-2">Handpicked selections for your projects</p>
            </div>
            <Link href="/products">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[380px] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts?.map((product) => (
                <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative bg-muted">
                    {product.thumbnailUrl && (
                      <Image
                        src={product.thumbnailUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    )}
                    {product.compareAtPrice && (
                      <Badge className="absolute top-3 left-3 bg-destructive">
                        Sale
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <p className="text-sm text-muted-foreground">{product.category?.name || 'Uncategorized'}</p>
                    <CardTitle className="line-clamp-1 text-lg">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold">${product.basePrice || product.price}</span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.compareAtPrice}
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Link href={`/products/${product.slug}`} className="w-full">
                      <Button className="w-full">View Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground">
        <div className="container-main text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Building?</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8 text-lg">
            Join thousands of makers and engineers who trust Lab404 for their electronics needs.
          </p>
          <Link href="/products">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 font-semibold">
              Explore Our Catalog
            </Button>
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
