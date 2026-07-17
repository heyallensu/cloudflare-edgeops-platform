import { expect, test } from "@playwright/test";

test("records a deployment and completes an incident lifecycle", async ({ page }) => {
	await page.goto("/admin");

	await expect(page.getByRole("heading", { level: 1, name: "Operations console" })).toBeVisible();

	const deploymentForm = page.getByRole("form", { name: "Record deployment" });
	await deploymentForm.getByLabel("Service").selectOption("edge-api");
	await deploymentForm.getByLabel("Version").fill("2026.07.17.e2e");
	await deploymentForm.getByLabel("Commit SHA").fill("e2e7abc");
	await deploymentForm.getByLabel("Result").selectOption("succeeded");
	await deploymentForm.getByRole("button", { name: "Record deployment" }).click();
	await expect(deploymentForm.getByRole("status")).toContainText("Deployment recorded");

	const incidentTitle = `Synthetic browser event ${Date.now()}`;
	const incidentForm = page.getByRole("form", { name: "Open incident" });
	await incidentForm.getByLabel("Service").selectOption("event-worker");
	await incidentForm.getByLabel("Incident title").fill(incidentTitle);
	await incidentForm.getByRole("button", { name: "Open incident" }).click();
	await expect(incidentForm.getByRole("status")).toContainText("Incident opened");

	const incident = page.getByTestId("admin-incident").filter({ hasText: incidentTitle });
	await expect(incident).toBeVisible();
	await incident.getByRole("button", { name: "Resolve incident" }).click();
	await expect(page.getByRole("status", { name: "Incident action status" })).toContainText("Incident resolved");
	await expect(incident).toHaveCount(0);
});
