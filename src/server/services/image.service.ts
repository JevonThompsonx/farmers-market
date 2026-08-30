import "server-only";
import { after } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { logger } from "@/lib/logger";

cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"] ?? "",
  api_key: process.env["CLOUDINARY_API_KEY"] ?? "",
  api_secret: process.env["CLOUDINARY_API_SECRET"] ?? "",
});

const UNSPLASH_ACCESS_KEY = process.env["UNSPLASH_ACCESS_KEY"];

/** Placeholder written immediately so creation never blocks on image I/O. */
export const PLACEHOLDER_IMAGE = "/placeholder.svg";

interface UnsplashPhoto {
  urls: { regular: string };
  alt_description: string | null;
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
}

/**
 * Fetches an image from Unsplash by query, converts to WebP via sharp,
 * uploads to Cloudinary, and returns the CDN URL.
 */
export async function fetchAndStoreImage(query: string): Promise<string> {
  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error("UNSPLASH_ACCESS_KEY is not set");
  }

  // Fetch from Unsplash
  const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
  const response = await fetch(searchUrl, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
  });

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.status}`);
  }

  const data = (await response.json()) as UnsplashSearchResponse;
  const photo = data.results[0];

  if (!photo) {
    throw new Error(`No Unsplash results for query: ${query}`);
  }

  // Download image buffer
  const imageResponse = await fetch(photo.urls.regular);
  if (!imageResponse.ok) {
    throw new Error("Failed to download image from Unsplash");
  }
  const buffer = Buffer.from(await imageResponse.arrayBuffer());

  // Convert to WebP via sharp
  const sharp = (await import("sharp")).default;
  const webpBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();

  // Upload to Cloudinary
  const uploadResult = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "farmers-market",
          format: "webp",
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload failed"));
          } else {
            resolve(result as { secure_url: string });
          }
        },
      );
      uploadStream.end(webpBuffer);
    },
  );

  return uploadResult.secure_url;
}

/**
 * Hydrate an entity's image off the request path.
 *
 * The caller should write the record first with `PLACEHOLDER_IMAGE`, then
 * call this so the (slow, network-bound) Unsplash → sharp → Cloudinary
 * pipeline runs *after* the response is sent. If the pipeline fails the
 * placeholder is kept. `update` is responsible for persisting the URL and
 * revalidating any caches.
 *
 * Callers must run inside a request scope (Server Action / Route Handler);
 * outside one `after` throws and hydration is skipped (placeholder remains).
 */
export function hydrateImageAsync(
  query: string,
  update: (imageUrl: string) => Promise<void>,
): void {
  try {
    after(async () => {
      try {
        const imageUrl = await fetchAndStoreImage(query);
        await update(imageUrl);
      } catch (error) {
        logger.warn(
          { query, error },
          "Image hydration failed; keeping placeholder",
        );
      }
    });
  } catch {
    // `after` unavailable outside a request scope — leave the placeholder.
  }
}
