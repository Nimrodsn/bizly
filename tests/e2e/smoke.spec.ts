import { test, expect } from "@playwright/test";

test("login page loads in Hebrew RTL", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("button", { name: "כניסה" })).toBeVisible();
});
