"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/product-form";

// ─── Mock Data ───────────────────────────────────────────────────────────────

function getMockProduct(id: string) {
  const products: Record<string, any> = {
    "1": {
      name: "Wireless Noise-Cancelling Headphones",
      slug: "wireless-headphones",
      description:
        "Experience premium sound quality with our flagship wireless headphones. Features active noise cancellation, 30-hour battery life, and ultra-comfortable ear cushions for all-day wear.",
      excerpt: "Premium wireless headphones with ANC and 30h battery",
      price: 349.99,
      compareAtPrice: 399.99,
      sku: "ELC-HDPH-0001",
      quantity: 145,
      categoryId: "1",
      brandId: "5",
      isActive: true,
      isFeatured: true,
      metaTitle: "Wireless Noise-Cancelling Headphones | ShopNova",
      metaDescription:
        "Premium wireless headphones with active noise cancellation, 30-hour battery life, and comfortable design.",
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80",
        "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=800&q=80",
      ],
      variants: [
        { id: "v1", name: "Black", sku: "ELC-HDPH-0001-BLK", price: 349.99, quantity: 60 },
        { id: "v2", name: "White", sku: "ELC-HDPH-0001-WHT", price: 349.99, quantity: 45 },
        { id: "v3", name: "Midnight Blue", sku: "ELC-HDPH-0001-BLU", price: 369.99, quantity: 40 },
      ],
    },
    "2": {
      name: "Minimalist Leather Watch",
      slug: "leather-watch",
      description:
        "A timeless timepiece crafted from genuine Italian leather. Features a minimalist dial, Japanese quartz movement, and sapphire crystal glass.",
      excerpt: "Elegant leather watch with Japanese movement",
      price: 249.99,
      compareAtPrice: null,
      sku: "FAS-WTCH-0002",
      quantity: 89,
      categoryId: "2",
      brandId: "1",
      isActive: true,
      isFeatured: false,
      metaTitle: "Minimalist Leather Watch | ShopNova",
      metaDescription: "Elegant leather watch with genuine Italian leather strap and Japanese quartz movement.",
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80",
      ],
      variants: [
        { id: "v1", name: "Brown Strap", sku: "FAS-WTCH-0002-BRN", price: 249.99, quantity: 50 },
        { id: "v2", name: "Black Strap", sku: "FAS-WTCH-0002-BLK", price: 259.99, quantity: 39 },
      ],
    },
  };

  return products[id] || products["1"];
}

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const productData = getMockProduct(id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground mt-1">
            Editing: {productData.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <ProductForm mode="edit" initialData={productData} />
    </motion.div>
  );
}
