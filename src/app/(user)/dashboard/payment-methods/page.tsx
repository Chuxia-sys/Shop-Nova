"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/hooks/use-toast";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  cardholderName: string;
}

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "pm_1",
    brand: "Visa",
    last4: "4242",
    expMonth: 12,
    expYear: 2028,
    isDefault: true,
    cardholderName: "John Doe",
  },
  {
    id: "pm_2",
    brand: "Mastercard",
    last4: "5555",
    expMonth: 8,
    expYear: 2027,
    isDefault: false,
    cardholderName: "John Doe",
  },
];

const CARD_BRAND_COLORS: Record<string, string> = {
  Visa: "from-blue-600 to-blue-800",
  Mastercard: "from-orange-500 to-red-500",
  "American Express": "from-green-500 to-teal-600",
  Discover: "from-purple-500 to-pink-500",
};

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCard, setNewCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvc: "",
  });

  function handleAddCard() {
    if (!newCard.number || !newCard.name || !newCard.expiry || !newCard.cvc) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const last4 = newCard.number.slice(-4);
      const [month, year] = newCard.expiry.split("/");
      const newMethod: PaymentMethod = {
        id: `pm_${Date.now()}`,
        brand: "Visa",
        last4,
        expMonth: parseInt(month),
        expYear: parseInt("20" + year),
        isDefault: paymentMethods.length === 0,
        cardholderName: newCard.name,
      };
      setPaymentMethods((prev) => [...prev, newMethod]);
      setNewCard({ number: "", name: "", expiry: "", cvc: "" });
      setIsDialogOpen(false);
      setIsSubmitting(false);
      toast.success("Card added", "Your payment method has been added.");
    }, 1500);
  }

  function removeCard(id: string) {
    setPaymentMethods((prev) => {
      const updated = prev.filter((pm) => pm.id !== id);
      // If we removed the default, set the first remaining as default
      if (prev.find((pm) => pm.id === id)?.isDefault && updated.length > 0) {
        updated[0].isDefault = true;
      }
      return updated;
    });
    toast.success("Card removed", "The payment method has been removed.");
  }

  function setDefaultCard(id: string) {
    setPaymentMethods((prev) =>
      prev.map((pm) => ({
        ...pm,
        isDefault: pm.id === id,
      }))
    );
    toast.success("Default payment method updated");
  }

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) {
      return digits.slice(0, 2) + "/" + digits.slice(2);
    }
    return digits;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Payment Methods" },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Methods</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your saved payment methods.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>
                Your card information is encrypted and stored securely.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Card Number</label>
                <Input
                  placeholder="4242 4242 4242 4242"
                  value={formatCardNumber(newCard.number)}
                  onChange={(e) =>
                    setNewCard((prev) => ({
                      ...prev,
                      number: e.target.value.replace(/\s/g, ""),
                    }))
                  }
                  maxLength={19}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cardholder Name</label>
                <Input
                  placeholder="John Doe"
                  value={newCard.name}
                  onChange={(e) =>
                    setNewCard((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expiry Date</label>
                  <Input
                    placeholder="MM/YY"
                    value={formatExpiry(newCard.expiry)}
                    onChange={(e) =>
                      setNewCard((prev) => ({
                        ...prev,
                        expiry: e.target.value.replace("/", ""),
                      }))
                    }
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CVC</label>
                  <Input
                    placeholder="123"
                    value={newCard.cvc}
                    onChange={(e) =>
                      setNewCard((prev) => ({
                        ...prev,
                        cvc: e.target.value.replace(/\D/g, "").slice(0, 4),
                      }))
                    }
                    maxLength={4}
                    type="password"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddCard} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Card"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment methods list */}
      {paymentMethods.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {paymentMethods.map((method, index) => (
              <motion.div
                key={method.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    "relative overflow-hidden transition-all hover:shadow-md",
                    method.isDefault && "ring-1 ring-primary/30"
                  )}
                >
                  {/* Card gradient header */}
                  <div
                    className={cn(
                      "bg-gradient-to-r p-5 text-white",
                      CARD_BRAND_COLORS[method.brand] ?? "from-gray-600 to-gray-800"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider opacity-80">
                          {method.brand}
                        </p>
                        <p className="mt-2 text-lg tracking-wider">
                          •••• {method.last4}
                        </p>
                      </div>
                      <CreditCard className="h-8 w-8 opacity-80" />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <p className="opacity-80">{method.cardholderName}</p>
                      <p className="opacity-80">
                        {method.expMonth.toString().padStart(2, "0")}/{method.expYear.toString().slice(-2)}
                      </p>
                    </div>
                  </div>

                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      {method.isDefault ? (
                        <Badge variant="default" className="h-6 gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          Default
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground"
                          onClick={() => setDefaultCard(method.id)}
                        >
                          Set as default
                        </Button>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Card?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove this{" "}
                            {method.brand} ending in {method.last4}?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeCard(method.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              icon={CreditCard}
              title="No payment methods"
              description="Add a payment method for faster checkout."
              action={{ label: "Add Card", onClick: () => setIsDialogOpen(true) }}
            />
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
