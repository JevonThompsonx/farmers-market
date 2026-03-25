import { test, expect } from "@playwright/test";

test.describe("Public Access", () => {
  test("browse home page and view a product", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Farm Fresh");

    // Click on the first product card
    const firstProduct = page.locator("a[href^='/products/']").first();
    const productName = await firstProduct.locator("h3").innerText();

    await firstProduct.click();

    // Verify product detail page
    await expect(page).toHaveURL(/\/products\/[a-zA-Z0-9-]+/);
    await expect(page.locator("h1")).toContainText(productName);
  });

  test("navigate and filter products", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator("h1")).toContainText("All Products");

    // Click on 'Vegetables' category filter
    await page.getByRole("link", { name: "Vegetables", exact: true }).click();

    // Verify URL updates
    await expect(page).toHaveURL(/\/products\?category=vegetables/);
    await expect(page.locator("h1")).toContainText("Vegetables");
  });

  test("search for products", async ({ page }) => {
    await page.goto("/search");
    const searchInput = page.getByPlaceholder("Search for products...");
    await searchInput.fill("Honey");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/\/search\?q=Honey/);
    await expect(page.locator("h2")).toContainText(/Honey/i);
  });
});
