'use client';

import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, Heart, TrendingUp, Code, MapPin, Clock, DollarSign } from 'lucide-react';

const benefits = [
  {
    icon: DollarSign,
    title: 'Competitive Salary',
    description: 'We offer market-leading compensation packages with performance bonuses.',
  },
  {
    icon: Heart,
    title: 'Health & Wellness',
    description: 'Comprehensive health, dental, and vision insurance for you and your family.',
  },
  {
    icon: TrendingUp,
    title: 'Employee Discounts',
    description: '25% discount on all Lab404 Electronics products for personal projects.',
  },
  {
    icon: Clock,
    title: 'Flexible Schedule',
    description: 'Work-life balance matters. Flexible hours and generous PTO policy.',
  },
  {
    icon: Users,
    title: 'Remote Options',
    description: 'Hybrid and fully remote positions available for eligible roles.',
  },
  {
    icon: Code,
    title: 'Growth & Learning',
    description: 'Professional development budget and opportunities to learn new skills.',
  },
];

const jobOpenings = [
  {
    title: 'Customer Support Specialist',
    department: 'Support',
    location: 'Remote / Tech City, TC',
    type: 'Full-time',
    description: 'Help customers with product questions, order issues, and technical support. Ideal for someone passionate about electronics and customer service.',
    requirements: [
      'Excellent communication skills',
      'Basic electronics knowledge preferred',
      '1+ years customer service experience',
      'Problem-solving mindset',
    ],
  },
  {
    title: 'Warehouse Associate',
    department: 'Operations',
    location: 'Tech City, TC',
    type: 'Full-time',
    description: 'Manage inventory, pick and pack orders, and ensure accurate shipments. Join our fast-paced warehouse team.',
    requirements: [
      'Ability to lift 50+ lbs',
      'Detail-oriented and organized',
      'Warehouse experience preferred',
      'Forklift certification a plus',
    ],
  },
  {
    title: 'Technical Content Writer',
    department: 'Marketing',
    location: 'Remote',
    type: 'Full-time',
    description: 'Create technical documentation, tutorials, and product descriptions for electronics components. Perfect for makers who love to write.',
    requirements: [
      'Strong writing and editing skills',
      'Electronics/engineering background',
      'Experience with Arduino, Raspberry Pi, etc.',
      'Portfolio of technical writing samples',
    ],
  },
  {
    title: 'Full Stack Developer',
    department: 'Engineering',
    location: 'Remote / Tech City, TC',
    type: 'Full-time',
    description: 'Build and maintain our e-commerce platform, internal tools, and customer-facing features. Work with modern web technologies.',
    requirements: [
      '3+ years full stack development',
      'React, Node.js, TypeScript experience',
      'E-commerce platform knowledge',
      'Database design and optimization',
    ],
  },
];

const applicationProcess = [
  {
    step: 1,
    title: 'Apply',
    description: 'Submit your resume and cover letter to careers@lab404electronics.com with the job title in the subject line.',
  },
  {
    step: 2,
    title: 'Initial Review',
    description: 'Our team reviews your application within 5-7 business days and contacts qualified candidates.',
  },
  {
    step: 3,
    title: 'Interview',
    description: 'Phone screening followed by in-depth interviews with team members and hiring managers.',
  },
  {
    step: 4,
    title: 'Offer',
    description: 'Receive an offer and join the Lab404 Electronics team! Onboarding begins on your start date.',
  },
];

export default function CareersPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <div className="text-center mb-12">
        <Briefcase className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
          Join Our Team
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Help us empower makers and engineers worldwide. Build your career with a passionate, innovative team.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
        {/* Why Work Here */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Why Work at Lab404?</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-lg text-muted-foreground">
                At Lab404 Electronics, you're not just an employee—you're part of a community that's passionate
                about electronics, innovation, and helping makers bring their ideas to life.
              </p>
              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Collaborative Culture</p>
                    <p className="text-sm text-muted-foreground">Work with talented, passionate people who share your love for technology.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Growth Opportunities</p>
                    <p className="text-sm text-muted-foreground">We invest in our team's development with training and advancement paths.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Make an Impact</p>
                    <p className="text-sm text-muted-foreground">Your work directly helps thousands of makers and engineers succeed.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Code className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Innovation First</p>
                    <p className="text-sm text-muted-foreground">We embrace new ideas and encourage creative problem-solving.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Benefits */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Benefits & Perks</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title}>
                <CardHeader>
                  <benefit.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Job Openings */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Current Openings</h2>
          <div className="space-y-6">
            {jobOpenings.map((job) => (
              <Card key={job.title}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {job.type}
                        </span>
                      </div>
                    </div>
                    <Button asChild>
                      <a href={`mailto:careers@lab404electronics.com?subject=Application: ${job.title}`}>
                        Apply Now
                      </a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{job.description}</p>
                  <div>
                    <p className="font-semibold mb-2">Requirements:</p>
                    <ul className="space-y-1">
                      {job.requirements.map((req, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Application Process */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Application Process</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {applicationProcess.map((step) => (
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
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Don't See a Fit? */}
        <section>
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-3">Don't see a perfect fit?</h3>
              <p className="text-muted-foreground mb-4">
                We're always looking for talented, passionate people to join our team. Even if there's no current opening
                that matches your skills, we'd love to hear from you. Send your resume and a note about what you'd bring
                to Lab404 Electronics.
              </p>
              <Button asChild variant="outline">
                <a href="mailto:careers@lab404electronics.com?subject=General Application">
                  Send General Application
                </a>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Equal Opportunity */}
        <section>
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Equal Opportunity Employer:</strong> Lab404 Electronics is committed to creating a diverse and
                inclusive workplace. We provide equal employment opportunities to all employees and applicants without
                regard to race, color, religion, sex, national origin, age, disability, or any other legally protected status.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
}
