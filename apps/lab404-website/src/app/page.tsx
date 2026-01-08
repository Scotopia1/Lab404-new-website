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
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12 md:py-16 lg:py-24">
        <div className="container-main">
          <div className="flex flex-col items-center text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-1 text-sm">
              New Arrivals Weekly
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              Build Your Next
              <span className="text-primary"> Electronics </span>
              Project
            </h1>
            <p className="mt-4 md:mt-6 text-base md:text-lg text-muted-foreground max-w-2xl lg:text-xl px-4">
              Premium microcontrollers, sensors, and electronic components for makers and engineers.
              Everything you need to bring your ideas to life.
            </p>
            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto px-4 sm:px-0">
              <Link href="/products" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 min-h-[44px] font-semibold">
                  Shop Now
                </Button>
              </Link>
              <Link href="/products?category=kits" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 min-h-[44px] font-semibold">
                  Browse DIY Kits
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y bg-muted/50 py-6 md:py-8">
        <div className="container-main">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {trustBadges.map((badge) => (
              <div key={badge.title} className="flex items-center gap-3 justify-center px-2">
                <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                  <badge.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm md:text-base">{badge.title}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="container-main">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-10 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Featured Products</h2>
              <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">Handpicked selections for your projects</p>
            </div>
            <Link href="/products">
              <Button variant="outline" className="min-h-[44px] min-w-[44px]">View All</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[380px] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
              {featuredProducts?.map((product, index) => (
                <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative bg-muted">
                    {product.thumbnailUrl && (
                      <Image
                        src={product.thumbnailUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        loading={index < 2 ? 'eager' : 'lazy'}
                        priority={index < 2}
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    )}
                    {product.compareAtPrice && (
                      <Badge className="absolute top-3 left-3 bg-destructive">
                        Sale
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="p-3 md:p-4">
                    <p className="text-xs md:text-sm text-muted-foreground">{product.category?.name || 'Uncategorized'}</p>
                    <CardTitle className="line-clamp-1 text-base md:text-lg">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-4 pt-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg md:text-xl font-bold">${product.basePrice || product.price}</span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.compareAtPrice}
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-3 md:p-4 pt-0">
                    <Link href={`/products/${product.slug}`} className="w-full">
                      <Button className="w-full min-h-[44px]">View Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-primary text-primary-foreground">
        <div className="container-main text-center px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">Ready to Start Building?</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-6 md:mb-8 text-base md:text-lg">
            Join thousands of makers and engineers who trust Lab404 for their electronics needs.
          </p>
          <Link href="/products">
            <Button size="lg" variant="secondary" className="text-base md:text-lg px-6 md:px-8 min-h-[44px] font-semibold">
              Explore Our Catalog
            </Button>
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}