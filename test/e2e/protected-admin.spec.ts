import { expect, test } from "@playwright/test";

test("rejects an admin request without a Cloudflare Access assertion", async ({ page }) => {
	const response = await page.goto("/admin");

	expect(response?.status()).toBe(401);
	await expect(page.getByRole("heading", { name: "Access could not be verified" })).toBeVisible();
	await expect(page.getByText("CF-Access-Jwt-Assertion")).toHaveCount(0);
});
