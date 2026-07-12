"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Search,
  HelpCircle,
  MessageSquare,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { SEO } from "@/components/shared/seo";
import { GlassCard } from "@/components/shared/glass-card";
import { FAQ_DATA } from "@/lib/constants";
import Link from "next/link";

const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Orders", value: "order" },
  { label: "Shipping", value: "shipping" },
  { label: "Returns", value: "return" },
  { label: "Payment", value: "payment" },
  { label: "Account", value: "account" },
];

// Categorize FAQ data with simple keyword matching
const getCategory = (question: string): string => {
  const q = question.toLowerCase();
  if (q.includes("shipping") || q.includes("delivery") || q.includes("track")) return "shipping";
  if (q.includes("return") || q.includes("cancel") || q.includes("change")) return "return";
  if (q.includes("payment") || q.includes("card") || q.includes("pay")) return "payment";
  if (q.includes("account") || q.includes("sign") || q.includes("login") || q.includes("password")) return "account";
  if (q.includes("order")) return "order";
  return "order";
};

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredFAQs = FAQ_DATA.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || getCategory(faq.question) === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <SEO
        title="FAQ"
        description="Frequently asked questions about ShopNova. Find answers about orders, shipping, returns, payments, and more."
        path="/faq"
      />

      <div className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-blue-500/10 via-purple-500/5 to-transparent blur-3xl" />
        </div>

        {/* Hero */}
        <section className="relative px-4 pb-12 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm">
              FAQ
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Find answers to common questions about ordering, shipping, returns, and more.
            </p>
          </motion.div>
        </section>

        {/* Search and filters */}
        <section className="relative px-4 pb-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative mb-6"
            >
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 text-base"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-2"
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    activeCategory === cat.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </motion.div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="relative px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {filteredFAQs.length > 0 ? (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05 } },
                }}
              >
                <GlassCard className="p-2">
                  <Accordion type="multiple" className="space-y-1">
                    {filteredFAQs.map((faq, index) => (
                      <motion.div
                        key={index}
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: { opacity: 1, y: 0 },
                        }}
                      >
                        <AccordionItem value={`item-${index}`} className="border-none">
                          <AccordionTrigger className="rounded-lg px-4 py-4 text-left hover:bg-accent/50 hover:no-underline data-[state=open]:bg-accent/30">
                            <div className="flex items-start gap-3 text-left">
                              <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                              <span className="text-sm font-medium">{faq.question}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 pt-2">
                            <div className="ml-8 text-sm text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </motion.div>
                    ))}
                  </Accordion>
                </GlassCard>
              </motion.div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center py-16 text-center">
                  <HelpCircle className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold">No results found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try adjusting your search or browse all categories.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("all");
                    }}
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Still have questions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="py-8">
                  <MessageSquare className="mx-auto mb-4 h-10 w-10 text-primary" />
                  <h3 className="text-lg font-semibold">Still have questions?</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
                  </p>
                  <Link href="/contact">
                    <Button className="mt-4 gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Contact Support
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
