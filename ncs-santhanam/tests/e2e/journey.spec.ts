import { expect, test } from "@playwright/test";
import { firstLink, readOtp, signInAsAdmin, signInWithEmail, waitForEmail } from "./utils";

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const randomMobile = () => `9${String(Math.floor(Math.random() * 1e9)).padStart(9, "0")}`;

test("customer journey: sign up → verify → mobile OTP → COD order → admin ships & delivers → invoice", async ({ page, browser }) => {
  const email = `buyer-${unique()}@example.com`;
  const password = "silk-Buyer-2026";

  // 1. Sign up and verify the email address via the link the worker sends.
  await page.goto("/login?mode=signup");
  await page.getByLabel("Full name").fill("Meera Krishnan");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel(/Password/).fill(password);
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.getByRole("status")).toContainText("verification link");
  await page.goto(firstLink(await waitForEmail(email, "Verify your email"), "verify-email"));
  await expect(page).toHaveURL(/\/account$/);

  // 2. Verify a mobile number (needed for cash on delivery).
  const mobile = randomMobile();
  await page.getByLabel("Mobile number").fill(mobile);
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("Verification code").fill(await readOtp(`+91${mobile}`));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText("✓ verified")).toBeVisible();

  // 3. Add a saree to the bag from its product page.
  await page.goto("/shop/royal-kanchipuram-silk");
  await expect(page.getByRole("heading", { level: 1, name: "Royal Kanchipuram Silk" })).toBeVisible();
  await page.getByRole("button", { name: "Add to Bag" }).first().click();
  await expect(page.getByText("added to your bag")).toBeVisible();

  // 4. Check out with cash on delivery to a new address.
  await page.goto("/checkout");
  await page.getByLabel("Full name *").fill("Meera Krishnan");
  await page.getByLabel("Mobile number *").fill(mobile);
  await page.getByLabel("PIN code *").fill("600028");
  await page.getByLabel("House / flat no., street *").fill("14 Luz Church Road");
  await page.getByLabel("City *").fill("Chennai");
  await expect(page.getByText(/Estimated delivery in/)).toBeVisible();
  await page.getByLabel(/Cash on delivery/).check();
  await page.getByRole("button", { name: /Place order/ }).click();

  await expect(page).toHaveURL(/\/account\/orders\/[^/?]+\?placed=1/);
  await expect(page.getByText("your order is confirmed")).toBeVisible();
  const orderId = new URL(page.url()).pathname.split("/").pop()!;
  await waitForEmail(email, "confirmed");

  // 5. Admin ships and delivers the order.
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await signInAsAdmin(admin);
  await admin.goto(`/admin/orders/${orderId}`);
  await admin.getByLabel("AWB number").fill("BD1234567890");
  await admin.getByRole("button", { name: "Mark shipped" }).click();
  await expect(admin.getByText("Marked as shipped")).toBeVisible();
  await admin.getByRole("button", { name: "Delivered", exact: true }).click();
  await expect(admin.getByText("Order moved to Delivered.")).toBeVisible();
  await adminContext.close();

  // 6. The customer sees the delivery, the GST invoice and gets shipping email.
  await waitForEmail(email, "has shipped");
  await expect
    .poll(
      async () => {
        await page.reload();
        return page.getByRole("link", { name: "Download GST invoice" }).count();
      },
      { timeout: 30_000 },
    )
    .toBe(1);
  await expect(page.getByText("BD1234567890", { exact: true })).toBeVisible();
  const invoice = await page.request.get(`/api/orders/${orderId}/invoice`, { maxRedirects: 0 });
  expect(invoice.status()).toBe(303);
});

test("access control and status codes", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);

  expect((await request.get("/definitely-not-a-page")).status()).toBe(404);
  expect((await request.get("/shop/not-a-product")).status()).toBe(404);
  expect((await request.get("/shop/product/p1", { maxRedirects: 0 })).status()).toBe(308);
  expect((await request.get("/api/orders/anything/invoice")).status()).toBe(401);
  expect((await request.post("/api/admin/uploads")).status()).toBe(403);

  const res = await request.get("/");
  expect(res.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
});

test("a guest bag is kept after signing in", async ({ page }) => {
  await page.goto("/soft-silk");
  await page.getByRole("button", { name: "Add to Bag" }).first().click();
  await expect(page.getByText("added to your bag")).toBeVisible();

  // A customer account with a verified email, created through sign-up + verification.
  const email = `guest-${unique()}@example.com`;
  await page.goto("/login?mode=signup");
  await page.getByLabel("Full name").fill("Lakshmi V");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel(/Password/).fill("silk-Guest-2026");
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.goto(firstLink(await waitForEmail(email, "Verify your email"), "verify-email"));
  await expect(page).toHaveURL(/\/account$/);

  await page.goto("/cart");
  await expect(page.getByText("1 item in your bag")).toBeVisible();

  await page.goto("/account");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await signInWithEmail(page, email, "silk-Guest-2026", "/cart");
  await expect(page.getByText("1 item in your bag")).toBeVisible();
});

test("search suggestions and results", async ({ page }) => {
  await page.goto("/");
  const box = page.getByRole("combobox").first();
  await box.fill("korvai");
  await expect(page.getByRole("option").first()).toBeVisible();
  await box.press("Enter");
  await expect(page).toHaveURL(/\/shop\?q=korvai/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("korvai");
});
