import { expect, test } from "@playwright/test";

for (const scenario of [
  {
    path: "/payment-status",
    retry: "Check status again",
    success: "Payment successful",
  },
  {
    path: "/zh-Hans/payment-status",
    retry: "重新查询状态",
    success: "支付成功",
  },
]) {
  test(`recovers payment verification on ${scenario.path}`, async ({
    page,
  }) => {
    let checks = 0;
    await page.route("**/api/payment-status?*", async (route) => {
      checks += 1;
      if (checks === 1)
        return route.fulfill({ status: 401, json: { error: "Unauthorized" } });
      if (checks === 2)
        return route.fulfill({
          status: 502,
          json: { error: "Temporary failure" },
        });
      await route.fulfill({
        json: { status: "success", paymentMode: "subscription" },
      });
    });
    await page.goto(`${scenario.path}?session_id=fixture-checkout`);
    await page.getByRole("button", { name: scenario.retry }).click();
    await expect(
      page.getByRole("heading", { name: scenario.success }),
    ).toBeVisible();
    expect(checks).toBe(3);
  });
}
