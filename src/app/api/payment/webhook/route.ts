import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/stripe";
import { queryCollection, getDocument, updateDocument, createDocument } from "@/lib/firestore";
import type { FirestoreDocument } from "@/lib/firestore";

interface PaymentDoc extends FirestoreDocument {
  orderId: string;
  stripePaymentId?: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  receiptUrl?: string;
  metadata?: Record<string, unknown>;
}

interface OrderDoc extends FirestoreDocument {
  orderNumber: string;
  userId: string;
  status: string;
  paymentStatus: string;
}

export async function POST(request: NextRequest) {
  try {
    // Stripe requires the raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    let event;
    try {
      event = await constructWebhookEvent(rawBody, signature);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // Handle the event
    const eventType = event.type;
    const eventData = event.data.object;

    switch (eventType) {
      case "payment_intent.succeeded": {
        const paymentIntent = eventData as unknown as Record<string, any>;
        await handlePaymentSuccess(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = eventData as unknown as Record<string, any>;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handling error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Record<string, any>) {
  const stripePaymentId = paymentIntent.id;
  const amount = paymentIntent.amount_received / 100;
  const metadata = paymentIntent.metadata || {};

  // Find payment record by stripe payment intent ID
  const payments = await queryCollection<PaymentDoc>(
    "payments",
    [
      { field: "stripePaymentId", operator: "==", value: stripePaymentId },
      { field: "deleted", operator: "==", value: false },
    ]
  );

  const existingPayment = payments[0];

  if (existingPayment) {
    // Update existing payment record
    await updateDocument<PaymentDoc>("payments", existingPayment.id, {
      status: "COMPLETED",
      receiptUrl: paymentIntent.receipt_url || null,
      metadata: paymentIntent as Record<string, unknown>,
    });

    // Update order payment status
    const order = await getDocument<OrderDoc>("orders", existingPayment.orderId);
    if (order) {
      await updateDocument<OrderDoc>("orders", existingPayment.orderId, {
        paymentStatus: "COMPLETED",
        status: "CONFIRMED",
      });

      // Create notification for user
      await createDocument("notifications", {
        userId: order.userId,
        type: "PAYMENT_RECEIVED",
        title: "Payment Received",
        message: `Payment of $${amount.toFixed(2)} for order ${order.orderNumber} has been received.`,
        link: `/dashboard/orders/${existingPayment.orderId}`,
        isRead: false,
      });
    }

    return;
  }

  // If no existing payment record, try to find by order ID in metadata
  const userId = metadata.userId;
  const orderNumber = metadata.orderNumber;

  if (userId && orderNumber) {
    // Look for a pending order with this order number
    const orders = await queryCollection<OrderDoc>(
      "orders",
      [
        { field: "orderNumber", operator: "==", value: orderNumber },
        { field: "deleted", operator: "==", value: false },
      ]
    );

    const pendingOrder = orders[0];
    if (pendingOrder) {
      // Find the associated payment
      const orderPayments = await queryCollection<PaymentDoc>(
        "payments",
        [
          { field: "orderId", operator: "==", value: pendingOrder.id },
          { field: "deleted", operator: "==", value: false },
        ]
      );

      const paymentToUpdate = orderPayments[0];
      if (paymentToUpdate) {
        await updateDocument<PaymentDoc>("payments", paymentToUpdate.id, {
          stripePaymentId,
          status: "COMPLETED",
          method: "STRIPE",
          receiptUrl: paymentIntent.receipt_url || null,
          metadata: paymentIntent as Record<string, unknown>,
        });
      }

      await updateDocument<OrderDoc>("orders", pendingOrder.id, {
        paymentStatus: "COMPLETED",
        status: "CONFIRMED",
      });

      await createDocument("notifications", {
        userId,
        type: "PAYMENT_RECEIVED",
        title: "Payment Received",
        message: `Payment of $${amount.toFixed(2)} for order ${orderNumber} has been received.`,
        link: `/dashboard/orders/${pendingOrder.id}`,
        isRead: false,
      });
    }
  }
}

async function handlePaymentFailed(paymentIntent: Record<string, any>) {
  const stripePaymentId = paymentIntent.id;
  const metadata = paymentIntent.metadata || {};

  // Find payment record by stripe payment intent ID
  const payments = await queryCollection<PaymentDoc>(
    "payments",
    [
      { field: "stripePaymentId", operator: "==", value: stripePaymentId },
      { field: "deleted", operator: "==", value: false },
    ]
  );

  const existingPayment = payments[0];

  if (existingPayment) {
    await updateDocument<PaymentDoc>("payments", existingPayment.id, {
      status: "FAILED",
      metadata: paymentIntent as Record<string, unknown>,
    });

    const order = await getDocument<OrderDoc>("orders", existingPayment.orderId);
    if (order) {
      await updateDocument<OrderDoc>("orders", existingPayment.orderId, {
        paymentStatus: "FAILED",
      });

      await createDocument("notifications", {
        userId: order.userId,
        type: "ORDER_CANCELLED",
        title: "Payment Failed",
        message: `Payment for order ${order.orderNumber} has failed. Please try again.`,
        link: "/checkout",
        isRead: false,
      });
    }
  } else if (metadata.userId) {
    await createDocument("notifications", {
      userId: metadata.userId,
      type: "ORDER_CANCELLED",
      title: "Payment Failed",
      message: "Your payment has failed. Please try again.",
      link: "/checkout",
      isRead: false,
    });
  }
}
