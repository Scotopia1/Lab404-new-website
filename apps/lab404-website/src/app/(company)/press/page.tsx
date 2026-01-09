'use client';

import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, Download, Palette, TrendingUp, Mail, FileText } from 'lucide-react';

const companyStats = [
  { label: 'Founded', value: '2019' },
  { label: 'Products', value: '10,000+' },
  { label: 'Customers', value: '50,000+' },
  { label: 'Countries Served', value: '50+' },
];

const recentNews = [
  {
    date: 'January 2026',
    title: 'Lab404 Electronics Expands International Shipping',
    description: 'Now serving 50+ countries with faster delivery times and competitive rates.',
  },
  {
    date: 'November 2025',
    title: 'Reached 50,000 Customer Milestone',
    description: 'Lab404 celebrates serving 50,000 makers, engineers, and electronics enthusiasts worldwide.',
  },
  {
    date: 'September 2025',
    title: 'New Partnership with Major Distributors',
    description: 'Strategic partnerships expand product catalog to 10,000+ authentic electronic components.',
  },
  {
    date: 'June 2025',
    title: 'Lab404 Launches Technical Resource Center',
    description: 'Free tutorials, datasheets, and project guides now available to support the maker community.',
  },
];

const brandColors = [
  { name: 'Primary Blue', hex: '#0066CC', rgb: 'rgb(0, 102, 204)' },
  { name: 'Dark Gray', hex: '#1A1A1A', rgb: 'rgb(26, 26, 26)' },
  { name: 'Light Gray', hex: '#F5F5F5', rgb: 'rgb(245, 245, 245)' },
  { name: 'Accent Green', hex: '#00CC66', rgb: 'rgb(0, 204, 102)' },
];

export default function PressPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <div className="text-center mb-12">
        <Newspaper className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
          Press & Media
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Resources, news, and media assets for journalists and content creators.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
        {/* Press Kit */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Press Kit</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-muted-foreground">
                Download our official press kit containing logos, brand guidelines, company information, and high-resolution images.
              </p>
              <Button size="lg" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Press Kit (ZIP)
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Company Boilerplate */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Company Information</h2>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>About Lab404 Electronics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Lab404 Electronics is a leading online supplier of electronic components, serving makers, engineers,
                and electronics enthusiasts worldwide. Founded in 2019, the company provides access to over 10,000
                authentic products from authorized distributors, backed by expert technical support and fast shipping.
              </p>
              <p className="text-muted-foreground">
                With a commitment to quality, transparency, and customer success, Lab404 Electronics has served
                more than 50,000 customers across 50+ countries. The company's mission is to empower innovation
                by making high-quality electronic components accessible to everyone, from hobbyists to professional engineers.
              </p>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Headquarters:</strong> Tech City, TC 12345, United States
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Website:</strong> www.lab404electronics.com
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Contact:</strong> press@lab404electronics.com
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Company Stats */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">By the Numbers</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {companyStats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Brand Assets */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Palette className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Brand Assets</h2>
          </div>

          {/* Logos */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Logos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Our logo is available in multiple formats for use in print and digital media.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-6 text-center bg-white dark:bg-gray-900">
                  <div className="h-16 flex items-center justify-center mb-3 text-2xl font-bold text-primary">
                    Lab404
                  </div>
                  <p className="text-xs text-muted-foreground">Primary Logo</p>
                </div>
                <div className="border rounded-lg p-6 text-center bg-gray-900">
                  <div className="h-16 flex items-center justify-center mb-3 text-2xl font-bold text-white">
                    Lab404
                  </div>
                  <p className="text-xs text-muted-foreground">Logo on Dark</p>
                </div>
                <div className="border rounded-lg p-6 text-center bg-primary">
                  <div className="h-16 flex items-center justify-center mb-3 text-2xl font-bold text-white">
                    Lab404
                  </div>
                  <p className="text-xs text-white/80">Logo on Brand</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Logo Pack
              </Button>
            </CardContent>
          </Card>

          {/* Brand Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {brandColors.map((color) => (
                  <div key={color.name} className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-lg border shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div>
                      <p className="font-semibold text-sm">{color.name}</p>
                      <p className="text-xs text-muted-foreground">{color.hex}</p>
                      <p className="text-xs text-muted-foreground">{color.rgb}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Brand Guidelines */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Brand Usage Guidelines</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="font-semibold mb-2">Do:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Use our official logo files without modification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Maintain proper spacing around the logo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Use brand colors from our official palette</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Include proper attribution when featuring our company</span>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2">Don't:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Alter the logo colors, proportions, or design</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Use outdated or unofficial logo versions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Imply endorsement without prior written approval</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Use our brand in a misleading or offensive manner</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Recent News */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">Recent News & Milestones</h2>
          </div>
          <div className="space-y-4">
            {recentNews.map((news, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{news.date}</p>
                      <CardTitle className="text-lg">{news.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{news.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Media Contact */}
        <section>
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Mail className="h-12 w-12 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Media Inquiries</h3>
                  <p className="text-muted-foreground mb-4">
                    For press inquiries, interview requests, or additional information, please contact our media relations team.
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <strong>Email:</strong> <a href="mailto:press@lab404electronics.com" className="text-primary hover:underline">press@lab404electronics.com</a>
                    </p>
                    <p className="text-sm">
                      <strong>Phone:</strong> +1 (555) 404-1234 ext. 2
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
}
