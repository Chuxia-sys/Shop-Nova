export type UserRole = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";
export type PaymentStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";
export type PaymentMethod = "STRIPE" | "CREDIT_CARD" | "DEBIT_CARD" | "PAYPAL";
export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type NotificationType =
  | "ORDER_CONFIRMED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "PAYMENT_RECEIVED"
  | "REFUND_PROCESSED"
  | "WELCOME"
  | "PROMOTION"
  | "ADMIN_ALERT";

export type SafeUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  emailVerified: boolean;
  phone: string | null;
  createdAt: string;
};

export type ProductWithRelations = {
  id: string;
  name: string;
  slug: string;
  description: string;
  excerpt: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  quantity: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  brandId: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  brand: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  } | null;
  images: {
    id: string;
    url: string;
    altText: string | null;
    isPrimary: boolean;
  }[];
  variants: {
    id: string;
    name: string;
    sku: string | null;
    price: number | null;
    quantity: number;
    options: unknown;
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    userId: string;
    user: {
      name: string | null;
      image: string | null;
    };
    createdAt: string | Date;
  }[];
  averageRating?: number;
  reviewCount?: number;
  _count?: {
    reviews: number;
  };
};

export type OrderWithRelations = {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  notes: string | null;
  trackingNumber: string | null;
  shippingCarrier: string | null;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  address: {
    id: string;
    fullName: string;
    street: string;
    apartment: string | null;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  } | null;
  items: {
    id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    total: number;
    imageUrl: string | null;
    productId: string;
  }[];
  payment: {
    id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    receiptUrl: string | null;
    createdAt: string;
  } | null;
};

export type CartItemWithProduct = {
  id: string;
  userId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice: number | null;
    sku: string;
    quantity: number;
    images: {
      url: string;
      altText: string | null;
      isPrimary: boolean;
    }[];
    variants: {
      id: string;
      name: string;
      price: number | null;
      quantity: number;
    }[];
  };
};

export type DashboardStats = {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueChange: number;
  ordersChange: number;
  productsChange: number;
  customersChange: number;
  recentOrders: number;
  pendingOrders: number;
  lowStockProducts: number;
};

export type RevenueData = {
  date: string;
  revenue: number;
  orders: number;
};

export type SalesByCategory = {
  name: string;
  value: number;
  percentage: number;
};

export type TopProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  totalSold: number;
  totalRevenue: number;
  image: string | null;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type SearchFilters = {
  query?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: string;
  page?: number;
  limit?: number;
  inStock?: boolean;
  onSale?: boolean;
};
