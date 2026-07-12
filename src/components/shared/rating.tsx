"use client";

import { cn } from "@/lib/utils";
import { Star, StarHalf } from "lucide-react";

interface RatingProps {
  rating: number;
  size?: "sm" | "default" | "lg";
  showValue?: boolean;
  maxStars?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const sizeMap = {
  sm: "h-3 w-3",
  default: "h-4 w-4",
  lg: "h-5 w-5",
};

export function Rating({
  rating,
  size = "default",
  showValue = false,
  maxStars = 5,
  interactive = false,
  onChange,
  className,
}: RatingProps) {
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {stars.map((star) => {
        const filled = rating >= star;
        const halfFilled = !filled && rating >= star - 0.5;

        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(star)}
            className={cn(
              "transition-colors",
              interactive
                ? "cursor-pointer hover:scale-110"
                : "cursor-default",
              filled
                ? "text-yellow-400"
                : halfFilled
                  ? "text-yellow-400"
                  : "text-muted-foreground/30"
            )}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          >
            {filled ? (
              <Star className={cn("fill-current", sizeMap[size])} />
            ) : halfFilled ? (
              <StarHalf className={cn("fill-current", sizeMap[size])} />
            ) : (
              <Star className={sizeMap[size]} />
            )}
          </button>
        );
      })}
      {showValue && (
        <span className="ml-1.5 text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
