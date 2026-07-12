"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  X,
  Home,
  ShoppingBag,
  LayoutGrid,
  Heart,
  User,
  LogIn,
  Phone,
  Info,
  HelpCircle,
  FileText,
} from "lucide-react";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

const sidebarVariants = {
  open: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  closed: {
    x: "-100%",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
};

const overlayVariants = {
  open: { opacity: 1, transition: { duration: 0.2 } },
  closed: { opacity: 0, transition: { duration: 0.2 } },
};

const itemVariants = {
  open: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.2 },
  }),
  closed: { opacity: 0, x: -20 },
};

const navIconMap: Record<string, typeof Home> = {
  Home,
  Shop: ShoppingBag,
  Categories: LayoutGrid,
  About: Info,
  Contact: Phone,
};

export function MobileNav() {
  const pathname = usePathname();
  const { isMobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { user, isAuthenticated } = useAuthStore();
  const wishlistCount = useWishlistStore((s) => s.getCount());

  // Close on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <motion.nav
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="absolute left-0 top-0 flex h-full w-72 flex-col bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <Link
                href="/"
                className="text-lg font-bold tracking-tight"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  {SITE_NAME}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Nav links */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <ul className="space-y-1">
                {NAV_LINKS.map((link, i) => {
                  const Icon = navIconMap[link.label] || Home;
                  const isActive = pathname === link.href;
                  return (
                    <motion.li
                      key={link.href}
                      variants={itemVariants}
                      initial="closed"
                      animate="open"
                      custom={i}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>

              <Separator className="my-4" />

              {/* Wishlist */}
              <motion.div
                variants={itemVariants}
                initial="closed"
                animate="open"
                custom={6}
              >
                <Link
                  href="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <div className="relative">
                    <Heart className="h-5 w-5" />
                    {wishlistCount > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {wishlistCount}
                      </span>
                    )}
                  </div>
                  Wishlist
                </Link>
              </motion.div>

              {/* Auth section */}
              <Separator className="my-4" />
              <div className="space-y-2 px-1">
                {isAuthenticated ? (
                  <motion.div
                    variants={itemVariants}
                    initial="closed"
                    animate="open"
                    custom={7}
                  >
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <User className="h-5 w-5" />
                      {user?.name || "My Account"}
                    </Link>
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      variants={itemVariants}
                      initial="closed"
                      animate="open"
                      custom={7}
                    >
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button variant="default" className="w-full justify-start gap-3">
                          <LogIn className="h-5 w-5" />
                          Sign In
                        </Button>
                      </Link>
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      initial="closed"
                      animate="open"
                      custom={8}
                    >
                      <Link
                        href="/signup"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button variant="outline" className="w-full justify-start gap-3">
                          Create Account
                        </Button>
                      </Link>
                    </motion.div>
                  </>
                )}
              </div>

              <Separator className="my-4" />

              {/* Extra links */}
              <motion.div
                variants={itemVariants}
                initial="closed"
                animate="open"
                custom={9}
              >
                <Link
                  href="/faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <HelpCircle className="h-5 w-5" />
                  FAQ
                </Link>
              </motion.div>
              <motion.div
                variants={itemVariants}
                initial="closed"
                animate="open"
                custom={10}
              >
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Phone className="h-5 w-5" />
                  Contact
                </Link>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  &copy; {new Date().getFullYear()} {SITE_NAME}
                </span>
                <ThemeToggle />
              </div>
            </div>
          </motion.nav>
        </div>
      )}
    </AnimatePresence>
  );
}
