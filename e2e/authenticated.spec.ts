import { test, expect } from "@playwright/test";

// Note: To run these tests with real Auth.jsv5, 
// you need to set a valid next-auth.session-token cookie.
// The value should be a signed JWT.

test.describe("Authenticated Actions", () => {
  test.beforeEach(async ({ context }) => {
    // MOCK SESSION COOKIE
    // In a real environment, you'd generate this using NEXTAUTH_SECRET
    await context.addCookies([
      {
        name: "next-auth.session-token",
        value: "mock-session-token", // PLACEHOLDER
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);
  });

  test("create a new farm", async ({ page }) => {
    await page.goto("/farms/new");
    await expect(page.locator("h1")).toContainText("Add Farm");

    await page.getByLabel("Farm Name").fill("Test E2E Farm");
    await page.getByLabel("City").fill("Test City");
    await page.getByLabel("State").fill("TS");
    await page.getByLabel("Description").fill("This is a test farm created via Playwright.");
    
    // We can't easily upload images from here without additional setup, 
    // but the form might handle the image query or placeholder.
    // If there's an image input, we'd handle it here.

    await page.getByRole("button", { name: "Save" }).click();

    // Verify redirect to farm page
    await expect(page).toHaveURL(/\/farms\/[a-zA-Z0-9-]+/);
    await expect(page.locator("h1")).toContainText("Test E2E Farm");
  });

  test("create a new product", async ({ page }) => {
    // Ideally we navigate from a farm page, but we can go directly
    // Assuming we have a farm ID or can find one
    await page.goto("/farms");
    await page.locator("a[href^='/farms/']").first().click();
    
    const farmUrl = page.url();
    const farmId = farmUrl.split("/").pop();

    await page.goto(`/products/new?farmId=${farmId}`);
    await expect(page.locator("h1")).toContainText("Add Product");

    await page.getByLabel("Product Name").fill("Test E2E Product");
    await page.getByLabel("Price").fill("10.99");
    await page.getByLabel("Category").selectOption("vegetables");
    await page.getByLabel("Description").fill("Test product description.");

    await page.getByRole("button", { name: "Save" }).click();

    // Verify redirect
    await expect(page).toHaveURL(/\/products\/[a-zA-Z0-9-]+/);
    await expect(page.locator("h1")).toContainText("Test E2E Product");
  });

  test("submit a review", async ({ page }) => {
    await page.goto("/products");
    await page.locator("a[href^='/products/']").first().click();

    const reviewForm = page.locator("form").filter({ hasText: "Review" });
    await expect(reviewForm).toBeVisible();

    await page.getByLabel("3 stars").click(); // Using RatingInput labels
    await page.getByLabel("Your Review").fill("Testing review submission via E2E.");
    await page.getByRole("button", { name: "Submit Review" }).click();

    await expect(page.getByText("Testing review submission via E2E.")).toBeVisible();
  });

  test("edit own farm", async ({ page }) => {
    // Navigate to a farm that current user owns (the seed user owns all in dev)
    await page.goto("/farms");
    await page.locator("a[href^='/farms/']").first().click();

    await page.getByRole("link", { name: "Edit Farm" }).click();
    await page.getByLabel("Farm Name").fill("Updated Farm Name");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.locator("h1")).toContainText("Updated Farm Name");
  });

  test("delete own farm", async ({ page }) => {
    await page.goto("/farms");
    await page.locator("a[href^='/farms/']").first().click();

    // Listen for dialog if it's window.confirm, but the app uses themed confirmation?
    // The themed confirmation is usually an inline button or modal.
    const deleteButton = page.getByRole("button", { name: "Delete" });
    await deleteButton.click();

    // If there's a confirmation modal/button
    const confirmButton = page.getByRole("button", { name: "Confirm Delete" });
    if (await confirmButton.isVisible()) {
        await confirmButton.click();
    }

    await expect(page).toHaveURL("/farms");
  });
});
