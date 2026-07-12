"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Save,
  X,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import toast from "react-hot-toast";

// ─── Schema ──────────────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  excerpt: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  compareAtPrice: z.coerce.number().optional().nullable(),
  sku: z.string().min(1, "SKU is required"),
  quantity: z.coerce.number().int().nonnegative("Quantity must be non-negative"),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

// ─── Variant Type ────────────────────────────────────────────────────────────

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: number | null;
  quantity: number;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormValues & { images: string[]; variants: Variant[] }>;
  mode?: "create" | "edit";
}

// ─── Mock Select Data ────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "1", name: "Electronics" },
  { id: "2", name: "Fashion" },
  { id: "3", name: "Home & Living" },
  { id: "4", name: "Beauty" },
  { id: "5", name: "Sports" },
];

const BRANDS = [
  { id: "1", name: "Nike" },
  { id: "2", name: "Apple" },
  { id: "3", name: "Samsung" },
  { id: "4", name: "Adidas" },
  { id: "5", name: "Sony" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function ProductForm({ initialData, mode = "create" }: ProductFormProps) {
  const [images, setImages] = useState<string[]>(initialData?.images ?? []);
  const [variants, setVariants] = useState<Variant[]>(initialData?.variants ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = mode === "edit";

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
      description: initialData?.description ?? "",
      excerpt: initialData?.excerpt ?? "",
      price: initialData?.price ?? 0,
      compareAtPrice: initialData?.compareAtPrice ?? null,
      sku: initialData?.sku ?? "",
      quantity: initialData?.quantity ?? 0,
      categoryId: initialData?.categoryId ?? "",
      brandId: initialData?.brandId ?? "",
      isActive: initialData?.isActive ?? true,
      isFeatured: initialData?.isFeatured ?? false,
      metaTitle: initialData?.metaTitle ?? "",
      metaDescription: initialData?.metaDescription ?? "",
    },
  });

  const watchedName = form.watch("name");

  const generateSlug = () => {
    const name = form.getValues("name");
    if (name) {
      form.setValue("slug", slugify(name));
    }
  };

  const handleImageUpload = () => {
    // Simulate Cloudinary upload
    const mockUrl = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000)}?w=800&q=80`;
    setImages((prev) => [...prev, mockUrl]);
    toast.success("Image uploaded successfully");
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: `v-${Date.now()}`,
        name: "",
        sku: "",
        price: null,
        quantity: 0,
      },
    ]);
  };

  const updateVariant = (id: string, field: keyof Variant, value: string | number | null) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(
        isEdit ? "Product updated successfully!" : "Product created successfully!"
      );
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Information */}
            <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the core details of your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Wireless Headphones Pro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <div className="flex items-center justify-between">
                            <span>Slug</span>
                            <button
                              type="button"
                              onClick={generateSlug}
                              className="text-xs text-primary hover:underline"
                            >
                              Generate
                            </button>
                          </div>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="wireless-headphones-pro" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL-friendly version of the name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your product in detail..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt (Short Description)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief summary for listings..."
                          className="min-h-[60px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Pricing & Inventory */}
            <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
              <CardHeader>
                <CardTitle>Pricing & Inventory</CardTitle>
                <CardDescription>
                  Set pricing and stock information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" placeholder="99.99" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="compareAtPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compare at Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="129.99"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Original price for showing discounts
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="ELC-HDPH-0001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Variants */}
            <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Variants</CardTitle>
                  <CardDescription>
                    Add product variants (size, color, etc.)
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariant}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add Variant
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {variants.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No variants yet. Click "Add Variant" to create one.
                  </p>
                ) : (
                  variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
                    >
                      <div className="flex-1 min-w-[120px]">
                        <Label className="text-xs mb-1 block">Name</Label>
                        <Input
                          placeholder="Size M"
                          value={variant.name}
                          onChange={(e) =>
                            updateVariant(variant.id, "name", e.target.value)
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-[100px]">
                        <Label className="text-xs mb-1 block">SKU</Label>
                        <Input
                          placeholder="ELC-HDPH-M"
                          value={variant.sku}
                          onChange={(e) =>
                            updateVariant(variant.id, "sku", e.target.value)
                          }
                        />
                      </div>
                      <div className="w-[100px]">
                        <Label className="text-xs mb-1 block">Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="99.99"
                          value={variant.price ?? ""}
                          onChange={(e) =>
                            updateVariant(
                              variant.id,
                              "price",
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                        />
                      </div>
                      <div className="w-[80px]">
                        <Label className="text-xs mb-1 block">Qty</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="10"
                          value={variant.quantity}
                          onChange={(e) =>
                            updateVariant(
                              variant.id,
                              "quantity",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive"
                        onClick={() => removeVariant(variant.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* SEO */}
            <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
              <CardHeader>
                <CardTitle>SEO</CardTitle>
                <CardDescription>
                  Optimize your product for search engines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Wireless Headphones Pro | ShopNova"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Premium wireless headphones with active noise cancellation..."
                          className="min-h-[60px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel className="text-sm font-medium">Active</FormLabel>
                        <FormDescription className="text-xs">
                          Product is visible on the store
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel className="text-sm font-medium">Featured</FormLabel>
                        <FormDescription className="text-xs">
                          Show on homepage
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Organization */}
            <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
              <CardHeader>
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BRANDS.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Images */}
            <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
                  onClick={handleImageUpload}
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to upload</p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((url, i) => (
                      <div key={i} className="group relative overflow-hidden rounded-lg border">
                        <img
                          src={url}
                          alt={`Product image ${i + 1}`}
                          className="h-24 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 rounded bg-primary/80 px-1.5 py-0.5 text-[10px] text-white">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {isEdit ? "Updating..." : "Creating..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {isEdit ? "Update Product" : "Create Product"}
                </span>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
