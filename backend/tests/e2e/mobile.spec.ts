import { expect, test } from "@playwright/test";

test("mobile visitors can reach the bag and their account", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Shopping bag/ }).first()).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu.getByRole("link", { name: /Log In/ })).toBeVisible();
  await expect(menu.getByRole("link", { name: /Bag/ })).toBeVisible();
  await menu.getByRole("link", { name: "Soft Silks" }).click();
  await expect(page).toHaveURL(/\/soft-silk$/);
  await expect(page.getByRole("heading", { level: 1, name: "Soft Silks" })).toBeVisible();
});
