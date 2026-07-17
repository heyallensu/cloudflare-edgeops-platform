import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./test/e2e",
	testIgnore: "**/protected-admin.spec.ts",
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	reporter: "list",
	use: {
		baseURL: "http://127.0.0.1:3100",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		command: "npm run d1:migrate:local && npm run dev -- --hostname 127.0.0.1 --port 3100",
		url: "http://127.0.0.1:3100/api/health",
		reuseExistingServer: false,
		timeout: 120_000,
		env: {
			...process.env,
			LOCAL_ACCESS_BYPASS: "true",
		},
	},
});
