'use client';

import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, Calendar, Mail } from 'lucide-react';

export default function TermsPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center gap-2 mb-4 text-muted-foreground">
          <FileText className="h-5 w-5" />
          <span className="text-sm">Legal</span>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
          Terms of Service
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Last updated: January 10, 2026</span>
        </div>
      </div>

      {/* Introduction */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            Welcome to Lab404 Electronics. By accessing or using our website and services, you agree to be bound by these Terms of Service.
            Please read them carefully before making a purchase or creating an account.
          </p>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="max-w-4xl space-y-8 md:space-y-12">
        {/* Section 1 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">1. Acceptance of Terms</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-4">
              By accessing and using Lab404 Electronics' website, you accept and agree to be bound by these Terms of Service and our Privacy Policy.
              If you do not agree to these terms, please do not use our services.
            </p>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to our website.
              Your continued use of the site after changes are posted constitutes acceptance of the modified terms.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 2 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">2. Account Terms</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Registration</h3>
              <p className="text-muted-foreground">
                To access certain features, you may need to create an account. You must provide accurate, current, and complete information during registration
                and keep your account information updated.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Account Security</h3>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account password and for all activities under your account.
                Notify us immediately of any unauthorized use of your account.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Age Requirement</h3>
              <p className="text-muted-foreground">
                You must be at least 18 years old to create an account and make purchases. By using our services, you represent that you meet this age requirement.
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 3 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">3. Products & Pricing</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Product Availability</h3>
              <p className="text-muted-foreground">
                All products are subject to availability. We cannot guarantee that items shown on our website will be in stock.
                We reserve the right to discontinue any product at any time.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Pricing</h3>
              <p className="text-muted-foreground">
                Prices are listed in USD and are subject to change without notice. We make every effort to ensure pricing accuracy,
                but errors may occur. If we discover an error, we will inform you as soon as possible and give you the option to reconfirm your order at the correct price or cancel it.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Technical Specifications</h3>
              <p className="text-muted-foreground">
                We strive to provide accurate product descriptions and specifications. However, we do not warrant that product descriptions,
                images, or specifications are error-free, complete, or current.
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 4 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">4. Orders & Payment</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Order Process</h3>
              <p className="text-muted-foreground">
                When you place an order, you are making an offer to purchase products. We reserve the right to refuse or cancel any order for any reason,
                including product availability, errors in pricing or product information, or suspected fraudulent activity.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Payment Methods</h3>
              <p className="text-muted-foreground">
                We accept major credit cards, debit cards, and other payment methods as indicated at checkout. Payment is due at the time of order placement.
                Your payment information is processed securely through our PCI-compliant payment processors.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Order Confirmation</h3>
              <p className="text-muted-foreground">
                You will receive an email confirmation once your order is placed. This confirmation does not signify our acceptance of your order.
                Order acceptance occurs when we ship the products or provide download/access links.
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 5 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">5. Shipping & Delivery</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
            <p className="text-muted-foreground">
              We ship to addresses within the United States and select international destinations. Shipping costs and delivery times vary based on your location and selected shipping method.
              For detailed shipping information, please visit our <Link href="/shipping" className="text-primary hover:underline">Shipping Information</Link> page.
            </p>
            <p className="text-muted-foreground">
              Title and risk of loss pass to you upon delivery to the carrier. We are not responsible for delays caused by shipping carriers,
              customs clearance, or events beyond our control.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 6 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">6. Returns & Refunds</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
            <p className="text-muted-foreground">
              We want you to be satisfied with your purchase. We offer a 30-day return policy for most products in new, unopened condition.
              For complete details about returns, refunds, and our RMA process, please visit our <Link href="/returns" className="text-primary hover:underline">Returns & Refunds</Link> page.
            </p>
            <p className="text-muted-foreground">
              Certain products may not be eligible for return, including opened electronic components, custom orders, and clearance items.
              Defective items are covered under our Dead on Arrival (DOA) policy.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 7 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">7. Product Warranties</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Manufacturer Warranties</h3>
              <p className="text-muted-foreground">
                Products may be covered by manufacturer warranties. We are not responsible for manufacturer warranty claims.
                Warranty service is provided directly by manufacturers according to their warranty terms.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Dead on Arrival (DOA) Policy</h3>
              <p className="text-muted-foreground">
                If you receive a defective product, notify us within 7 days of delivery. We will provide a replacement or refund at no additional cost.
                DOA claims require proof of defect and must be reported promptly.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Disclaimer of Warranties</h3>
              <p className="text-muted-foreground">
                TO THE EXTENT PERMITTED BY LAW, PRODUCTS ARE PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                WE DISCLAIM ALL WARRANTIES INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 8 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">8. Limitation of Liability</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, LAB404 ELECTRONICS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
              OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF OUR PRODUCTS OR SERVICES.
            </p>
            <p className="text-muted-foreground">
              Our total liability for any claim arising from your use of our services shall not exceed the amount you paid for the product or service giving rise to the claim.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 9 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">9. Technical Support</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-4">
              We provide technical support for products purchased from Lab404 Electronics. Support includes assistance with product selection,
              datasheets, and basic troubleshooting. We do not provide design services or project-specific engineering support.
            </p>
            <p className="text-muted-foreground">
              Technical support is provided "as is" without warranties. We are not liable for any damages resulting from technical advice or support provided.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 10 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">10. User Conduct</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Use our services for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt our services or servers</li>
              <li>Submit false or misleading information</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Use automated systems (bots) to access our services without permission</li>
              <li>Resell products in violation of manufacturer restrictions</li>
            </ul>
          </div>
        </section>

        <Separator />

        {/* Section 11 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">11. Intellectual Property</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-4">
              All content on our website, including text, graphics, logos, images, and software, is the property of Lab404 Electronics or its content suppliers
              and is protected by copyright and intellectual property laws.
            </p>
            <p className="text-muted-foreground">
              You may not reproduce, distribute, modify, or create derivative works from our content without express written permission.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 12 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">12. Termination</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              We reserve the right to terminate or suspend your account and access to our services at our sole discretion, without notice,
              for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 13 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">13. Changes to Terms</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              We may update these Terms of Service from time to time. We will notify you of significant changes by posting a notice on our website
              or by sending you an email. Your continued use of our services after changes are posted constitutes acceptance of the updated terms.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 14 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">14. Governing Law</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              These Terms of Service are governed by and construed in accordance with the laws of the United States,
              without regard to conflict of law principles. Any disputes shall be resolved in the courts located in our jurisdiction.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 15 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">15. Contact Information</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-4">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <ul className="list-none space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Email: legal@lab404electronics.com
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Address: 123 Electronics Ave, Tech City, TC 12345
              </li>
            </ul>
          </div>
        </section>

        {/* Contact CTA */}
        <Card className="mt-12 bg-muted/50">
          <CardHeader>
            <CardTitle>Questions about our terms?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Our support team is here to help clarify any questions you may have about these terms.
            </p>
            <Link href="/contact">
              <Button>Contact Support</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
