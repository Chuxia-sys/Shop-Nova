import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const robotsTxt = `
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /checkout/
Disallow: /cart/

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Crawl rules
Crawl-delay: 10
`.trim();

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
