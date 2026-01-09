'use client';

import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Zap, Heart, Users, Award, Shield, Mail } from 'lucide-react';

const values = [
  {
    icon: Award,
    title: 'Quality First',
    description: 'We source only authentic, high-quality components from authorized distributors and manufacturers.',
  },
  {
    icon: Shield,
    title: 'Transparency',
    description: 'Honest pricing, clear product information, and upfront communication in everything we do.',
  },
  {
    icon: Heart,
    title: 'Customer Success',
    description: 'Your projects matter to us. We provide support, resources, and expertise to help you succeed.',
  },
  {
    icon: Zap,
    title: 'Innovation',
    description: 'We stay at the forefront of electronics trends to bring you the latest components and technologies.',
  },
];

const differentiators = [
  {
    icon: Shield,
    title: 'Authentic Products',
    description: 'Every product is sourced directly from authorized distributors. No counterfeits, ever.',
  },
  {
    icon: Users,
    title: 'Expert Support',
    description: 'Our team includes electronics engineers ready to help with technical questions and product selection.',
  },
  {
    icon: Zap,
    title: 'Fast Shipping',
    description: 'Same-day processing for orders before 2 PM EST. Free shipping on orders over $50.',
  },
  {
    icon: Heart,
    title: 'Community Driven',
    description: 'We\'re makers too. We understand your needs because we share your passion for electronics.',
  },
];

export default function AboutPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <div className="text-center mb-12">
        <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
          About Lab404 Electronics
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Your trusted partner for premium electronic components and exceptional service.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
        {/* Mission */}
        <section>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">Our Mission</h2>
              <p className="text-lg text-center text-muted-foreground max-w-3xl mx-auto">
                To empower makers, engineers, and electronics enthusiasts with access to high-quality components,
                expert knowledge, and exceptional service. We believe that great ideas deserve great components.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Story */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Our Story</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-muted-foreground">
                Lab404 Electronics was founded by a group of passionate electronics engineers and makers who were
                frustrated with the lack of reliable, customer-focused suppliers in the market. Too often, they
                encountered counterfeit components, poor technical support, and slow shipping times.
              </p>
              <p className="text-muted-foreground">
                We set out to create something different: a company that treats customers like fellow makers,
                not just order numbers. A place where quality is guaranteed, technical expertise is accessible,
                and your success is our success.
              </p>
              <p className="text-muted-foreground">
                Today, Lab404 Electronics serves thousands of customers worldwide, from hobbyists working on their
                first Arduino project to professional engineers developing cutting-edge products. Despite our growth,
                we've maintained our commitment to the values that started it all: quality, transparency, and customer success.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* What Makes Us Different */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">What Makes Us Different</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {differentiators.map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <item.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Values */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value) => (
              <Card key={value.title}>
                <CardHeader>
                  <value.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-8">
              <div className="grid md:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-primary mb-2">10,000+</p>
                  <p className="text-sm text-muted-foreground">Products in Stock</p>
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-primary mb-2">50,000+</p>
                  <p className="text-sm text-muted-foreground">Happy Customers</p>
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-primary mb-2">99.8%</p>
                  <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-primary mb-2">Same Day</p>
                  <p className="text-sm text-muted-foreground">Order Processing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Commitment */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Our Commitment to You</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold">100% Authentic Products</p>
                    <p className="text-sm text-muted-foreground">
                      Every component is sourced from authorized distributors and comes with authenticity guarantees.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold">Expert Technical Support</p>
                    <p className="text-sm text-muted-foreground">
                      Our team includes electrical engineers who can help with component selection and technical questions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold">Fast, Reliable Shipping</p>
                    <p className="text-sm text-muted-foreground">
                      Same-day processing for orders before 2 PM EST, with free shipping on orders over $50.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold">30-Day Returns</p>
                    <p className="text-sm text-muted-foreground">
                      Not satisfied? We offer hassle-free returns with no restocking fees on eligible products.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold">Responsive Customer Service</p>
                    <p className="text-sm text-muted-foreground">
                      Email, phone, and chat support with real humans who care about your success.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact CTA */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6 text-center">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Want to learn more?</h3>
            <p className="text-muted-foreground mb-4">
              We'd love to hear from you. Get in touch with any questions or feedback.
            </p>
            <Link href="/contact">
              <Button size="lg">Contact Us</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
