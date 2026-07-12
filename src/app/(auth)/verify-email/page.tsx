"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Mail,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

import { SEO } from "@/components/shared/seo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

type VerificationState = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<VerificationState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);

  const verifyEmail = useCallback(async () => {
    if (!token) {
      setState("error");
      setErrorMessage("No verification token found. Please check the link in your email.");
      return;
    }

    try {
      setState("loading");
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setState("error");
        setErrorMessage(data.error || "Verification failed. The link may have expired.");
        toast.error(data.error || "Verification failed");
        return;
      }

      setState("success");
      toast.success("Email verified!", "Your email has been verified successfully.");
    } catch (error) {
      setState("error");
      setErrorMessage("A network error occurred. Please try again.");
      toast.error("Connection error", "Please check your internet connection.");
    }
  }, [token]);

  useEffect(() => {
    verifyEmail();
  }, [verifyEmail]);

  async function handleRetry() {
    setIsRetrying(true);
    await verifyEmail();
    setIsRetrying(false);
  }

  return (
    <>
      <SEO
        title="Verify Email"
        description="Verify your email address to activate your ShopNova account and start shopping."
        path="/verify-email"
      />

      <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/5 to-transparent blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-blue-500/20 via-indigo-500/5 to-transparent blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-md"
        >
          <Card className="border-white/20 bg-background/60 backdrop-blur-xl dark:border-white/10 dark:bg-background/40">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">
                Email Verification
              </CardTitle>
              <CardDescription className="mt-2 text-sm text-muted-foreground">
                {state === "loading" && "Verifying your email address..."}
                {state === "success" && "Your email has been verified!"}
                {state === "error" && "Verification failed"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col items-center gap-6 py-4">
                {/* Loading State */}
                {state === "loading" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "linear",
                      }}
                    >
                      <Loader2 className="h-16 w-16 text-primary" />
                    </motion.div>
                    <p className="text-sm text-muted-foreground">
                      Please wait while we verify your email...
                    </p>
                  </motion.div>
                )}

                {/* Success State */}
                {state === "success" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: 0.1,
                      }}
                    >
                      <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </motion.div>
                    <div className="space-y-2 text-center">
                      <h3 className="text-lg font-semibold">Verified!</h3>
                      <p className="text-sm text-muted-foreground">
                        Your email has been successfully verified. You can now sign in to your account and start shopping.
                      </p>
                    </div>
                    <Button asChild className="mt-2 w-full gap-2" size="lg">
                      <Link href="/login">
                        <Mail className="h-4 w-4" />
                        Sign In Now
                      </Link>
                    </Button>
                  </motion.div>
                )}

                {/* Error State */}
                {state === "error" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: 0.1,
                      }}
                    >
                      <XCircle className="h-16 w-16 text-destructive" />
                    </motion.div>
                    <div className="space-y-2 text-center">
                      <h3 className="text-lg font-semibold">Verification failed</h3>
                      <p className="text-sm text-muted-foreground">{errorMessage}</p>
                    </div>
                    <div className="flex w-full flex-col gap-3 mt-2">
                      <Button
                        variant="outline"
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="gap-2"
                      >
                        {isRetrying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Try Again
                      </Button>
                      <Button asChild variant="ghost" className="gap-2">
                        <Link href="/login">
                          <ArrowLeft className="h-4 w-4" />
                          Back to Sign In
                        </Link>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>

            {(state === "success" || state === "error") && (
              <CardFooter className="justify-center pb-6">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="text-sm text-muted-foreground"
                >
                  Need help?{" "}
                  <Link
                    href="/contact"
                    className="font-medium text-primary underline-offset-4 hover:underline transition-colors"
                  >
                    Contact support
                  </Link>
                </motion.p>
              </CardFooter>
            )}
          </Card>
        </motion.div>
      </div>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
