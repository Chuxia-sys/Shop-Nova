import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load homepage successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ShopNova/);
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("should show featured products section", async ({ page }) => {
    await page.goto("/");
    const featuredSection = page.locator("text=Featured Products");
    await expect(featuredSection).toBeVisible();
  });

  test("should navigate to products page", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/products"]');
    await expect(page).toHaveURL(/\/products/);
  });

  test("should open cart sheet", async ({ page }) => {
    await page.goto("/");
    const cartButton = page.locator('[aria-label="Cart"]');
    await cartButton.click();
    // Cart sheet should be visible
    await expect(page.locator('[role="dialog"]').first()).toBeVisible();
  });
});

test.describe("Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should show signup page", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator('input[id="name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
  });
});

test.describe("Products", () => {
  test("should load products page", async ({ page }) => {
    await page.goto("/products");
    await expect(page).toHaveURL(/\/products/);
  });
});
