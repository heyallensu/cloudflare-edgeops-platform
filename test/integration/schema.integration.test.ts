import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("D1 schema", () => {
	it("creates the three operational tables", async () => {
		const result = await env.DB.prepare(
			"SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('services', 'deployments', 'incidents') ORDER BY name",
		).all<{ name: string }>();

		expect(result.results.map(({ name }) => name)).toEqual(["deployments", "incidents", "services"]);
	});
});
