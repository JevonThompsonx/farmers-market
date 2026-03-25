import "server-only";

export function normalizeImageUrl(imageUrl: string): string {
  let parsed: URL;

  try {
    parsed = new URL(imageUrl);
  } catch {
    return imageUrl;
  }

  if (parsed.hostname !== "placehold.co") {
    return imageUrl;
  }

  const segments = parsed.pathname.split("/").filter((segment) => segment.length > 0);
  const dimensions = segments[0];

  if (dimensions === undefined) {
    return "/placeholders/product-skeleton.svg";
  }

  return dimensions.startsWith("800x")
    ? "/placeholders/farm-skeleton.svg"
    : "/placeholders/product-skeleton.svg";
}
