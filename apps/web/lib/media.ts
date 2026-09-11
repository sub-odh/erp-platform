"use client";

import { useEffect, useState } from "react";

import { apiRequestBlob } from "@/lib/api";

const UPLOADS_PREFIX = "/uploads/";

export function toMediaApiPath(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const relative = value.replace(/^https?:\/\/[^/]+/i, "");

  if (!relative.startsWith(UPLOADS_PREFIX)) {
    return null;
  }

  const stored = relative.slice(UPLOADS_PREFIX.length);

  if (!stored || stored.includes("..")) {
    return null;
  }

  return `/media/${stored}`;
}

export function useAuthenticatedMediaUrl(
  value: string | null | undefined,
): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (
      value &&
      (value.startsWith("data:") || value.startsWith("blob:"))
    ) {
      setUrl(value);
      return;
    }

    const path = toMediaApiPath(value);

    if (!path) {
      setUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    void apiRequestBlob(path)
      .then((blob) => {
        if (cancelled) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setUrl(null);
        }
      });

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [value]);

  return url;
}

export async function openAuthenticatedMedia(
  value: string | null | undefined,
): Promise<void> {
  const path = toMediaApiPath(value);

  if (!path) {
    return;
  }

  const blob = await apiRequestBlob(path);
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
}
