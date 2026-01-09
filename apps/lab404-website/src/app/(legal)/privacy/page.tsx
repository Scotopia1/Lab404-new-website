'use client';

import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shield, Calendar, Lock, Eye, Database, UserCheck, Globe } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center gap-2 mb-4 text-muted-foreground">
          <Shield className="h-5 w-5" />
          <span className="text-sm">Legal</span>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
          Privacy Policy
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
            At Lab404 Electronics, we value your privacy and are committed to protecting your personal information.
            This Privacy Policy explains how we collect, use, share, and protect your data when you use our website and services.
          </p>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="max-w-4xl space-y-8 md:space-y-12">
        {/* Section 1 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">1. Information We Collect</h2>
          </div>
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
              <p className="text-muted-foreground mb-2">
                When you create an account or make a purchase, we collect:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Name and contact information (email, phone number)</li>
                <li>Billing and shipping addresses</li>
                <li>Payment information (processed securely by our payment processors)</li>
                <li>Account credentials (username, password)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Order Data</h3>
              <p className="text-muted-foreground mb-2">
                We collect information about your transactions, including:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Purchase history and order details</li>
                <li>Product preferences and wishlist items</li>
                <li>Shopping cart contents</li>
                <li>Communication preferences</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Browsing Data</h3>
              <p className="text-muted-foreground mb-2">
                We automatically collect certain technical information:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>IP address and device information</li>
                <li>Browser type and operating system</li>
                <li>Pages visited and time spent on our site</li>
                <li>Referring website and search terms</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 2 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Eye className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">2. How We Use Your Information</h2>
          </div>
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Order Processing</h3>
              <p className="text-muted-foreground">
                We use your information to process orders, arrange shipping, send order confirmations,
                and provide customer support related to your purchases.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Communication</h3>
              <p className="text-muted-foreground">
                With your consent, we may send you:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Order updates and shipping notifications</li>
                <li>Marketing emails about new products and promotions</li>
                <li>Technical updates and service announcements</li>
                <li>Survey requests and feedback opportunities</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                You can unsubscribe from marketing communications at any time using the link in our emails.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Analytics & Improvement</h3>
              <p className="text-muted-foreground">
                We analyze browsing patterns and purchase data to improve our website, product selection,
                and user experience. This helps us understand what products our customers are interested in and how we can serve you better.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Fraud Prevention</h3>
              <p className="text-muted-foreground">
                We use your information to detect and prevent fraud, protect our systems, and ensure the security of our platform.
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 3 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">3. Information Sharing</h2>
          </div>
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <p className="font-semibold mb-2">We never sell your personal information.</p>
                <p className="text-muted-foreground text-sm">
                  Your data is yours. We only share information as described below and as necessary to provide our services.
                </p>
              </CardContent>
            </Card>
            <div>
              <h3 className="text-xl font-semibold mb-2">Service Providers</h3>
              <p className="text-muted-foreground mb-2">
                We share information with trusted third-party service providers who help us operate our business:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Payment processors (for secure payment handling)</li>
                <li>Shipping carriers (for order fulfillment)</li>
                <li>Email service providers (for transactional and marketing emails)</li>
                <li>Analytics providers (Google Analytics for usage statistics)</li>
                <li>Cloud hosting providers (for data storage and website hosting)</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                These providers are contractually obligated to protect your data and use it only for the purposes we specify.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Legal Requirements</h3>
              <p className="text-muted-foreground">
                We may disclose your information if required by law, court order, or legal process,
                or to protect our rights, property, or safety, or that of our users or the public.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Business Transfers</h3>
              <p className="text-muted-foreground">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new owner.
                We will notify you before your information becomes subject to a different privacy policy.
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Section 4 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">4. Data Security</h2>
          </div>
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
            <p className="text-muted-foreground">
              We take data security seriously and implement industry-standard measures to protect your information:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    SSL Encryption
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    All data transmitted between your browser and our servers is encrypted using SSL/TLS technology.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    PCI Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Payment processing follows PCI DSS standards. We never store complete credit card numbers on our servers.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Secure Storage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Your data is stored on secure servers with restricted access, regular backups, and monitoring.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    Access Controls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Only authorized personnel have access to personal data, limited to what's necessary for their role.
                  </p>
                </CardContent>
              </Card>
            </div>
            <p className="text-muted-foreground">
              While we implement strong security measures, no system is completely secure. We cannot guarantee absolute security,
              but we continuously monitor and update our security practices.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 5 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">5. Cookies & Tracking</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-4">
              We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content.
              For detailed information about our cookie usage, please see our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link>.
            </p>
            <p className="text-muted-foreground">
              You can control cookies through your browser settings. Note that disabling certain cookies may affect website functionality.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 6 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">6. Your Rights</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
            <p className="text-muted-foreground mb-4">
              You have the following rights regarding your personal information:
            </p>
            <div className="space-y-3">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Access & Portability</h3>
                  <p className="text-sm text-muted-foreground">
                    You can request a copy of your personal data in a structured, machine-readable format.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Correction</h3>
                  <p className="text-sm text-muted-foreground">
                    You can update your account information at any time through your account settings.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Deletion</h3>
                  <p className="text-sm text-muted-foreground">
                    You can request deletion of your account and personal data, subject to legal retention requirements.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Opt-Out</h3>
                  <p className="text-sm text-muted-foreground">
                    Unsubscribe from marketing emails or adjust your communication preferences in account settings.
                  </p>
                </CardContent>
              </Card>
            </div>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, please contact us at privacy@lab404electronics.com. We will respond to your request within 30 days.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 7 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">7. Children's Privacy</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              Our services are not intended for children under 18. We do not knowingly collect personal information from children.
              If you believe we have collected information from a child, please contact us immediately so we can delete it.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 8 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">8. International Users</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-4">
              Lab404 Electronics is based in the United States. If you access our services from outside the U.S.,
              your information will be transferred to, stored, and processed in the United States.
            </p>
            <p className="text-muted-foreground">
              By using our services, you consent to this transfer. We comply with applicable data protection laws,
              including GDPR for European users and CCPA for California residents.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 9 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">9. Data Retention</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-4">
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Account data: While your account is active and for a reasonable period after closure</li>
              <li>Order history: 7 years for tax and accounting purposes</li>
              <li>Marketing data: Until you opt out or as required by law</li>
              <li>Analytics data: Typically 26 months (Google Analytics default)</li>
            </ul>
          </div>
        </section>

        <Separator />

        {/* Section 10 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">10. Changes to This Policy</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on our website
              and updating the "Last updated" date. For significant changes, we may also send you an email notification.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 11 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">11. Contact Us</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-4">
              For questions about this Privacy Policy or to exercise your privacy rights, please contact us:
            </p>
            <ul className="list-none space-y-2 text-muted-foreground">
              <li>Email: privacy@lab404electronics.com</li>
              <li>Address: 123 Electronics Ave, Tech City, TC 12345</li>
            </ul>
          </div>
        </section>

        {/* Contact CTA */}
        <Card className="mt-12 bg-muted/50">
          <CardHeader>
            <CardTitle>Questions about your privacy?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We're committed to protecting your privacy and answering your questions about how we handle your data.
            </p>
            <Link href="/contact">
              <Button>Contact Privacy Team</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
