"use client";

import { useEffect, useState } from "react";

import { AuthenticatedImage } from "@/components/media";

interface AvatarProps {
  firstName: string;
  lastName: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-24 w-24 text-2xl",
};

export function Avatar({
  firstName,
  lastName,
  src,
  size = "md",
  className = "",
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const initials = getInitials(firstName, lastName);

  const classes = [
    "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-semibold text-blue-700",
    sizeClasses[size],
    className,
  ].join(" ");

  if (src && !imageFailed) {
    return (
      <div className={classes}>
        <AuthenticatedImage
          src={src}
          alt={`${firstName} ${lastName}`}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={classes} aria-label={`${firstName} ${lastName}`}>
      {initials}
    </div>
  );
}

function getInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName.trim().charAt(0).toUpperCase();

  const lastInitial = lastName.trim().charAt(0).toUpperCase();

  const initials = `${firstInitial}${lastInitial}`;

  return initials || "?";
}
