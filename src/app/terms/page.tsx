"use client";

import { motion } from "framer-motion";
import { Scale, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/shared/seo";
import { GlassCard } from "@/components/shared/glass-card";
import Link from "next/link";

const SECTIONS = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: (
      <div className="space-y-4">
        <p>
          By accessing or using ShopNova (&quot;the Platform&quot;), you agree to be bound by these
          Terms of Service. If you do not agree with any part of these terms, you must not
          use our platform.
        </p>
        <p>
          These terms apply to all visitors, users, and customers who access or use our
          platform. We reserve the right to update these terms at any time, and continued
          use of the platform constitutes acceptance of the updated terms.
        </p>
      </div>
    ),
  },
  {
    id: "account-registration",
    title: "2. Account Registration",
    content: (
      <div className="space-y-4">
        <p>When creating an account on our platform, you agree to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide accurate, current, and complete information</li>
          <li>Maintain and update your account information promptly</li>
          <li>Keep your password secure and confidential</li>
          <li>Notify us immediately of any unauthorized use of your account</li>
          <li>Be responsible for all activities that occur under your account</li>
        </ul>
        <p className="mt-4">
          We reserve the right to suspend or terminate accounts that provide false
          information or violate these terms.
        </p>
      </div>
    ),
  },
  {
    id: "products-pricing",
    title: "3. Products & Pricing",
    content: (
      <div className="space-y-4">
        <p>
          All product descriptions, images, and pricing are subject to change without notice.
          We make every effort to ensure accuracy, but we do not warrant that product
          descriptions or prices are error-free.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Prices are listed in the currency specified and exclude applicable taxes</li>
          <li>We reserve the right to modify prices at any time</li>
          <li>In the event of a pricing error, we may cancel the order and issue a full refund</li>
          <li>Product availability is subject to change without notice</li>
        </ul>
      </div>
    ),
  },
  {
    id: "orders-payment",
    title: "4. Orders & Payment",
    content: (
      <div className="space-y-4">
        <p>
          By placing an order through our platform, you agree to provide accurate payment
          information and authorize us to charge the applicable fees.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>All orders are subject to acceptance and availability</li>
          <li>We reserve the right to refuse or cancel any order</li>
          <li>Payment is due at the time of purchase</li>
          <li>We accept major credit cards, PayPal, and other payment methods as indicated</li>
          <li>Your payment information is processed securely through our payment partners</li>
        </ul>
      </div>
    ),
  },
  {
    id: "shipping-delivery",
    title: "5. Shipping & Delivery",
    content: (
      <div className="space-y-4">
        <p>
          We strive to deliver your orders in a timely manner. Shipping times are estimates
          and not guaranteed.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Shipping costs are calculated at checkout based on destination and shipping method</li>
          <li>Risk of loss passes to you upon delivery to the carrier</li>
          <li>Delivery times may vary due to factors beyond our control</li>
          <li>International orders may be subject to customs duties and taxes</li>
        </ul>
      </div>
    ),
  },
  {
    id: "returns-refunds",
    title: "6. Returns & Refunds",
    content: (
      <div className="space-y-4">
        <p>
          Our return policy allows you to return most items within 30 days of delivery for a
          full refund, subject to the following conditions:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Items must be unused and in their original packaging</li>
          <li>Return shipping costs are the responsibility of the customer unless the item is defective</li>
          <li>Refunds are processed within 5-7 business days after receiving the return</li>
          <li>Certain items (perishables, intimate apparel, digital products) may not be eligible for return</li>
          <li>Sale items may be subject to different return conditions</li>
        </ul>
      </div>
    ),
  },
  {
    id: "intellectual-property",
    title: "7. Intellectual Property",
    content: (
      <div className="space-y-4">
        <p>
          The platform and its entire contents, features, and functionality are owned by
          ShopNova and are protected by copyright, trademark, and other intellectual property
          laws.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>You may not reproduce, distribute, modify, or create derivative works without our consent</li>
          <li>Our trademarks and trade dress may not be used without prior written permission</li>
          <li>User-generated content you submit grants us a non-exclusive license to use it on our platform</li>
        </ul>
      </div>
    ),
  },
  {
    id: "prohibited-activities",
    title: "8. Prohibited Activities",
    content: (
      <div className="space-y-4">
        <p>You agree not to engage in any of the following prohibited activities:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Using the platform for any unlawful purpose or in violation of applicable laws</li>
          <li>Attempting to interfere with the proper functioning of the platform</li>
          <li>Circumventing any security measures or access controls</li>
          <li>Engaging in any form of data mining or scraping</li>
          <li>Impersonating any person or entity</li>
          <li>Harassing, abusing, or harming other users</li>
        </ul>
      </div>
    ),
  },
  {
    id: "limitation-liability",
    title: "9. Limitation of Liability",
    content: (
      <div className="space-y-4">
        <p>
          To the fullest extent permitted by law, ShopNova shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages, including loss
          of profits, data, or goodwill, arising from your use of the platform.
        </p>
        <p className="mt-2">
          Our total liability for any claims arising under these terms shall not exceed the
          amount paid by you for the product or service giving rise to the claim.
        </p>
      </div>
    ),
  },
  {
    id: "termination",
    title: "10. Termination",
    content: (
      <div className="space-y-4">
        <p>
          We may terminate or suspend your account and access to the platform immediately,
          without prior notice, for any reason, including breach of these Terms of Service.
        </p>
        <p className="mt-2">
          Upon termination, your right to use the platform will cease immediately. Provisions
          of these terms that by their nature should survive termination shall survive.
        </p>
      </div>
    ),
  },
  {
    id: "governing-law",
    title: "11. Governing Law",
    content: (
      <div className="space-y-4">
        <p>
          These Terms of Service shall be governed by and construed in accordance with the
          laws of the State of New York, without regard to its conflict of law provisions.
        </p>
        <p className="mt-2">
          Any disputes arising from these terms shall be resolved in the courts of New York
          County, New York.
        </p>
      </div>
    ),
  },
  {
    id: "contact-legal",
    title: "12. Contact Information",
    content: (
      <div className="space-y-4">
        <p>
          For questions about these Terms of Service, please contact us:
        </p>
        <div className="rounded-lg bg-muted p-4">
          <p className="font-medium">ShopNova Legal Department</p>
          <p className="text-sm text-muted-foreground">123 Commerce Street</p>
          <p className="text-sm text-muted-foreground">New York, NY 10001</p>
          <p className="text-sm text-muted-foreground">Email: legal@shopnova.com</p>
        </div>
      </div>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="ShopNova's terms of service. Read our policies regarding account registration, orders, payments, returns, and more."
        path="/terms"
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
              Terms of Service
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
                    Welcome to ShopNova. By accessing or using our platform, you agree to
                    comply with and be bound by the following Terms of Service. Please review
                    these terms carefully before using our services.
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
              <Link href="/privacy">
                <Button variant="outline" className="gap-2">
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Privacy Policy
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
