"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
}

export function ImageWithFallback({
  fallbackSrc = "/placeholder.svg",
  alt,
  className,
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  return (
    <Image
      alt={alt}
      className={cn(error && "opacity-60", className)}
      onError={() => setError(true)}
      {...props}
      src={error ? fallbackSrc : props.src}
    />
  );
}
