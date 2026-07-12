"use client";

import { motion } from "framer-motion";
import { Shield, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SEO } from "@/components/shared/seo";
import { GlassCard } from "@/components/shared/glass-card";
import Link from "next/link";

const SECTIONS = [
  {
    id: "information-we-collect",
    title: "1. Information We Collect",
    content: (
      <div className="space-y-4">
        <p>
          We collect information you provide directly to us, including:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Account Information:</strong> When you create an account, we collect your name, email address, password, and optional profile information.</li>
          <li><strong>Profile Information:</strong> Shipping addresses, phone number, and payment information you provide.</li>
          <li><strong>Order Information:</strong> Details about products you purchase, order history, and preferences.</li>
          <li><strong>Communications:</strong> Information you provide when contacting our support team or participating in surveys.</li>
        </ul>
        <p className="mt-4">
          We also automatically collect certain information when you visit our platform:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Usage Data:</strong> Pages visited, time spent, and interactions with our platform.</li>
          <li><strong>Device Information:</strong> Browser type, operating system, IP address, and device identifiers.</li>
          <li><strong>Cookies:</strong> We use cookies and similar tracking technologies to enhance your experience.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "how-we-use",
    title: "2. How We Use Your Information",
    content: (
      <div className="space-y-4">
        <p>We use the collected information for the following purposes:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Process and fulfill your orders, including sending order confirmations and updates</li>
          <li>Provide, maintain, and improve our platform and services</li>
          <li>Personalize your shopping experience and recommend products</li>
          <li>Process payments and prevent fraudulent transactions</li>
          <li>Communicate with you about orders, products, services, and promotions</li>
          <li>Respond to your comments, questions, and support requests</li>
          <li>Comply with legal obligations and enforce our terms</li>
        </ul>
      </div>
    ),
  },
  {
    id: "information-sharing",
    title: "3. Information Sharing",
    content: (
      <div className="space-y-4">
        <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Service Providers:</strong> With third-party vendors who help us operate our platform (payment processing, shipping, analytics).</li>
          <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your information may be transferred.</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect our rights, privacy, safety, or property.</li>
          <li><strong>With Your Consent:</strong> We may share your information for any other purpose with your explicit consent.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "data-security",
    title: "4. Data Security",
    content: (
      <div className="space-y-4">
        <p>
          We implement industry-standard security measures to protect your personal information:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>SSL/TLS encryption for all data transmissions</li>
          <li>Encrypted storage of sensitive information including payment data</li>
          <li>Regular security audits and vulnerability assessments</li>
          <li>Access controls and authentication protocols</li>
          <li>PCI DSS compliance for payment processing</li>
        </ul>
        <p className="mt-4">
          While we strive to protect your personal information, no method of transmission or
          storage is 100% secure. We cannot guarantee absolute security.
        </p>
      </div>
    ),
  },
  {
    id: "your-rights",
    title: "5. Your Rights",
    content: (
      <div className="space-y-4">
        <p>Depending on your location, you may have the following rights regarding your personal information:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
          <li><strong>Deletion:</strong> Request deletion of your personal data, subject to certain exceptions.</li>
          <li><strong>Portability:</strong> Request transfer of your data to another service provider.</li>
          <li><strong>Opt-Out:</strong> Opt out of marketing communications and certain data processing.</li>
          <li><strong>Withdraw Consent:</strong> Withdraw consent at any time where we rely on consent for processing.</li>
        </ul>
        <p className="mt-4">
          To exercise any of these rights, please contact us at privacy@shopnova.com.
        </p>
      </div>
    ),
  },
  {
    id: "cookies",
    title: "6. Cookies & Tracking",
    content: (
      <div className="space-y-4">
        <p>
          We use cookies and similar tracking technologies to enhance your browsing experience,
          analyze site traffic, and understand where our audience comes from.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Essential Cookies:</strong> Required for the platform to function properly.</li>
          <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our platform.</li>
          <li><strong>Preference Cookies:</strong> Remember your settings and preferences.</li>
          <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements.</li>
        </ul>
        <p className="mt-4">
          You can control cookies through your browser settings. Disabling certain cookies may
          affect the functionality of our platform.
        </p>
      </div>
    ),
  },
  {
    id: "third-party",
    title: "7. Third-Party Services",
    content: (
      <div className="space-y-4">
        <p>
          Our platform may contain links to third-party websites and services. We are not
          responsible for the privacy practices of these third parties. We encourage you to
          review their privacy policies before providing any personal information.
        </p>
        <p className="mt-2">
          We use the following third-party services:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Stripe for payment processing</li>
          <li>Firebase Storage for image hosting and optimization</li>
          <li>Google Analytics for website analytics</li>
          <li>SendGrid for email communications</li>
        </ul>
      </div>
    ),
  },
  {
    id: "children",
    title: "8. Children's Privacy",
    content: (
      <div className="space-y-4">
        <p>
          Our platform is not intended for children under the age of 16. We do not knowingly
          collect personal information from children. If we discover that a child under 16 has
          provided us with personal information, we will delete it immediately.
        </p>
      </div>
    ),
  },
  {
    id: "changes",
    title: "9. Changes to This Policy",
    content: (
      <div className="space-y-4">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any
          changes by posting the new policy on this page and updating the &quot;Last Updated&quot; date.
          We encourage you to review this policy periodically.
        </p>
        <p className="mt-2">
          For significant changes, we will provide a more prominent notice, including email
          notification for registered users.
        </p>
      </div>
    ),
  },
  {
    id: "contact",
    title: "10. Contact Us",
    content: (
      <div className="space-y-4">
        <p>
          If you have any questions about this Privacy Policy or our data practices, please
          contact us at:
        </p>
        <div className="rounded-lg bg-muted p-4">
          <p className="font-medium">ShopNova Privacy Team</p>
          <p className="text-sm text-muted-foreground">123 Commerce Street</p>
          <p className="text-sm text-muted-foreground">New York, NY 10001</p>
          <p className="text-sm text-muted-foreground">Email: privacy@shopnova.com</p>
        </div>
      </div>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="ShopNova's privacy policy. Learn how we collect, use, and protect your personal information."
        path="/privacy"
      />

      <div className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-blue-500/10 via-purple-500/5 to-transparent blur-3xl" />
        </div>

        {/* Header */}
        <section className="relative px-4 pb-8 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm">
              Legal
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Last Updated: January 1, 2026
            </p>
          </motion.div>
        </section>

        {/* Content */}
        <section className="relative px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard className="p-6 sm:p-8">
                <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
                  <p className="text-muted-foreground">
                    At ShopNova, we take your privacy seriously. This Privacy Policy explains
                    how we collect, use, disclose, and safeguard your information when you visit
                    our platform. Please read this policy carefully.
                  </p>

                  {SECTIONS.map((section) => (
                    <div key={section.id} id={section.id}>
                      <h2 className="text-xl font-semibold tracking-tight">
                        {section.title}
                      </h2>
                      <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
                        {section.content}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Navigation */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-between">
              <Link href="/terms">
                <Button variant="outline" className="gap-2">
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Terms of Service
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="gap-2">
                  Questions? Contact Us
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
