# 🛍️ ShopNova - Enterprise E-Commerce Platform

> A modern, production-ready full-stack e-commerce platform built with Next.js 15, TypeScript, Prisma, PostgreSQL, and Stripe.

[![CI/CD](https://github.com/yourusername/shopnova/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/shopnova/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-17-008CDD)](https://stripe.com/)

## ✨ Features

### 🛒 Customer Experience
- **Beautiful Landing Page** - Hero section, featured products, categories, testimonials, brands
- **Product Browsing** - Advanced search, filters, sorting, pagination
- **Product Details** - Image gallery, variants, reviews, related products
- **Shopping Cart** - Persistent cart with quantity controls, coupon support
- **Checkout** - Multi-step checkout with Stripe payment integration
- **User Dashboard** - Profile management, order history, wishlist, addresses
- **Order Tracking** - Real-time order status with timeline view

### 🔐 Authentication & Security
- JWT-based authentication with refresh token rotation
- OAuth 2.0 login (Google, Facebook)
- Email verification & password reset
- Role-based access control (Customer, Admin, Super Admin)
- Rate limiting, CSRF protection, XSS prevention
- Secure HTTP-only cookies

### 📊 Admin Dashboard
- **Analytics** - Revenue charts, sales reports, customer insights
- **Product Management** - Full CRUD with image upload, variants, SEO
- **Order Management** - Status updates, tracking, invoice generation
- **User Management** - Roles, bans, activity monitoring
- **Inventory Management** - Stock tracking, low stock alerts
- **Coupon Management** - Discount codes with usage limits
- **Category Management** - Hierarchical categories with ordering
- **Reports & Export** - CSV export for all data

### 🎨 UI/UX
- Responsive design (mobile-first)
- Dark/Light mode with system preference detection
- Glassmorphism design language
- Smooth animations (Framer Motion)
- Loading skeletons & empty states
- Toast notifications
- Keyboard navigation & ARIA labels
- PWA support (offline mode, installable)

### ⚡ Performance
- Lighthouse score >95 across all categories
- Server Components & Client Components optimization
- Image optimization with Cloudinary
- Dynamic imports & code splitting
- ISR (Incremental Static Regeneration)
- Database query optimization with Prisma

## 🏗️ Tech Stack

| Category          | Technology                                   |
| ----------------- | -------------------------------------------- |
| **Frontend**      | Next.js 15, React 19, TypeScript, TailwindCSS |
| **State**         | Zustand, TanStack Query                      |
| **UI**            | Shadcn/UI, Radix UI, Framer Motion, Lucide   |
| **Forms**         | React Hook Form, Zod                         |
| **Backend**       | Next.js API Routes / Server Actions          |
| **Database**      | PostgreSQL, Prisma ORM                       |
| **Auth**          | JWT, OAuth 2.0 (Google, Facebook)            |
| **Payments**      | Stripe                                       |
| **Storage**       | Cloudinary                                   |
| **Email**         | Resend / Nodemailer                          |
| **Testing**       | Vitest, Playwright, Testing Library          |
| **CI/CD**         | GitHub Actions                               |
| **Container**     | Docker, Docker Compose                       |

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages & API
│   ├── (auth)/            # Authentication pages
│   ├── (shop)/            # Shop pages (products, cart, checkout)
│   ├── (user)/            # User dashboard pages
│   ├── (admin)/           # Admin dashboard pages
│   ├── api/               # API routes
│   └── ...                # Static pages
├── components/            # React components
│   ├── ui/                # Shadcn UI primitives
│   ├── layout/            # Layout components
│   ├── shared/            # Shared components
│   ├── auth/              # Auth components
│   ├── shop/              # Shop components
│   ├── dashboard/         # Dashboard components
│   └── admin/             # Admin components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions & configurations
├── store/                 # Zustand stores
├── types/                 # TypeScript type definitions
└── middleware.ts          # Next.js middleware
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ 
- PostgreSQL 16+
- Stripe account (for payments)
- Cloudinary account (for image storage)
- Resend account (for emails)

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shopnova.git
cd shopnova
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Copy the environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your credentials:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce"
JWT_SECRET="your-super-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud"
```

5. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

6. Seed the database:
```bash
npm run db:seed
```

7. Start the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Test Accounts (after seeding)

| Role    | Email                 | Password       |
| ------- | --------------------- | -------------- |
| Admin   | admin@shopnova.com    | Admin123!      |
| User    | john@example.com      | Customer123!   |
| User    | jane@example.com      | Customer123!   |

## 🧪 Testing

```bash
# Run unit tests
npm run test:run

# Run tests in watch mode
npm run test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t shopnova .
docker run -p 3000:3000 shopnova
```

## ☁️ Deployment

### Vercel (Frontend + API)
1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Railway / Render (Backend)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Configure environment variables

### Supabase (Database)
1. Create a new project in Supabase
2. Copy the connection string
3. Update `DATABASE_URL` in your deployment environment

## 📚 API Documentation

The API is available at `/api/*` endpoints. Key endpoints:

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh tokens
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/facebook` - Facebook OAuth login
- `GET/PATCH /api/auth/me` - Get/update profile

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/featured` - Featured products
- `GET /api/products/search` - Quick search
- `GET /api/products/[slug]` - Product details

### Cart & Wishlist
- `GET/POST/PATCH/DELETE /api/cart` - Cart management
- `GET/POST/DELETE /api/wishlist` - Wishlist management

### Orders
- `GET/POST /api/orders` - List/create orders
- `GET/PATCH /api/orders/[id]` - Order details/update

### Payments
- `POST /api/checkout` - Initialize checkout
- `POST /api/payment/stripe` - Create payment intent
- `POST /api/payment/webhook` - Stripe webhook

### Admin
- `GET /api/admin/analytics` - Dashboard analytics
- `GET/POST /api/admin/products` - Product management
- `GET/PATCH/DELETE /api/admin/products/[id]` - Product CRUD
- `GET /api/admin/orders` - Order management
- `GET/PATCH /api/admin/users` - User management
- `GET/POST /api/admin/categories` - Category management
- `GET/POST /api/admin/coupons` - Coupon management
- `GET /api/admin/inventory` - Inventory management
- `PATCH /api/admin/inventory/[id]` - Stock adjustment
- `GET /api/admin/reports` - Reports & CSV export

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Shadcn/UI](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/)
- [Stripe](https://stripe.com/)
- [Cloudinary](https://cloudinary.com/)
- [Vercel](https://vercel.com/)

---

Built with ❤️ by the ShopNova Team
