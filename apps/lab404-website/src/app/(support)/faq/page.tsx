'use client';

import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HelpCircle, Package, CreditCard, Truck, RotateCcw, User, Mail } from 'lucide-react';

const faqCategories = [
  {
    icon: CreditCard,
    title: 'Ordering',
    id: 'ordering',
    questions: [
      {
        q: 'How do I place an order?',
        a: 'Browse our products, add items to your cart, and click "Checkout". You can checkout as a guest or create an account for faster future purchases. Follow the prompts to enter shipping and payment information.'
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept major credit cards (Visa, Mastercard, American Express, Discover), debit cards, and PayPal. All payments are processed securely through PCI-compliant payment processors.'
      },
      {
        q: 'Can I modify my order after placing it?',
        a: 'Orders can be modified within 1 hour of placement if they haven\'t been processed yet. Contact our support team immediately at support@lab404electronics.com. After processing begins, changes cannot be made, but you can use our return policy.'
      },
      {
        q: 'Do you offer bulk discounts?',
        a: 'Yes! For orders of 100+ units of the same item, please contact us at sales@lab404electronics.com for volume pricing. We also offer educational discounts for schools and universities.'
      },
    ]
  },
  {
    icon: Truck,
    title: 'Shipping',
    id: 'shipping',
    questions: [
      {
        q: 'What are your shipping costs?',
        a: 'Shipping costs vary by weight, destination, and speed. Standard shipping (5-7 business days) is FREE on orders over $50. Express shipping (2-3 days) is $9.99, and Next Day is $24.99. Exact costs are calculated at checkout.'
      },
      {
        q: 'How long does delivery take?',
        a: 'Standard shipping: 5-7 business days. Express: 2-3 business days. Next Day: 1 business day. Processing time is typically same-day for orders placed before 2 PM EST. International orders may take 7-21 days depending on customs.'
      },
      {
        q: 'Do you ship internationally?',
        a: 'Yes, we ship to over 50 countries worldwide. International shipping rates and delivery times vary by destination. Customers are responsible for any customs duties or import taxes. Check our Shipping Information page for more details.'
      },
      {
        q: 'How can I track my order?',
        a: 'You\'ll receive a tracking number via email once your order ships. You can also track your order by logging into your account and viewing Order History, or use our Track Order tool on the Order Tracking page.'
      },
    ]
  },
  {
    icon: RotateCcw,
    title: 'Returns',
    id: 'returns',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We offer a 30-day return policy for most products in new, unopened condition with original packaging. Returns must be initiated within 30 days of delivery. See our Returns & Refunds page for complete details.'
      },
      {
        q: 'How do I return a product?',
        a: 'Log into your account, go to Order History, select the order, and click "Request Return". You\'ll receive an RMA number and return instructions. Ship the item back with the RMA number clearly marked. We\'ll process your refund once received.'
      },
      {
        q: 'How long do refunds take?',
        a: 'Refunds are processed within 3-5 business days of receiving your return. The refund will be issued to your original payment method. Depending on your bank, it may take an additional 5-10 business days to appear in your account.'
      },
      {
        q: 'What if I receive a defective item?',
        a: 'We\'re sorry! If you receive a defective item, contact us within 7 days of delivery. We\'ll provide a prepaid return label and send a replacement at no cost, or issue a full refund including return shipping. This is covered under our Dead on Arrival (DOA) policy.'
      },
    ]
  },
  {
    icon: Package,
    title: 'Products',
    id: 'products',
    questions: [
      {
        q: 'Are all products authentic?',
        a: 'Absolutely. We source all products directly from authorized distributors and manufacturers. Every product is guaranteed authentic and comes with any applicable manufacturer warranty. We never sell counterfeit or gray-market items.'
      },
      {
        q: 'Do you provide datasheets and technical specs?',
        a: 'Yes! Most product pages include links to datasheets, technical specifications, and application notes. If you can\'t find the documentation you need, contact our technical support team and we\'ll help you find it.'
      },
      {
        q: 'What if a product is out of stock?',
        a: 'You can sign up for back-in-stock notifications on the product page. We\'ll email you when it\'s available again. You can also contact us at stock@lab404electronics.com to check expected restock dates or find alternative products.'
      },
      {
        q: 'Do you offer technical support?',
        a: 'Yes! We provide technical support for product selection, datasheets, and basic troubleshooting. Our team can help you choose the right components for your project. However, we don\'t provide custom design services or project-specific engineering.'
      },
    ]
  },
  {
    icon: User,
    title: 'Account',
    id: 'account',
    questions: [
      {
        q: 'Do I need an account to order?',
        a: 'No, you can checkout as a guest. However, creating an account offers benefits like order tracking, saved addresses, wishlist, faster checkout, and access to order history. It\'s free and takes less than a minute.'
      },
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot Password" on the login page, enter your email address, and we\'ll send you a verification code. Enter the code and create a new password. If you don\'t receive the email, check your spam folder or contact support.'
      },
      {
        q: 'Can I save multiple shipping addresses?',
        a: 'Yes! In your account settings, go to "Addresses" where you can add, edit, and delete multiple shipping addresses. You can select which address to use at checkout, making it easy to send gifts or ship to different locations.'
      },
      {
        q: 'How do I update my account information?',
        a: 'Log into your account and click "Profile" or "Account Settings". You can update your name, email, phone number, password, and communication preferences. Changes are saved automatically. For security, password changes require your current password.'
      },
    ]
  },
];

export default function FAQPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <div className="text-center mb-12">
        <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Find quick answers to common questions about ordering, shipping, returns, and more.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
        {faqCategories.map((category) => (
          <a
            key={category.id}
            href={`#${category.id}`}
            className="flex flex-col items-center p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <category.icon className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm font-medium text-center">{category.title}</span>
          </a>
        ))}
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto space-y-12">
        {faqCategories.map((category) => (
          <section key={category.id} id={category.id}>
            <div className="flex items-center gap-3 mb-6">
              <category.icon className="h-6 w-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">{category.title}</h2>
            </div>
            <div className="space-y-4">
              {category.questions.map((item, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.q}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Still Need Help CTA */}
      <Card className="mt-12 max-w-4xl mx-auto bg-primary/5 border-primary/20">
        <CardContent className="pt-6 text-center">
          <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-4">
            Our support team is ready to help you with any questions not answered here.
          </p>
          <Link href="/contact">
            <Button size="lg">Contact Support</Button>
          </Link>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
