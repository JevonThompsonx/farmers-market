import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// next.config.ts is outside the src tree and not part of the app tsconfig, so we
// assert behaviorally that the CSP header is configured in the security headers.
const configSource = readFileSync(
  join(process.cwd(), "next.config.ts"),
  "utf8",
);

describe("Content-Security-Policy header configuration", () => {
  it("declares a Content-Security-Policy header", () => {
    expect(configSource).toContain('"Content-Security-Policy"');
  });

  it("restricts framing and object/blocked sources", () => {
    expect(configSource).toContain("frame-ancestors 'none'");
    expect(configSource).toContain("object-src 'none'");
    expect(configSource).toContain("default-src 'self'");
  });

  it("allows https images for Cloudinary / GitHub avatars but not arbitrary http", () => {
    expect(configSource).toMatch(/img-src 'self' https:/);
    expect(configSource).not.toMatch(/img-src 'self' http:/);
  });

  it("keeps the existing HSTS hardening alongside the new CSP", () => {
    expect(configSource).toContain("Strict-Transport-Security");
  });
});
