"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
}

export function ImageWithFallback({
  fallbackSrc = "/placeholders/product-skeleton.svg",
  alt,
  className,
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-pulse bg-[var(--color-bg-subtle)]"
        />
      ) : null}
      <Image
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          error && "opacity-80",
          className,
        )}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        onLoad={() => setIsLoading(false)}
        {...props}
        src={error ? fallbackSrc : props.src}
      />
    </>
  );
}
