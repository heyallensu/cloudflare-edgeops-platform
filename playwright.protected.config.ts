import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./test/e2e",
	testMatch: "**/protected-admin.spec.ts",
	reporter: "list",
	use: {
		baseURL: "http://127.0.0.1:3101",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		command: "npm run d1:migrate:local && npm run dev -- --hostname 127.0.0.1 --port 3101",
		url: "http://127.0.0.1:3101/api/health",
		reuseExistingServer: false,
		timeout: 120_000,
		env: { ...process.env, LOCAL_ACCESS_BYPASS: "false" },
	},
});
