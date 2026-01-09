'use client';

import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Cookie, Calendar, Settings, BarChart3, ShoppingCart, Target } from 'lucide-react';

export default function CookiesPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center gap-2 mb-4 text-muted-foreground">
          <Cookie className="h-5 w-5" />
          <span className="text-sm">Legal</span>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
          Cookie Policy
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
            This Cookie Policy explains how Lab404 Electronics uses cookies and similar tracking technologies on our website.
            By using our site, you consent to the use of cookies as described in this policy.
          </p>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="max-w-4xl space-y-8 md:space-y-12">
        {/* Section 1 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">What Are Cookies?</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-4">
              Cookies are small text files that are placed on your device (computer, tablet, or mobile phone) when you visit a website.
              They are widely used to make websites work efficiently and provide information to website owners.
            </p>
            <p className="text-muted-foreground">
              Cookies help us remember your preferences, understand how you use our site, and improve your overall experience.
              They can be "session cookies" (temporary, deleted when you close your browser) or "persistent cookies" (remain on your device for a set period).
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 2 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Types of Cookies We Use</h2>
          <div className="space-y-6">
            {/* Essential Cookies */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Essential Cookies</CardTitle>
                    <p className="text-sm text-muted-foreground">Required for the website to function</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  These cookies are necessary for our website to work properly. They enable core functionality such as:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground text-sm">
                  <li>Shopping cart functionality (remembering items you've added)</li>
                  <li>User authentication (keeping you logged in)</li>
                  <li>Security features and fraud prevention</li>
                  <li>Session management</li>
                  <li>CSRF protection tokens</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  <strong>Note:</strong> These cookies cannot be disabled as they are essential for the site to function. Without them, you won't be able to use key features like shopping or account access.
                </p>
              </CardContent>
            </Card>

            {/* Functional Cookies */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle>Functional Cookies</CardTitle>
                    <p className="text-sm text-muted-foreground">Enhance your experience with personalization</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  These cookies enable enhanced functionality and personalization:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground text-sm">
                  <li>Remembering your preferences (language, currency, region)</li>
                  <li>Saving your display settings (dark mode, layout preferences)</li>
                  <li>Storing recently viewed products</li>
                  <li>Remembering form inputs to save you time</li>
                  <li>Providing customized content based on your interests</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  These cookies improve your experience but are not strictly necessary. You can disable them, though some features may not work as smoothly.
                </p>
              </CardContent>
            </Card>

            {/* Analytics Cookies */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle>Analytics Cookies</CardTitle>
                    <p className="text-sm text-muted-foreground">Help us understand how you use our site</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  We use analytics cookies to collect information about how visitors use our website:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground text-sm">
                  <li>Pages visited and time spent on each page</li>
                  <li>How you arrived at our site (referral source)</li>
                  <li>Which products and categories you browse</li>
                  <li>Search terms used on our site</li>
                  <li>Device and browser information</li>
                  <li>Geographic location (city/country level)</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  <strong>Provider:</strong> We primarily use Google Analytics. This data is collected anonymously and helps us improve our website and product offerings.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Opt-out:</strong> You can opt out of Google Analytics by installing the{' '}
                  <a
                    href="https://tools.google.com/dlpage/gaoptout"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google Analytics Opt-out Browser Add-on
                  </a>.
                </p>
              </CardContent>
            </Card>

            {/* Marketing Cookies */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle>Marketing Cookies</CardTitle>
                    <p className="text-sm text-muted-foreground">Deliver relevant advertisements</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  Marketing cookies track your online activity to help us show you relevant ads:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground text-sm">
                  <li>Products you've viewed on our site</li>
                  <li>Items in your cart or wishlist</li>
                  <li>Your interests based on browsing behavior</li>
                  <li>Ad performance and effectiveness</li>
                  <li>Retargeting across different websites</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  <strong>Partners:</strong> We may work with advertising networks like Google Ads and Facebook Pixel to show you relevant ads on other websites.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  These cookies may be set by us or third-party advertising partners. You can opt out using the controls described below.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Section 3 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">How to Control Cookies</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Browser Settings</h3>
              <p className="text-muted-foreground mb-3">
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Block all cookies</li>
                <li>Block third-party cookies only</li>
                <li>Delete cookies when you close your browser</li>
                <li>View and delete existing cookies</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Here are links to cookie settings for popular browsers:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground mt-2">
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
                <li><a href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Opt-Out Links</h3>
              <p className="text-muted-foreground mb-2">
                You can opt out of certain types of tracking:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>Google Analytics:</strong> Use the{' '}
                  <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Google Analytics Opt-out Browser Add-on
                  </a>
                </li>
                <li>
                  <strong>Interest-based Ads:</strong> Visit{' '}
                  <a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Digital Advertising Alliance
                  </a>{' '}
                  or{' '}
                  <a href="http://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Network Advertising Initiative
                  </a>
                </li>
              </ul>
            </div>

            <Card className="bg-amber-500/5 border-amber-500/20 mt-4">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  <strong>Important:</strong> Blocking or deleting cookies may affect your ability to use certain features of our website,
                  such as staying logged in or maintaining items in your shopping cart. Essential cookies cannot be disabled if you want to use the site.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Section 4 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Third-Party Cookies</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-4">
              Some cookies on our site are set by third-party services we use:
            </p>
            <div className="space-y-3">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Google Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Tracks website usage and performance. Read Google's{' '}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Privacy Policy
                    </a>.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Payment Processors</h3>
                  <p className="text-sm text-muted-foreground">
                    Our payment gateway providers (e.g., Stripe) may set cookies for fraud prevention and secure payment processing.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Social Media</h3>
                  <p className="text-sm text-muted-foreground">
                    Social media sharing buttons may set cookies if you interact with them. These are controlled by the respective social media platforms.
                  </p>
                </CardContent>
              </Card>
            </div>
            <p className="text-muted-foreground mt-4">
              We do not control third-party cookies. Please refer to the third parties' websites for more information about their cookie policies.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 5 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Do Not Track Signals</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              Some browsers include a "Do Not Track" (DNT) feature that signals to websites that you don't want to be tracked.
              Currently, there is no industry standard for how to respond to DNT signals.
              Our website does not currently respond to DNT signals, but we respect your privacy choices through other methods described in this policy.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 6 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Updates to This Policy</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons.
              The "Last updated" date at the top of this page indicates when this policy was last revised.
            </p>
          </div>
        </section>

        <Separator />

        {/* Section 7 */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Questions?</h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-4">
              If you have questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            <ul className="list-none space-y-2 text-muted-foreground">
              <li>Email: privacy@lab404electronics.com</li>
              <li>Address: 123 Electronics Ave, Tech City, TC 12345</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              For more information about our privacy practices, please see our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </section>

        {/* Contact CTA */}
        <Card className="mt-12 bg-muted/50">
          <CardHeader>
            <CardTitle>More questions about cookies?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We're here to help explain how we use cookies and how you can control them.
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
