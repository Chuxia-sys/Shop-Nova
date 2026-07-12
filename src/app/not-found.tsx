"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Search,
  ArrowLeft,
  ShoppingBag,
  HelpCircle,
  Mail,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SEO } from "@/components/shared/seo";

const QUICK_LINKS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Products", href: "/products", icon: ShoppingBag },
  { label: "FAQ", href: "/faq", icon: HelpCircle },
  { label: "Contact", href: "/contact", icon: Mail },
];

const FLOATING_SHAPES = [
  { size: 60, x: 10, y: 20, duration: 6, delay: 0 },
  { size: 40, x: 80, y: 30, duration: 8, delay: 1 },
  { size: 50, x: 20, y: 70, duration: 7, delay: 2 },
  { size: 35, x: 75, y: 65, duration: 9, delay: 0.5 },
  { size: 45, x: 50, y: 15, duration: 5, delay: 1.5 },
];

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <>
      <SEO
        title="Page Not Found"
        description="The page you're looking for doesn't exist or has been moved. Let's get you back on track."
      />

      <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4">
        {/* Animated background shapes */}
        {mounted && (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-3xl" />
            <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-blue-500/10 via-purple-500/5 to-transparent blur-3xl" />

            {FLOATING_SHAPES.map((shape, index) => (
              <motion.div
                key={index}
                className="absolute rounded-full border border-primary/10 bg-primary/5"
                style={{
                  width: shape.size,
                  height: shape.size,
                  left: `${shape.x}%`,
                  top: `${shape.y}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  rotate: [0, 180, 360],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: shape.duration,
                  delay: shape.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          {/* 404 Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="relative mx-auto flex h-48 w-48 items-center justify-center sm:h-56 sm:w-56">
              {/* Outer ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              {/* Middle ring */}
              <motion.div
                className="absolute inset-4 rounded-full border-2 border-primary/10"
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              />
              {/* Inner circle */}
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent backdrop-blur-sm">
                <span className="bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-6xl font-extrabold text-transparent sm:text-7xl">
                  404
                </span>
              </div>
              {/* Floating elements */}
              <motion.div
                className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-lg"
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-lg">🔍</span>
              </motion.div>
              <motion.div
                className="absolute -bottom-1 -left-1 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-lg"
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <span className="text-base">💡</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Oops! Page not found
            </h1>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist, has been moved, or is
              temporarily unavailable. Let&apos;s get you back on track.
            </p>
          </motion.div>

          {/* Search */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            onSubmit={handleSearch}
            className="mx-auto mt-8 max-w-md"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 pr-4 text-base"
              />
            </div>
          </motion.form>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              className="w-full gap-2 sm:w-auto"
              onClick={() => router.push("/")}
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full gap-2 sm:w-auto"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-12"
          >
            <Separator className="mb-6" />
            <p className="mb-4 text-sm text-muted-foreground">
              Or visit one of these pages:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
