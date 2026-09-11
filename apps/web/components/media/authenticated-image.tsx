"use client";

import type { ImgHTMLAttributes } from "react";

import { useAuthenticatedMediaUrl } from "@/lib/media";

interface AuthenticatedImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
}

export function AuthenticatedImage({
  src,
  alt,
  ...props
}: AuthenticatedImageProps) {
  const url = useAuthenticatedMediaUrl(src);

  if (!url) {
    return null;
  }

  return <img src={url} alt={alt ?? ""} {...props} />;
}
