import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const terraformDirectory = path.resolve(process.cwd(), "infra/terraform");

async function readTerraform(name) {
	return readFile(path.join(terraformDirectory, name), "utf8");
}

describe("Cloudflare Terraform safety controls", () => {
	it("prevents accidental D1 destruction", async () => {
		const main = await readTerraform("main.tf");
		assert.match(main, /resource\s+"cloudflare_d1_database"\s+"edgeops"/);
		assert.match(main, /prevent_destroy\s*=\s*true/);
	});

	it("keeps Access disabled during the D1 bootstrap", async () => {
		const variables = await readTerraform("variables.tf");
		assert.match(variables, /variable\s+"enable_access"[\s\S]*?default\s*=\s*false/);
	});

	it("protects both the admin UI and its API without gating public health", async () => {
		const main = await readTerraform("main.tf");
		assert.ok(main.includes("${var.worker_hostname}/admin*"));
		assert.ok(main.includes("${var.worker_hostname}/api/admin*"));
		assert.ok(!main.includes("${var.worker_hostname}/api/health"));
	});

	it("contains no literal account ID, token, or allowed identity", async () => {
		const source = [
			await readTerraform("main.tf"),
			await readTerraform("variables.tf"),
			await readTerraform("outputs.tf"),
			await readTerraform("versions.tf"),
		].join("\n");

		assert.doesNotMatch(source, /\b[0-9a-f]{32}\b/i);
		assert.doesNotMatch(source, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
		assert.doesNotMatch(source, /(?:api[_-]?token|authorization)\s*=\s*"[^$]/i);
	});
});
