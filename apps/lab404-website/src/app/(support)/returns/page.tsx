'use client';

import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { RotateCcw, CheckCircle, XCircle, AlertTriangle, Clock, Package } from 'lucide-react';

const returnProcess = [
  {
    step: 1,
    title: 'Request Return',
    description: 'Log into your account, go to Order History, and click "Request Return" on the eligible order.',
  },
  {
    step: 2,
    title: 'Receive RMA Number',
    description: 'You\'ll receive an RMA (Return Merchandise Authorization) number and return instructions via email.',
  },
  {
    step: 3,
    title: 'Pack & Ship',
    description: 'Securely pack the item in original packaging with the RMA number clearly marked, and ship it back.',
  },
  {
    step: 4,
    title: 'Refund Processed',
    description: 'Once we receive and inspect the return, your refund will be processed within 3-5 business days.',
  },
];

const eligibleReturns = [
  { icon: CheckCircle, text: 'Unopened products in original packaging', eligible: true },
  { icon: CheckCircle, text: 'Items returned within 30 days of delivery', eligible: true },
  { icon: CheckCircle, text: 'Products with all original accessories and manuals', eligible: true },
  { icon: CheckCircle, text: 'Defective items (DOA policy applies)', eligible: true },
];

const nonEligibleReturns = [
  { icon: XCircle, text: 'Opened or used products (except if defective)', eligible: false },
  { icon: XCircle, text: 'Items without original packaging', eligible: false },
  { icon: XCircle, text: 'Custom or special-order items', eligible: false },
  { icon: XCircle, text: 'Products damaged due to misuse or abuse', eligible: false },
  { icon: XCircle, text: 'Items returned after 30-day window', eligible: false },
];

export default function ReturnsPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <div className="text-center mb-12">
        <RotateCcw className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
          Returns & Refunds
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          We want you to be completely satisfied. Learn about our hassle-free 30-day return policy.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
        {/* Return Policy Overview */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Our Return Policy</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-lg">
                At Lab404 Electronics, your satisfaction is our priority. We offer a <strong className="text-primary">30-day return policy</strong> on most products.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    Returns must be initiated within 30 days of delivery date
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    Products must be in new, unopened condition with original packaging
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    No restocking fees on eligible returns
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    Refunds issued to original payment method
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Return Process */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">How to Return a Product</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {returnProcess.map((step) => (
              <Card key={step.step}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">{step.step}</span>
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Refund Timeline */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Refund Timeline</h2>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-semibold">Return Received</p>
                  <p className="text-sm text-muted-foreground">
                    We inspect your return within 1-2 business days of receiving it at our facility.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-semibold">Refund Processed</p>
                  <p className="text-sm text-muted-foreground">
                    Once approved, refunds are processed within 3-5 business days to your original payment method.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-semibold">Funds Available</p>
                  <p className="text-sm text-muted-foreground">
                    Depending on your bank or card issuer, it may take an additional 5-10 business days for the refund to appear in your account.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* DOA Policy */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Dead on Arrival (DOA) Policy</h2>
          </div>
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <CardContent className="pt-6 space-y-4">
              <p className="text-blue-900 dark:text-blue-100">
                If you receive a defective or damaged item, we've got you covered.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>7-Day DOA Window:</strong> Contact us within 7 days of delivery if you receive a defective item
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Free Return Shipping:</strong> We'll provide a prepaid return label at no cost to you
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Replacement or Refund:</strong> Choose between a replacement product or full refund (including original shipping costs)
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Priority Processing:</strong> DOA claims are processed immediately with expedited shipping for replacements
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Eligible vs Non-Eligible */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Return Eligibility</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Eligible */}
            <Card className="border-green-200 dark:border-green-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  Eligible for Return
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {eligibleReturns.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <item.icon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Non-Eligible */}
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <XCircle className="h-5 w-5" />
                  Not Eligible for Return
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {nonEligibleReturns.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <item.icon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Restocking Fees */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Restocking Fees</h2>
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-200">No Restocking Fees</p>
                  <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                    We don't charge restocking fees on eligible returns. You'll receive a full refund of the product price.
                    Original shipping costs are non-refundable unless the return is due to our error or a defective product.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact CTA */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6 text-center">
            <Package className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Need help with a return?</h3>
            <p className="text-muted-foreground mb-4">
              Our customer service team is ready to assist with your return or exchange.
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
