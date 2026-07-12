"use client";

import { motion } from "framer-motion";
import {
  Target,
  Shield,
  Zap,
  HeartHandshake,
  Leaf,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SEO } from "@/components/shared/seo";
import { GlassCard } from "@/components/shared/glass-card";
import { StatsCard } from "@/components/shared/stats-card";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
  }),
};

const TEAM_MEMBERS = [
  {
    name: "Sarah Chen",
    role: "CEO & Founder",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    bio: "Former tech executive with 15+ years in e-commerce.",
  },
  {
    name: "Marcus Johnson",
    role: "CTO",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    bio: "Full-stack engineer and cloud architecture expert.",
  },
  {
    name: "Emily Rodriguez",
    role: "Head of Design",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
    bio: "Award-winning designer specializing in UX/UI.",
  },
  {
    name: "David Kim",
    role: "VP of Operations",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    bio: "Supply chain expert with global logistics experience.",
  },
];

const VALUES = [
  {
    icon: HeartHandshake,
    title: "Customer First",
    description: "Every decision we make starts with our customers. Your satisfaction drives everything we do.",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: Shield,
    title: "Trust & Security",
    description: "We prioritize your privacy and security with industry-standard encryption and secure payments.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "We continuously evolve our platform with cutting-edge technology to serve you better.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Leaf,
    title: "Sustainability",
    description: "We're committed to eco-friendly practices, from packaging to carbon-neutral shipping.",
    color: "from-green-500 to-emerald-500",
  },
];

const COMPANY_STATS = [
  { label: "Active Customers", value: "50K+", icon: TrendingUp },
  { label: "Products Available", value: "10K+", icon: CheckCircle2 },
  { label: "Orders Delivered", value: "100K+", icon: Zap },
  { label: "Countries Served", value: "50+", icon: Shield },
];

export default function AboutPage() {
  return (
    <>
      <SEO
        title="About Us"
        description="Learn about ShopNova's mission, team, and commitment to delivering premium products worldwide."
        path="/about"
      />

      <div className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-blue-500/10 via-purple-500/5 to-transparent blur-3xl" />
        </div>

        {/* Hero Section */}
        <section className="relative px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div variants={fadeInUp} custom={0}>
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm">
                Our Story
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              custom={1}
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              We&apos;re on a mission to
              <span className="gradient-text"> redefine shopping</span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              custom={2}
              className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
            >
              ShopNova was founded with a simple vision: make premium products accessible to everyone.
              We combine cutting-edge technology with curated selections to deliver an unparalleled
              shopping experience.
            </motion.p>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="relative px-4 pb-20 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {COMPANY_STATS.map((stat, index) => (
              <motion.div key={stat.label} variants={fadeInUp} custom={index}>
                <GlassCard className="p-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Story Section */}
        <section className="relative px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl font-bold tracking-tight">
                  Our Story
                </h2>
                <div className="mt-6 space-y-4 text-muted-foreground">
                  <p>
                    Founded in 2024, ShopNova emerged from a simple observation: online shopping
                    had become impersonal and overwhelming. We set out to create a platform that
                    combines the convenience of digital commerce with the personalized touch of
                    a boutique experience.
                  </p>
                  <p>
                    What started as a small operation with just 50 products has grown into a
                    global marketplace featuring thousands of carefully curated items. Our team
                    works tirelessly to source the best products from around the world, ensuring
                    every item meets our rigorous quality standards.
                  </p>
                  <p>
                    Today, we serve customers in over 50 countries, and we&apos;re just getting
                    started. Our commitment to innovation, sustainability, and customer
                    satisfaction remains at the core of everything we do.
                  </p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80"
                    alt="Our team at work"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-4 -left-4 rounded-2xl border border-white/20 bg-background/80 p-4 backdrop-blur-xl">
                  <p className="text-sm font-semibold">Founded 2024</p>
                  <p className="text-xs text-muted-foreground">Global e-commerce platform</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="relative px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl font-bold tracking-tight"
              >
                Our Values
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                custom={1}
                className="mt-4 text-muted-foreground"
              >
                The principles that guide everything we do.
              </motion.p>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2">
              {VALUES.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.div
                    key={value.title}
                    variants={fadeInUp}
                    custom={index}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className="h-full transition-all hover:border-primary/30 hover:shadow-lg">
                      <CardContent className="p-6">
                        <div
                          className={cn(
                            "mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                            value.color
                          )}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold">{value.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {value.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="relative px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl font-bold tracking-tight">
                Meet Our Team
              </motion.h2>
              <motion.p variants={fadeInUp} custom={1} className="mt-4 text-muted-foreground">
                The passionate people behind ShopNova.
              </motion.p>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM_MEMBERS.map((member, index) => (
                <motion.div
                  key={member.name}
                  variants={fadeInUp}
                  custom={index}
                  whileHover={{ y: -4 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full ring-4 ring-primary/10">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-primary">{member.role}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{member.bio}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative px-4 pb-24 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 text-center sm:p-12"
          >
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to experience the difference?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Join thousands of satisfied customers and discover why ShopNova is the
              preferred choice for online shopping.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto">
                Start Shopping
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Contact Us
              </Button>
            </div>
          </motion.div>
        </section>
      </div>
    </>
  );
}
