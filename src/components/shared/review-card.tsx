"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Rating } from "@/components/shared/rating";
import { formatDate } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
    createdAt: Date | string;
    user: {
      name: string | null;
      image: string | null;
    };
  };
  className?: string;
}

export function ReviewCard({ review, className }: ReviewCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={review.user.image || undefined}
              alt={review.user.name || "User"}
            />
            <AvatarFallback>
              {review.user.name ? getInitials(review.user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">
              {review.user.name || "Anonymous"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
        <Rating rating={review.rating} size="sm" />
      </div>
      {review.title && (
        <h4 className="mt-3 text-sm font-medium">{review.title}</h4>
      )}
      {review.comment && (
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          {review.comment}
        </p>
      )}
    </div>
  );
}
