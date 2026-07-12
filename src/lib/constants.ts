export const SITE_NAME = "ShopNova";
export const SITE_DESCRIPTION =
  "Discover premium products curated for your lifestyle. Shop the latest trends in fashion, electronics, home decor, and more.";
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "USD";
export const SHIPPING_FEE = parseFloat(
  process.env.NEXT_PUBLIC_SHIPPING_FEE || "9.99"
);
export const FREE_SHIPPING_THRESHOLD = parseFloat(
  process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || "100"
);

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  PRODUCT_PAGE_SIZE: 12,
  ORDER_PAGE_SIZE: 10,
  REVIEW_PAGE_SIZE: 5,
  ADMIN_PAGE_SIZE: 20,
};

export const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Best Rating", value: "rating" },
  { label: "Most Popular", value: "popular" },
] as const;

export const RATING_OPTIONS = [
  { label: "5 Stars", value: 5 },
  { label: "4 Stars & Up", value: 4 },
  { label: "3 Stars & Up", value: 3 },
  { label: "2 Stars & Up", value: 2 },
  { label: "1 Star & Up", value: 1 },
] as const;

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  PROCESSING: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
  SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  REFUNDED: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  REFUNDED: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  PARTIALLY_REFUNDED: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
};

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const FOOTER_LINKS = {
  shop: {
    title: "Shop",
    links: [
      { label: "All Products", href: "/products" },
      { label: "New Arrivals", href: "/products?sort=newest" },
      { label: "Best Sellers", href: "/products?sort=popular" },
      { label: "Sale", href: "/products?discount=true" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "FAQ", href: "/faq" },
      { label: "Shipping Info", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "Size Guide", href: "/size-guide" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Blog", href: "/blog" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
};

export const FEATURED_CATEGORIES = [
  {
    name: "Electronics",
    slug: "electronics",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80",
    description: "Cutting-edge gadgets and devices",
  },
  {
    name: "Fashion",
    slug: "fashion",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80",
    description: "Trendy apparel and accessories",
  },
  {
    name: "Home & Living",
    slug: "home-living",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    description: "Beautiful home essentials",
  },
  {
    name: "Beauty",
    slug: "beauty",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80",
    description: "Premium beauty products",
  },
] as const;

export const BRANDS = [
  { name: "Nike", slug: "nike", logo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80" },
  { name: "Apple", slug: "apple", logo: "https://images.unsplash.com/photo-1611186871348-b1f696febbb3?w=200&q=80" },
  { name: "Samsung", slug: "samsung", logo: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=200&q=80" },
  { name: "Adidas", slug: "adidas", logo: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=200&q=80" },
  { name: "Sony", slug: "sony", logo: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=200&q=80" },
  { name: "Dyson", slug: "dyson", logo: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80" },
] as const;

export const TESTIMONIALS = [
  {
    name: "Sarah Johnson",
    role: "Verified Buyer",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    content: "Absolutely love my purchase! The quality exceeded my expectations and shipping was incredibly fast. Will definitely be shopping here again.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Verified Buyer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    content: "Best online shopping experience I've had. The customer service team went above and beyond to help me with my order.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Verified Buyer",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    content: "The product selection is amazing and the prices are unbeatable. I've recommended this store to all my friends and family!",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Verified Buyer",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    content: "Great quality products with fast delivery. The tracking system kept me updated every step of the way. Highly recommended!",
    rating: 4,
  },
] as const;

export const FAQ_DATA = [
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and ShopPay. All payments are processed securely through Stripe.",
  },
  {
    question: "How long does shipping take?",
    answer: "Standard shipping takes 5-7 business days within the US. Express shipping (2-3 business days) is available for an additional fee. International shipping typically takes 7-14 business days depending on the destination.",
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy for most items. Products must be unused and in their original packaging. Refunds are processed within 5-7 business days after we receive the return.",
  },
  {
    question: "Do you offer free shipping?",
    answer: "Yes! We offer free standard shipping on all orders over $100. This applies to all domestic orders within the contiguous United States.",
  },
  {
    question: "How can I track my order?",
    answer: "Once your order is shipped, you'll receive a confirmation email with a tracking number. You can also track your order directly from your account dashboard under 'Orders'.",
  },
  {
    question: "Can I change or cancel my order?",
    answer: "You can cancel or modify your order within 1 hour of placing it. After that, the order enters processing and cannot be changed. Please contact our support team immediately if you need to make changes.",
  },
  {
    question: "Is my personal information secure?",
    answer: "Absolutely. We use industry-standard SSL encryption to protect your data. We never store your full credit card details, and all payment information is processed securely through Stripe.",
  },
  {
    question: "Do you ship internationally?",
    answer: "Yes, we ship to over 50 countries worldwide. International shipping rates and delivery times vary by destination. You can see the exact shipping cost at checkout.",
  },
];
