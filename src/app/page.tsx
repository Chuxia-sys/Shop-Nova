"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Shield,
  Truck,
  HeadphonesIcon,
  CreditCard,
  Quote,
  ShoppingBag,
  Zap,
  ChevronRight,
  Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/shared/product-card";
import { CategoryCard } from "@/components/shared/category-card";
import { GlassCard } from "@/components/shared/glass-card";
import { AnimatedButton } from "@/components/shared/animated-button";
import { NewsletterForm } from "@/components/shared/newsletter-form";
import { Rating } from "@/components/shared/rating";
import { SITE_NAME, FEATURED_CATEGORIES, TESTIMONIALS, BRANDS } from "@/lib/constants";
import type { ProductWithRelations } from "@/types";

// ───────────────────────────────────────────────
// MOCK DATA
// ───────────────────────────────────────────────

const MOCK_FEATURED_PRODUCTS: ProductWithRelations[] = [
  {
    id: "mock-1",
    name: "Wireless Noise-Cancelling Headphones",
    slug: "wireless-noise-cancelling-headphones",
    description: "Premium wireless headphones with active noise cancellation and 30-hour battery life.",
    excerpt: "Premium wireless headphones with ANC",
    price: 299.99,
    compareAtPrice: 399.99,
    sku: "SN-AUDIO-001",
    quantity: 50,
    isActive: true,
    isFeatured: true,
    categoryId: "cat-1",
    brandId: "brand-1",
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-03-10"),
    category: { id: "cat-1", name: "Electronics", slug: "electronics" },
    brand: { id: "brand-1", name: "Sony", slug: "sony", logo: null },
    images: [
      { id: "img-1", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80", altText: "Wireless Headphones", isPrimary: true },
      { id: "img-2", url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80", altText: "Headphones side view", isPrimary: false },
    ],
    variants: [],
    reviews: [
      { id: "rev-1", rating: 5, comment: "Amazing sound quality!", userId: "u1", user: { name: "Alex", image: null }, createdAt: new Date() },
      { id: "rev-2", rating: 4, comment: "Great battery life", userId: "u2", user: { name: "Jordan", image: null }, createdAt: new Date() },
    ],
    _count: { reviews: 2 },
  },
  {
    id: "mock-2",
    name: "Premium Leather Sneakers",
    slug: "premium-leather-sneakers",
    description: "Handcrafted leather sneakers with memory foam insoles for all-day comfort.",
    excerpt: "Handcrafted leather sneakers",
    price: 189.99,
    compareAtPrice: 249.99,
    sku: "SN-SHOE-002",
    quantity: 120,
    isActive: true,
    isFeatured: true,
    categoryId: "cat-2",
    brandId: "brand-2",
    createdAt: new Date("2025-02-01"),
    updatedAt: new Date("2025-03-15"),
    category: { id: "cat-2", name: "Fashion", slug: "fashion" },
    brand: { id: "brand-2", name: "Nike", slug: "nike", logo: null },
    images: [
      { id: "img-3", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80", altText: "Red Sneakers", isPrimary: true },
      { id: "img-4", url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80", altText: "Sneakers angle view", isPrimary: false },
    ],
    variants: [],
    reviews: [
      { id: "rev-3", rating: 5, comment: "Most comfortable shoes ever!", userId: "u3", user: { name: "Taylor", image: null }, createdAt: new Date() },
      { id: "rev-4", rating: 4, comment: "Love the design", userId: "u4", user: { name: "Morgan", image: null }, createdAt: new Date() },
    ],
    _count: { reviews: 2 },
  },
  {
    id: "mock-3",
    name: "Smart Watch Pro",
    slug: "smart-watch-pro",
    description: "Advanced smartwatch with health monitoring, GPS, and 7-day battery life.",
    excerpt: "Advanced smartwatch with health monitoring",
    price: 449.99,
    compareAtPrice: null,
    sku: "SN-WEAR-003",
    quantity: 75,
    isActive: true,
    isFeatured: true,
    categoryId: "cat-1",
    brandId: "brand-3",
    createdAt: new Date("2025-02-15"),
    updatedAt: new Date("2025-03-20"),
    category: { id: "cat-1", name: "Electronics", slug: "electronics" },
    brand: { id: "brand-3", name: "Apple", slug: "apple", logo: null },
    images: [
      { id: "img-5", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80", altText: "Smart Watch", isPrimary: true },
      { id: "img-6", url: "https://images.unsplash.com/photo-1546868871-af0de0ae72d9?w=600&q=80", altText: "Watch on wrist", isPrimary: false },
    ],
    variants: [],
    reviews: [
      { id: "rev-5", rating: 5, comment: "Best smartwatch I've owned", userId: "u5", user: { name: "Casey", image: null }, createdAt: new Date() },
    ],
    _count: { reviews: 1 },
  },
  {
    id: "mock-4",
    name: "Minimalist Desk Lamp",
    slug: "minimalist-desk-lamp",
    description: "Elegant LED desk lamp with wireless charging base and adjustable color temperature.",
    excerpt: "Elegant LED desk lamp with wireless charging",
    price: 129.99,
    compareAtPrice: 159.99,
    sku: "SN-HOME-004",
    quantity: 200,
    isActive: true,
    isFeatured: true,
    categoryId: "cat-3",
    brandId: null,
    createdAt: new Date("2025-01-20"),
    updatedAt: new Date("2025-02-28"),
    category: { id: "cat-3", name: "Home & Living", slug: "home-living" },
    brand: null,
    images: [
      { id: "img-7", url: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600&q=80", altText: "Desk Lamp", isPrimary: true },
      { id: "img-8", url: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&q=80", altText: "Lamp in room", isPrimary: false },
    ],
    variants: [],
    reviews: [
      { id: "rev-6", rating: 4, comment: "Looks great on my desk", userId: "u6", user: { name: "Riley", image: null }, createdAt: new Date() },
      { id: "rev-7", rating: 5, comment: "Love the wireless charging", userId: "u7", user: { name: "Avery", image: null }, createdAt: new Date() },
    ],
    _count: { reviews: 2 },
  },
  {
    id: "mock-5",
    name: "Organic Skincare Set",
    slug: "organic-skincare-set",
    description: "Complete organic skincare routine with cleanser, serum, and moisturizer.",
    excerpt: "Complete organic skincare routine",
    price: 89.99,
    compareAtPrice: null,
    sku: "SN-BEAUTY-005",
    quantity: 150,
    isActive: true,
    isFeatured: true,
    categoryId: "cat-4",
    brandId: null,
    createdAt: new Date("2025-03-01"),
    updatedAt: new Date("2025-03-25"),
    category: { id: "cat-4", name: "Beauty", slug: "beauty" },
    brand: null,
    images: [
      { id: "img-9", url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80", altText: "Skincare Set", isPrimary: true },
      { id: "img-10", url: "https://images.unsplash.com/photo-1570194065650-d99fb4ee8e39?w=600&q=80", altText: "Skincare products", isPrimary: false },
    ],
    variants: [],
    reviews: [
      { id: "rev-8", rating: 5, comment: "My skin has never looked better!", userId: "u8", user: { name: "Quinn", image: null }, createdAt: new Date() },
      { id: "rev-9", rating: 4, comment: "Great natural ingredients", userId: "u9", user: { name: "Blake", image: null }, createdAt: new Date() },
    ],
    _count: { reviews: 2 },
  },
  {
    id: "mock-6",
    name: "Portable Bluetooth Speaker",
    slug: "portable-bluetooth-speaker",
    description: "Waterproof portable speaker with 360-degree sound and 20-hour battery.",
    excerpt: "Waterproof portable speaker",
    price: 79.99,
    compareAtPrice: 99.99,
    sku: "SN-AUDIO-006",
    quantity: 300,
    isActive: true,
    isFeatured: true,
    categoryId: "cat-1",
    brandId: "brand-5",
    createdAt: new Date("2025-02-10"),
    updatedAt: new Date("2025-03-18"),
    category: { id: "cat-1", name: "Electronics", slug: "electronics" },
    brand: { id: "brand-5", name: "Sony", slug: "sony", logo: null },
    images: [
      { id: "img-11", url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80", altText: "Bluetooth Speaker", isPrimary: true },
      { id: "img-12", url: "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=600&q=80", altText: "Speaker outdoor", isPrimary: false },
    ],
    variants: [],
    reviews: [
      { id: "rev-10", rating: 5, comment: "Incredible sound for its size!", userId: "u10", user: { name: "Drew", image: null }, createdAt: new Date() },
    ],
    _count: { reviews: 1 },
  },
  {
    id: "mock-7",
    name: "Cashmere Wool Scarf",
    slug: "cashmere-wool-scarf",
    description: "Luxuriously soft cashmere blend scarf, perfect for any season.",
    excerpt: "Luxuriously soft cashmere blend scarf",
    price: 69.99,
    compareAtPrice: 89.99,
    sku: "SN-FASHION-007",
    quantity: 80,
    isActive: true,
    isFeatured: true,
    categoryId: "cat-2",
    brandId: "brand-4",
    createdAt: new Date("2025-03-05"),
    updatedAt: new Date("2025-03-28"),
    category: { id: "cat-2", name: "Fashion", slug: "fashion" },
    brand: { id: "brand-4", name: "Adidas", slug: "adidas", logo: null },
    images: [
      { id: "img-13", url: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&q=80", altText: "Cashmere Scarf", isPrimary: true },
      { id: "img-14", url: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c8?w=600&q=80", altText: "Scarf styled", isPrimary: false },
    ],
    variants: [],
    reviews: [
      { id: "rev-11", rating: 5, comment: "So soft and warm!", userId: "u11", user: { name: "Sam", image: null }, createdAt: new Date() },
      { id: "rev-12", rating: 4, comment: "Beautiful color", userId: "u12", user: { name: "Jamie", image: null }, createdAt: new Date() },
    ],
    _count: { reviews: 2 },
  },
  {
    id: "mock-8",
    name: "Ceramic Pour-Over Coffee Set",
    slug: "ceramic-pour-over-coffee-set",
    description: "Handcrafted ceramic pour-over coffee maker with reusable filter and carafe.",
    excerpt: "Handcrafted ceramic pour-over coffee maker",
    price: 59.99,
    compareAtPrice: null,
    sku: "SN-HOME-008",
    quantity: 90,
    isActive: true,
    isFeatured: true,
    categoryId: "cat-3",
    brandId: null,
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-02-20"),
    category: { id: "cat-3", name: "Home & Living", slug: "home-living" },
    brand: null,
    images: [
      { id: "img-15", url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80", altText: "Coffee Set", isPrimary: true },
      { id: "img-16", url: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&q=80", altText: "Pour over coffee", isPrimary: false },
    ],
    variants: [],
    reviews: [
      { id: "rev-13", rating: 5, comment: "Makes the best coffee!", userId: "u13", user: { name: "Charlie", image: null }, createdAt: new Date() },
      { id: "rev-14", rating: 4, comment: "Beautiful craftsmanship", userId: "u14", user: { name: "Robin", image: null }, createdAt: new Date() },
    ],
    _count: { reviews: 2 },
  },
];

// ───────────────────────────────────────────────
// ANIMATION VARIANTS
// ───────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

// ───────────────────────────────────────────────
// REUSABLE SECTION WRAPPER
// ───────────────────────────────────────────────

function SectionWrapper({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id={id}
      ref={ref}
      className={`relative py-16 md:py-24 ${className}`}
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="container"
      >
        {children}
      </motion.div>
    </section>
  );
}

function SectionHeading({
  title,
  subtitle,
  align = "center",
}: {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <motion.div
      variants={fadeInUp}
      className={`mb-12 md:mb-16 ${align === "center" ? "text-center" : "text-left"}`}
    >
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base text-muted-foreground md:text-lg max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

// ───────────────────────────────────────────────
// HERO SECTION
// ───────────────────────────────────────────────

function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { once: true });

  const floatingProducts = [
    {
      src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
      alt: "Headphones",
      className: "top-10 right-[10%] w-28 h-28 md:w-36 md:h-36 rotate-6",
      delay: 0,
      duration: 6,
    },
    {
      src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
      alt: "Watch",
      className: "top-32 right-[2%] w-24 h-24 md:w-32 md:h-32 -rotate-3",
      delay: 1.5,
      duration: 7,
    },
    {
      src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
      alt: "Sneakers",
      className: "bottom-20 right-[12%] w-32 h-32 md:w-40 md:h-40 -rotate-12",
      delay: 3,
      duration: 8,
    },
    {
      src: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&q=80",
      alt: "Lamp",
      className: "bottom-40 right-[1%] w-20 h-20 md:w-28 md:h-28 rotate-12",
      delay: 2,
      duration: 5.5,
    },
  ];

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden pt-20 pb-16"
    >
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 rounded-full blur-2xl" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Floating product showcase — desktop only */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none -z-10">
        {floatingProducts.map((product, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5 + product.delay * 0.1, duration: 0.8, ease: "easeOut" }}
            className={`absolute ${product.className}`}
          >
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{
                duration: product.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: product.delay,
              }}
              className="relative w-full h-full"
            >
              <GlassCard className="p-2 shadow-2xl shadow-primary/20">
                <div className="relative aspect-square w-full h-full rounded-xl overflow-hidden">
                  <Image
                    src={product.src}
                    alt={product.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100px, 160px"
                  />
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto lg:mx-0 lg:max-w-2xl xl:max-w-3xl text-center lg:text-left">
          {/* Badge */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="mb-6 inline-flex items-center"
          >
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-xs font-medium rounded-full border-primary/30 bg-primary/5 text-primary gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>New Season Collection 2025</span>
            </Badge>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.1]"
          >
            <span className="text-foreground">Discover </span>
            <span className="gradient-text">Premium</span>
            <br />
            <span className="text-foreground">Products You'll </span>
            <span className="gradient-text">Love</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl lg:max-w-2xl leading-relaxed"
          >
            Curated collections of the finest products — from cutting-edge electronics
            to timeless fashion. Elevate your lifestyle with {SITE_NAME}.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
          >
            <AnimatedButton
              size="lg"
              className="rounded-full px-8 text-base font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40"
              asChild
            >
              <Link href="/products">
                <ShoppingBag className="h-5 w-5" />
                Shop Now
              </Link>
            </AnimatedButton>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 text-base font-semibold gap-2 border-muted-foreground/30"
              asChild
            >
              <Link href="/categories">
                Explore Categories
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="mt-12 flex flex-wrap items-center gap-6 sm:gap-8 text-sm text-muted-foreground justify-center lg:justify-start"
          >
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <span>Free shipping over $100</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Secure checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span>30-day returns</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-xs text-muted-foreground"
      >
        <span>Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border border-muted-foreground/30 flex items-start justify-center p-1"
        >
          <motion.div className="w-1 h-2 rounded-full bg-primary" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ───────────────────────────────────────────────
// STATS / BANNER SECTION
// ───────────────────────────────────────────────

const STATS = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders over $100",
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description: "Dedicated customer service",
  },
  {
    icon: Shield,
    title: "Money-Back Guarantee",
    description: "30-day no-questions-asked",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Encrypted & protected",
  },
];

function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-12 md:py-16">
      <div className="container">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          {STATS.map((stat, i) => (
            <motion.div key={i} variants={fadeInUp}>
              <GlassCard className="p-6 text-center h-full flex flex-col items-center justify-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">{stat.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {stat.description}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────
// FEATURED PRODUCTS SECTION
// ───────────────────────────────────────────────

function FeaturedProductsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-16 md:py-24">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <SectionHeading
            title="Featured Products"
            subtitle="Handpicked selections crafted for quality, style, and performance."
          />

          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {MOCK_FEATURED_PRODUCTS.map((product, i) => (
              <motion.div key={product.id} variants={scaleIn}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>

          {/* View all link */}
          <motion.div
            variants={fadeInUp}
            className="mt-12 text-center"
          >
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 gap-2"
              asChild
            >
              <Link href="/products">
                View All Products
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────
// CATEGORIES SECTION
// ───────────────────────────────────────────────

function CategoriesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-16 md:py-24 bg-muted/30">
      <div className="container">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <SectionHeading
            title="Shop by Category"
            subtitle="Find exactly what you need from our curated categories."
          />

          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {FEATURED_CATEGORIES.map((category, i) => (
              <motion.div key={category.slug} variants={scaleIn}>
                <CategoryCard category={category} />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────
// TESTIMONIALS SECTION
// ───────────────────────────────────────────────

function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = 340;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section ref={ref} className="relative py-16 md:py-24">
      <div className="container">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <SectionHeading
            title="What Our Customers Say"
            subtitle="Join thousands of happy customers who trust us for their shopping needs."
          />

          {/* Carousel controls */}
          <motion.div
            variants={fadeInUp}
            className="hidden md:flex items-center justify-end gap-3 mb-6"
          >
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10"
              onClick={() => scroll("left")}
              aria-label="Previous testimonials"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10"
              onClick={() => scroll("right")}
              aria-label="Next testimonials"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Scrollable carousel */}
          <motion.div
            variants={fadeInUp}
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
          >
            {TESTIMONIALS.map((testimonial, i) => (
              <div
                key={i}
                className="min-w-[300px] sm:min-w-[340px] flex-shrink-0 snap-start"
              >
                <GlassCard className="p-6 h-full flex flex-col">
                  {/* Quote icon */}
                  <Quote className="h-8 w-8 text-primary/30 mb-4 flex-shrink-0" />
                  {/* Content */}
                  <p className="text-sm leading-relaxed text-foreground/80 flex-1">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  {/* Rating */}
                  <div className="mt-4">
                    <Rating rating={testimonial.rating} size="sm" />
                  </div>
                  {/* Author */}
                  <div className="mt-4 flex items-center gap-3 pt-4 border-t border-border/50">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-primary/20">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────
// BRANDS SECTION
// ───────────────────────────────────────────────

function BrandsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-16 md:py-20 bg-muted/30">
      <div className="container">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.div
            variants={fadeInUp}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Trusted by the world&apos;s best brands
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16"
          >
            {BRANDS.map((brand, i) => (
              <motion.div
                key={brand.slug}
                variants={fadeInUp}
                className="group relative"
              >
                <div className="relative h-12 w-24 md:h-14 md:w-28 grayscale opacity-50 transition-all duration-500 hover:grayscale-0 hover:opacity-100">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    className="object-contain"
                    sizes="120px"
                  />
                </div>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  {brand.name}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────
// NEWSLETTER SECTION
// ───────────────────────────────────────────────

function NewsletterSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-20 md:py-28 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-purple-500/10" />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="container">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="max-w-2xl mx-auto text-center"
        >
          <motion.div variants={fadeInUp}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-xs font-medium rounded-full border-primary/30 bg-primary/5 text-primary gap-1.5 mb-6"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Stay Ahead</span>
            </Badge>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight"
          >
            Join the <span className="gradient-text">{SITE_NAME}</span> Community
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="mt-4 text-base md:text-lg text-muted-foreground max-w-md mx-auto"
          >
            Be the first to know about exclusive drops, limited editions, and
            members-only offers.
          </motion.p>

          <motion.div variants={fadeInUp} className="mt-8 max-w-md mx-auto">
            <NewsletterForm />
          </motion.div>

          <motion.p
            variants={fadeInUp}
            className="mt-4 text-xs text-muted-foreground"
          >
            No spam, ever. Unsubscribe anytime.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────
// PAGE
// ───────────────────────────────────────────────

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <HeroSection />
      <StatsSection />
      <FeaturedProductsSection />
      <CategoriesSection />
      <TestimonialsSection />
      <BrandsSection />
      <NewsletterSection />
    </main>
  );
}
