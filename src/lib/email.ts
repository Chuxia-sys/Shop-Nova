import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.resend.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "resend",
    pass: process.env.RESEND_API_KEY,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.EMAIL_FROM || "noreply@shopnova.com",
}: SendEmailParams) {
  try {
    await transporter.sendMail({
      from: `ShopNova <${from}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export function renderWelcomeEmail(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #f6f6f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; padding: 30px 0; }
        .logo { font-size: 28px; font-weight: 800; color: #6C63FF; }
        .content { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        h1 { font-size: 24px; color: #1a1a2e; margin-bottom: 16px; }
        p { font-size: 16px; color: #64748b; line-height: 1.6; }
        .button { display: inline-block; padding: 14px 32px; background: #6C63FF; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 30px 0; color: #94a3b8; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">✨ ShopNova</div>
        </div>
        <div class="content">
          <h1>Welcome to ShopNova, ${name}! 🎉</h1>
          <p>We're thrilled to have you join our community of savvy shoppers. Get ready to discover amazing products curated just for you.</p>
          <p>Start exploring our collection and find your next favorite thing.</p>
          <center>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/products" class="button">Start Shopping</a>
          </center>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ShopNova. All rights reserved.</p>
          <p>123 Commerce Street, San Francisco, CA 94102</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function renderVerifyEmailEmail(token: string): string {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #f6f6f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; padding: 30px 0; }
        .logo { font-size: 28px; font-weight: 800; color: #6C63FF; }
        .content { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        h1 { font-size: 24px; color: #1a1a2e; margin-bottom: 16px; }
        p { font-size: 16px; color: #64748b; line-height: 1.6; }
        .button { display: inline-block; padding: 14px 32px; background: #6C63FF; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 30px 0; color: #94a3b8; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">✨ ShopNova</div>
        </div>
        <div class="content">
          <h1>Verify Your Email Address</h1>
          <p>Thanks for signing up! Please verify your email address by clicking the button below.</p>
          <center>
            <a href="${verifyUrl}" class="button">Verify Email</a>
          </center>
          <p style="margin-top: 20px; font-size: 14px;">Or copy this link: <br/>${verifyUrl}</p>
          <p style="font-size: 14px; color: #94a3b8;">This link expires in 24 hours.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ShopNova. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function renderResetPasswordEmail(token: string): string {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #f6f6f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; padding: 30px 0; }
        .logo { font-size: 28px; font-weight: 800; color: #6C63FF; }
        .content { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        h1 { font-size: 24px; color: #1a1a2e; margin-bottom: 16px; }
        p { font-size: 16px; color: #64748b; line-height: 1.6; }
        .button { display: inline-block; padding: 14px 32px; background: #6C63FF; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 30px 0; color: #94a3b8; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">✨ ShopNova</div>
        </div>
        <div class="content">
          <h1>Reset Your Password</h1>
          <p>We received a request to reset your password. Click the button below to choose a new one.</p>
          <center>
            <a href="${resetUrl}" class="button">Reset Password</a>
          </center>
          <p style="margin-top: 20px; font-size: 14px;">Or copy this link: <br/>${resetUrl}</p>
          <p style="font-size: 14px; color: #94a3b8;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ShopNova. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function renderOrderConfirmationEmail(
  name: string,
  orderNumber: string,
  items: { name: string; quantity: number; price: number }[],
  total: number
): string {
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">${item.name}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #f6f6f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; padding: 30px 0; }
        .logo { font-size: 28px; font-weight: 800; color: #6C63FF; }
        .content { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        h1 { font-size: 24px; color: #1a1a2e; margin-bottom: 16px; }
        p { font-size: 16px; color: #64748b; line-height: 1.6; }
        .order-number { font-size: 20px; font-weight: 700; color: #6C63FF; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { padding: 12px 0; border-bottom: 2px solid #e2e8f0; text-align: left; font-weight: 600; color: #1a1a2e; }
        .total-row td { padding: 12px 0; font-weight: 700; color: #1a1a2e; }
        .button { display: inline-block; padding: 14px 32px; background: #6C63FF; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 30px 0; color: #94a3b8; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">✨ ShopNova</div>
        </div>
        <div class="content">
          <h1>Order Confirmed! 🎉</h1>
          <p>Thank you, ${name}! Your order has been placed successfully.</p>
          <p class="order-number">Order #${orderNumber}</p>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="2">Total</td>
                <td style="text-align: right;">$${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <center>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders" class="button">View Order</a>
          </center>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ShopNova. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function renderShippingUpdateEmail(
  name: string,
  orderNumber: string,
  status: string,
  trackingNumber?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #f6f6f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; padding: 30px 0; }
        .logo { font-size: 28px; font-weight: 800; color: #6C63FF; }
        .content { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        h1 { font-size: 24px; color: #1a1a2e; margin-bottom: 16px; }
        p { font-size: 16px; color: #64748b; line-height: 1.6; }
        .status-badge { display: inline-block; padding: 8px 20px; background: #6C63FF; color: white; border-radius: 20px; font-weight: 600; margin: 10px 0; }
        .button { display: inline-block; padding: 14px 32px; background: #6C63FF; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 30px 0; color: #94a3b8; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">✨ ShopNova</div>
        </div>
        <div class="content">
          <h1>Order Update 🚚</h1>
          <p>Hi ${name},</p>
          <p>Your order <strong>#${orderNumber}</strong> has been updated to:</p>
          <center><span class="status-badge">${status}</span></center>
          ${trackingNumber ? `<p>Tracking Number: <strong>${trackingNumber}</strong></p>` : ""}
          <center>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders" class="button">Track Order</a>
          </center>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ShopNova. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
