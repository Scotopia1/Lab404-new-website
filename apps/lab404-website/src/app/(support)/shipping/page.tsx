'use client';

import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Truck, Package, Globe, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

const shippingMethods = [
  {
    icon: Truck,
    name: 'Standard Shipping',
    time: '5-7 Business Days',
    cost: 'FREE on orders over $50',
    details: 'Orders under $50 have a $5.99 shipping fee. Most economical option for non-urgent orders.',
  },
  {
    icon: Package,
    name: 'Express Shipping',
    time: '2-3 Business Days',
    cost: '$9.99',
    details: 'Faster delivery for time-sensitive projects. Available for all domestic orders.',
  },
  {
    icon: Clock,
    name: 'Next Day Shipping',
    time: '1 Business Day',
    cost: '$24.99',
    details: 'Guaranteed next business day delivery for urgent needs. Orders must be placed before 2 PM EST.',
  },
];

const internationalShipping = [
  { region: 'Canada & Mexico', time: '7-14 days', cost: 'Starting at $15.99' },
  { region: 'Europe', time: '10-21 days', cost: 'Starting at $24.99' },
  { region: 'Asia Pacific', time: '14-21 days', cost: 'Starting at $29.99' },
  { region: 'Rest of World', time: '14-28 days', cost: 'Starting at $34.99' },
];

export default function ShippingPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <div className="text-center mb-12">
        <Truck className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
          Shipping Information
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Fast, reliable shipping to get your electronics components when you need them.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
        {/* Shipping Methods */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Domestic Shipping Options</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {shippingMethods.map((method) => (
              <Card key={method.name}>
                <CardHeader>
                  <method.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-xl">{method.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Time</p>
                    <p className="font-semibold">{method.time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cost</p>
                    <p className="font-semibold text-primary">{method.cost}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{method.details}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Processing Times */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Processing Times</h2>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Same-Day Processing</p>
                  <p className="text-sm text-muted-foreground">
                    Orders placed before 2 PM EST Monday-Friday are processed and shipped the same business day.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Weekend Orders</p>
                  <p className="text-sm text-muted-foreground">
                    Orders placed after 2 PM Friday through Sunday are processed on the next business day (Monday).
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">High-Volume Periods</p>
                  <p className="text-sm text-muted-foreground">
                    During holidays and promotional periods, processing may take 1-2 business days. We'll notify you of any delays.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* International Shipping */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">International Shipping</h2>
          </div>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">
                We ship to over 50 countries worldwide. International orders are shipped via trusted carriers with tracking.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-semibold">Region</th>
                      <th className="text-left py-3 px-2 font-semibold">Delivery Time</th>
                      <th className="text-left py-3 px-2 font-semibold">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internationalShipping.map((region) => (
                      <tr key={region.region} className="border-b last:border-0">
                        <td className="py-3 px-2">{region.region}</td>
                        <td className="py-3 px-2 text-muted-foreground">{region.time}</td>
                        <td className="py-3 px-2 font-semibold">{region.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-200">Customs & Duties</p>
                  <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                    International customers are responsible for any customs duties, taxes, or import fees charged by their country.
                    These fees are not included in our shipping costs and vary by destination.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Order Tracking */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Order Tracking</h2>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-muted-foreground">
                Stay updated on your order status every step of the way:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Tracking Number</p>
                    <p className="text-sm text-muted-foreground">
                      You'll receive a tracking number via email once your order ships, usually within 24 hours of ordering.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Real-Time Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Track your package in real-time through the carrier's website or your Lab404 account dashboard.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Delivery Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get email notifications when your order is out for delivery and when it's been delivered.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Shipping Restrictions */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Shipping Restrictions</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-muted-foreground">
                Due to regulatory requirements, some products may have shipping restrictions:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Lithium batteries have special shipping requirements and may be restricted to ground shipping only</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Certain hazardous materials require specialized handling and may have limited shipping options</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Some items cannot be shipped to P.O. boxes or APO/FPO addresses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Export-controlled items may have restrictions on international shipping destinations</span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground pt-2">
                Any restrictions will be noted on the product page. Contact us if you have questions about shipping specific items.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Contact CTA */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6 text-center">
            <Package className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Questions about shipping?</h3>
            <p className="text-muted-foreground mb-4">
              Our team is here to help with any shipping questions or special requests.
            </p>
            <Link href="/contact">
              <Button size="lg">Contact Support</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
