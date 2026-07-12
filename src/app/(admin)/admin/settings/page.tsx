"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Store,
  DollarSign,
  Truck,
  ShieldCheck,
  Mail,
  Palette,
  Sun,
  Moon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Store settings
  const [storeName, setStoreName] = useState("ShopNova");
  const [storeEmail, setStoreEmail] = useState("hello@shopnova.com");
  const [storePhone, setStorePhone] = useState("+1 (555) 123-4567");
  const [storeAddress, setStoreAddress] = useState("123 Commerce St, San Francisco, CA 94102");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("America/New_York");

  // Shipping settings
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(100);
  const [standardShipping, setStandardShipping] = useState(9.99);
  const [expressShipping, setExpressShipping] = useState(24.99);
  const [internationalShipping, setInternationalShipping] = useState(29.99);

  // Tax settings
  const [taxRate, setTaxRate] = useState(8.875);
  const [taxInclusive, setTaxInclusive] = useState(false);
  const [digitalProductsTaxable, setDigitalProductsTaxable] = useState(true);

  // Email settings
  const [orderConfirmation, setOrderConfirmation] = useState(true);
  const [shippingUpdate, setShippingUpdate] = useState(true);
  const [deliveryConfirmation, setDeliveryConfirmation] = useState(true);
  const [abandonedCart, setAbandonedCart] = useState(true);
  const [weeklyNewsletter, setWeeklyNewsletter] = useState(false);
  const [reviewRequest, setReviewRequest] = useState(true);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Settings saved successfully");
    }, 1000);
  };

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your store configuration
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Store className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2">
            <Truck className="h-4 w-4" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="tax" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Tax
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic store information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="store-name">Store Name</Label>
                  <Input
                    id="store-name"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="store-email">Store Email</Label>
                  <Input
                    id="store-email"
                    type="email"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="store-phone">Phone Number</Label>
                  <Input
                    id="store-phone"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                      <SelectItem value="AUD">AUD (A$)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Store Address</Label>
                  <Input
                    id="address"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping">
          <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
            <CardHeader>
              <CardTitle>Shipping Settings</CardTitle>
              <CardDescription>
                Configure shipping rates and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="free-threshold">
                    Free Shipping Threshold ($)
                  </Label>
                  <Input
                    id="free-threshold"
                    type="number"
                    min="0"
                    value={freeShippingThreshold}
                    onChange={(e) =>
                      setFreeShippingThreshold(parseFloat(e.target.value) || 0)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Orders above this amount get free shipping
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="standard-rate">
                    Standard Shipping Rate ($)
                  </Label>
                  <Input
                    id="standard-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={standardShipping}
                    onChange={(e) =>
                      setStandardShipping(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="express-rate">
                    Express Shipping Rate ($)
                  </Label>
                  <Input
                    id="express-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={expressShipping}
                    onChange={(e) =>
                      setExpressShipping(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="international-rate">
                    International Shipping Rate ($)
                  </Label>
                  <Input
                    id="international-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={internationalShipping}
                    onChange={(e) =>
                      setInternationalShipping(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Settings */}
        <TabsContent value="tax">
          <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>
                Configure tax rates and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    min="0"
                    step="0.001"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Applied to all taxable products
                  </p>
                </div>
                <div className="flex items-end pb-2">
                  <div className="flex items-center justify-between rounded-lg border p-3 w-full">
                    <div>
                      <Label className="text-sm font-medium">Tax Inclusive Pricing</Label>
                      <p className="text-xs text-muted-foreground">
                        Prices include tax by default
                      </p>
                    </div>
                    <Switch
                      checked={taxInclusive}
                      onCheckedChange={setTaxInclusive}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm font-medium">
                    Tax Digital Products
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Apply tax to digital/downloadable products
                  </p>
                </div>
                <Switch
                  checked={digitalProductsTaxable}
                  onCheckedChange={setDigitalProductsTaxable}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure which emails are sent to customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm font-medium">
                    Order Confirmation
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sent when an order is placed
                  </p>
                </div>
                <Switch
                  checked={orderConfirmation}
                  onCheckedChange={setOrderConfirmation}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm font-medium">
                    Shipping Update
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sent when order is shipped
                  </p>
                </div>
                <Switch
                  checked={shippingUpdate}
                  onCheckedChange={setShippingUpdate}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm font-medium">
                    Delivery Confirmation
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sent when order is delivered
                  </p>
                </div>
                <Switch
                  checked={deliveryConfirmation}
                  onCheckedChange={setDeliveryConfirmation}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm font-medium">
                    Abandoned Cart Reminder
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sent to customers who left items in cart
                  </p>
                </div>
                <Switch
                  checked={abandonedCart}
                  onCheckedChange={setAbandonedCart}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm font-medium">
                    Weekly Newsletter
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Weekly promotional newsletter
                  </p>
                </div>
                <Switch
                  checked={weeklyNewsletter}
                  onCheckedChange={setWeeklyNewsletter}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm font-medium">
                    Review Request
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sent after delivery to request a review
                  </p>
                </div>
                <Switch
                  checked={reviewRequest}
                  onCheckedChange={setReviewRequest}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of your admin panel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? (
                    <Moon className="h-6 w-6 text-primary" />
                  ) : (
                    <Sun className="h-6 w-6 text-primary" />
                  )}
                  <div>
                    <Label className="text-base font-medium">Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose between light and dark mode
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                    className="gap-2"
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                    className="gap-2"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("system")}
                  >
                    System
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-dashed p-8 text-center">
                <Palette className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">
                  More appearance options coming soon
                </p>
                <p className="text-xs text-muted-foreground">
                  Customize colors, fonts, and layout in a future update
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
