'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';

const contactMethods = [
  {
    icon: Mail,
    title: 'Email',
    details: 'support@lab404electronics.com',
    description: 'Email us anytime. We respond within 24 hours.',
  },
  {
    icon: Phone,
    title: 'Phone',
    details: '+1 (555) 404-1234',
    description: 'Call us Monday-Friday, 9 AM - 6 PM EST.',
  },
  {
    icon: MapPin,
    title: 'Address',
    details: '123 Electronics Ave, Tech City, TC 12345',
    description: 'Visit our headquarters or send us mail.',
  },
];

const supportHours = [
  { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM EST' },
  { day: 'Saturday', hours: '10:00 AM - 4:00 PM EST' },
  { day: 'Sunday', hours: 'Closed' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    // Simulate form submission
    try {
      // In a real application, you would send this to your API
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Message sent successfully! We\'ll get back to you within 24 hours.');

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      {/* Hero */}
      <div className="text-center mb-12">
        <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
          Contact Us
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Have a question? We're here to help. Reach out and we'll get back to you as soon as possible.
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
        {/* Contact Methods */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Get In Touch</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method) => (
              <Card key={method.title}>
                <CardHeader>
                  <method.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-xl">{method.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold">{method.details}</p>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact Form & Support Hours */}
        <section className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Send Us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      placeholder="How can we help you?"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <textarea
                      id="message"
                      name="message"
                      placeholder="Tell us more about your question or concern..."
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full md:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Support Hours */}
          <div>
            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">Support Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supportHours.map((schedule) => (
                    <div key={schedule.day} className="flex flex-col">
                      <p className="font-semibold text-sm">{schedule.day}</p>
                      <p className="text-sm text-muted-foreground">{schedule.hours}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>Email Support:</strong> Available 24/7. We respond within 24 hours.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="mt-6 bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Quick Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Looking for specific information?
                </p>
                <div className="space-y-1">
                  <a href="/faq" className="block text-sm text-primary hover:underline">
                    → Frequently Asked Questions
                  </a>
                  <a href="/shipping" className="block text-sm text-primary hover:underline">
                    → Shipping Information
                  </a>
                  <a href="/returns" className="block text-sm text-primary hover:underline">
                    → Returns & Refunds
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Additional Info */}
        <section>
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What to expect after contacting us:
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Email inquiries receive a response within 24 hours (usually much faster)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Phone calls are answered during business hours by knowledgeable support staff</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Technical questions are routed to our engineering team for accurate answers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Order issues and returns are prioritized for immediate resolution</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
}
