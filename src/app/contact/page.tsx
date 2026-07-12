"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  MapPin,
  Phone,
  Clock,
  Send,
  Loader2,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { SEO } from "@/components/shared/seo";
import { GlassCard } from "@/components/shared/glass-card";
import { toast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const CONTACT_INFO = [
  {
    icon: Mail,
    label: "Email Us",
    value: "support@shopnova.com",
    description: "We respond within 24 hours",
    href: "mailto:support@shopnova.com",
  },
  {
    icon: Phone,
    label: "Call Us",
    value: "+1 (555) 123-4567",
    description: "Mon-Fri 9AM-6PM EST",
    href: "tel:+15551234567",
  },
  {
    icon: MapPin,
    label: "Visit Us",
    value: "123 Commerce Street",
    description: "New York, NY 10001, USA",
    href: "#",
  },
  {
    icon: Clock,
    label: "Business Hours",
    value: "Mon - Fri: 9:00 AM - 6:00 PM",
    description: "Sat: 10:00 AM - 4:00 PM",
    href: "#",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: ContactFormValues) {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsSubmitted(true);
      toast.success("Message sent!", "We'll get back to you within 24 hours.");
    } catch {
      toast.error("Failed to send", "Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <SEO
        title="Contact Us"
        description="Get in touch with ShopNova. We're here to help with any questions, concerns, or feedback."
        path="/contact"
      />

      <div className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-transparent blur-3xl" />
        </div>

        {/* Hero */}
        <section className="relative px-4 pb-12 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm">
                Get in Touch
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              custom={1}
              className="text-4xl font-bold tracking-tight sm:text-5xl"
            >
              We&apos;d love to hear from you
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              custom={2}
              className="mx-auto mt-4 max-w-xl text-muted-foreground"
            >
              Have a question, feedback, or just want to say hi? Our team is here to help.
            </motion.p>
          </motion.div>
        </section>

        {/* Contact content */}
        <section className="relative px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-5">
              {/* Contact form */}
              <div className="lg:col-span-3">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <GlassCard className="p-6 sm:p-8">
                    {isSubmitted ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold">Message Sent!</h3>
                        <p className="mt-2 max-w-sm text-muted-foreground">
                          Thank you for reaching out! We&apos;ve received your message and will
                          respond within 24 hours.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-6"
                          onClick={() => {
                            setIsSubmitted(false);
                            form.reset();
                          }}
                        >
                          Send Another Message
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="mb-6 flex items-center gap-3">
                          <MessageSquare className="h-6 w-6 text-primary" />
                          <h2 className="text-xl font-semibold">Send us a message</h2>
                        </div>

                        <Form {...form}>
                          <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-5"
                          >
                            <div className="grid gap-5 sm:grid-cols-2">
                              <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Your name"
                                        disabled={isSubmitting}
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="email"
                                        placeholder="your@email.com"
                                        disabled={isSubmitting}
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="subject"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Subject</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="How can we help?"
                                      disabled={isSubmitting}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="message"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Message</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Tell us more about your inquiry..."
                                      disabled={isSubmitting}
                                      className="min-h-[150px] resize-y"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Button
                              type="submit"
                              size="lg"
                              disabled={isSubmitting}
                              className="w-full gap-2 sm:w-auto"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4" />
                                  Send Message
                                </>
                              )}
                            </Button>
                          </form>
                        </Form>
                      </>
                    )}
                  </GlassCard>
                </motion.div>
              </div>

              {/* Contact info & Map */}
              <div className="space-y-6 lg:col-span-2">
                {/* Contact info cards */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {CONTACT_INFO.map((info, index) => {
                    const Icon = info.icon;
                    return (
                      <motion.div
                        key={info.label}
                        variants={fadeInUp}
                        custom={index + 3}
                      >
                        <a href={info.href}>
                          <Card className="transition-all hover:border-primary/30 hover:shadow-md">
                            <CardContent className="flex items-center gap-4 p-4">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{info.label}</p>
                                <p className="text-sm text-muted-foreground">{info.value}</p>
                                <p className="text-xs text-muted-foreground">
                                  {info.description}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </a>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* Map placeholder */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card className="overflow-hidden">
                    <div className="aspect-[16/9] bg-gradient-to-br from-primary/5 to-primary/20">
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <MapPin className="mx-auto h-8 w-8 text-primary/50" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            123 Commerce Street, New York, NY
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
