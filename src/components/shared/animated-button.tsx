"use client";

import { forwardRef, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

interface AnimatedButtonProps extends ButtonProps {
  ripple?: boolean;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, children, ripple = true, onClick, ...props }, ref) => {
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (ripple) {
          const button = buttonRef.current;
          if (button) {
            const rect = button.getBoundingClientRect();
            const rippleEl = document.createElement("span");
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            rippleEl.style.width = rippleEl.style.height = `${size}px`;
            rippleEl.style.left = `${x}px`;
            rippleEl.style.top = `${y}px`;
            rippleEl.className =
              "absolute rounded-full bg-white/30 animate-ripple pointer-events-none";

            button.appendChild(rippleEl);
            setTimeout(() => rippleEl.remove(), 600);
          }
        }
        onClick?.(e);
      },
      [ripple, onClick]
    );

    return (
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="inline-block"
      >
        <Button
          ref={(node) => {
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
            buttonRef.current = node;
          }}
          className={cn("relative overflow-hidden", className)}
          onClick={handleClick}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";
