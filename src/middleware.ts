import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/",
  "/products",
  "/products/",
  "/categories",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/search",
];

const authPaths = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];

const apiPaths = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/google",
  "/api/auth/facebook",
  "/api/auth/refresh",
  "/api/products",
  "/api/categories",
  "/api/brands",
  "/api/payment/webhook",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Firebase sets "__session" cookie when auth state persists
  const sessionCookie = request.cookies.get("__session")?.value;
  const isAuthenticated = !!sessionCookie;

  // Allow public paths and static assets
  if (
    publicPaths.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // Allow API paths
  if (apiPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && authPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // We check admin role in the page/layout component
  }

  // Protected API routes
  const protectedApiPaths = [
    "/api/cart",
    "/api/wishlist",
    "/api/orders",
    "/api/checkout",
    "/api/notifications",
    "/api/admin",
  ];

  if (
    !isAuthenticated &&
    protectedApiPaths.some((path) => pathname.startsWith(path))
  ) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
