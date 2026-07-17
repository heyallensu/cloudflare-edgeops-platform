import { expect, test } from "@playwright/test";

test("renders the public synthetic operations dashboard", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByRole("heading", { level: 1, name: "EdgeOps Dashboard" })).toBeVisible();
	await expect(page.getByText("Synthetic demo data", { exact: true })).toBeVisible();
	await expect(page.getByTestId("service-card")).toHaveCount(3);
	await expect(page.getByRole("heading", { name: "Recent deployments" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Incident timeline" })).toBeVisible();
	await expect(page.getByText("Next.js → OpenNext → Workers → D1", { exact: true })).toBeVisible();
	await expect(page.getByRole("link", { name: "Open operations console" })).toHaveAttribute("href", "/admin");
});
