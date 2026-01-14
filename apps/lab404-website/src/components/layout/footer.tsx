'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Send, Zap } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';

const shopLinks = [
    { href: '/products', label: 'All Products' },
    { href: '/products?category=sensors', label: 'Sensors' },
    { href: '/products?category=microcontrollers', label: 'Microcontrollers' },
    { href: '/products?category=components', label: 'Components' },
    { href: '/products?category=kits', label: 'DIY Kits' },
];

const supportLinks = [
    { href: '/order-tracking', label: 'Track Order' },
    { href: '/shipping', label: 'Shipping Info' },
    { href: '/returns', label: 'Returns & Refunds' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact Us' },
];

const companyLinks = [
    { href: '/about', label: 'About Us' },
    { href: '/blog', label: 'Blog' },
    { href: '/careers', label: 'Careers' },
    { href: '/press', label: 'Press' },
];

const legalLinks = [
    { href: '/terms', label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/cookies', label: 'Cookie Policy' },
];

const socialLinks = [
    { href: 'https://facebook.com/lab404electronics', icon: Facebook, label: 'Facebook' },
    { href: 'https://twitter.com/lab404electronics', icon: Twitter, label: 'Twitter' },
    { href: 'https://instagram.com/lab404electronics', icon: Instagram, label: 'Instagram' },
    { href: 'https://youtube.com/lab404electronics', icon: Youtube, label: 'YouTube' },
];

export function Footer() {
    const [email, setEmail] = useState('');
    const { data: settings } = useSettings();

    const handleNewsletterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement newsletter subscription
        console.log('Newsletter subscription:', email);
        setEmail('');
    };

    return (
        <footer className="border-t bg-muted/30">
            {/* Newsletter Section */}
            <div className="bg-primary text-primary-foreground">
                <div className="container-main py-8 md:py-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                <Zap className="h-5 w-5" />
                                <h3 className="text-lg font-bold">Stay in the Loop</h3>
                            </div>
                            <p className="text-primary-foreground/80 text-sm max-w-md">
                                Subscribe to get exclusive deals, new product alerts, and electronics tips delivered to your inbox.
                            </p>
                        </div>
                        <form onSubmit={handleNewsletterSubmit} className="flex w-full max-w-md gap-2">
                            <div className="relative flex-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-background text-foreground"
                                    required
                                />
                            </div>
                            <Button type="submit" variant="secondary" className="font-semibold">
                                <Send className="h-4 w-4 mr-2" />
                                Subscribe
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="container-main py-12 md:py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-4 lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                                404
                            </div>
                            <span className="font-bold text-xl">Lab404</span>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-4">
                            Your trusted source for premium electronic components, sensors, and DIY kits.
                        </p>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            {settings?.company_email && (
                                <a href={`mailto:${settings.company_email}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                                    <Mail className="h-4 w-4" />
                                    {settings.company_email}
                                </a>
                            )}
                            {settings?.company_phone && (
                                <a href={`tel:${settings.company_phone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                                    <Phone className="h-4 w-4" />
                                    {settings.company_phone}
                                </a>
                            )}
                            {settings?.company_address && (
                                <p className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    {settings.company_address}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Shop Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Shop</h4>
                        <ul className="space-y-2">
                            {shopLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Support</h4>
                        <ul className="space-y-2">
                            {supportLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Company</h4>
                        <ul className="space-y-2">
                            {companyLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2">
                            {legalLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <Separator />
            <div className="container-main py-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground text-center md:text-left">
                        &copy; {new Date().getFullYear()} {settings?.company_name || 'Lab404 Electronics'}. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        {socialLinks.map((social) => (
                            <a
                                key={social.label}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                aria-label={social.label}
                            >
                                <social.icon className="h-5 w-5" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
