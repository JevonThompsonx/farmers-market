import { test, expect } from "@playwright/test";

test.describe("Mobile QA smoke", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("home and search stay within viewport with touch-sized controls", async ({ page }) => {
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: /menu/i });
    await expect(menuButton).toBeVisible();
    const menuBox = await menuButton.boundingBox();
    expect(menuBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    await menuButton.click();
    await expect(page.locator("#main-navigation-menu a[href='/products']")).toBeVisible();

    const homeOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(homeOverflow).toBeLessThanOrEqual(1);

    await page.goto("/search");
    const searchInput = page.getByPlaceholder("Search for products...");
    const searchButton = page.getByRole("button", { name: "Search" });

    await expect(searchInput).toBeVisible();
    await expect(searchButton).toBeVisible();

    const inputBox = await searchInput.boundingBox();
    const buttonBox = await searchButton.boundingBox();
    expect(inputBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(buttonBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    const searchOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(searchOverflow).toBeLessThanOrEqual(1);
  });

  test("products filters remain usable on mobile", async ({ page }) => {
    await page.goto("/products");

    const vegetablesFilter = page.getByRole("link", {
      name: "Vegetables",
      exact: true,
    });
    await expect(vegetablesFilter).toBeVisible();

    const filterBox = await vegetablesFilter.boundingBox();
    expect(filterBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    const productsOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(productsOverflow).toBeLessThanOrEqual(1);
  });
});
