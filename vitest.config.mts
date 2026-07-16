import path from "node:path";
import { fileURLToPath } from "node:url";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [
		cloudflareTest(async () => ({
			main: path.join(projectRoot, "test/worker.ts"),
			wrangler: { configPath: path.join(projectRoot, "wrangler.jsonc") },
			miniflare: {
				bindings: {
					TEST_MIGRATIONS: await readD1Migrations(path.join(projectRoot, "migrations")),
				},
			},
		})),
	],
	test: {
		include: ["test/**/*.test.ts"],
		setupFiles: ["./test/apply-migrations.ts"],
	},
});
