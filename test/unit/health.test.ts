import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";
import { createHealthResponse } from "../../src/lib/health";

describe("createHealthResponse", () => {
	it("returns a stable 200 response when D1 is available", async () => {
		const logger = { info: vi.fn(), error: vi.fn() };
		const response = await createHealthResponse({
			db: env.DB,
			version: "0.1.0-test",
			environment: "test",
			now: () => new Date("2026-07-16T11:00:00.000Z"),
			monotonicNow: (() => {
				const values = [100, 101, 103, 105];
				return () => values.shift() ?? 105;
			})(),
			logger,
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("cache-control")).toBe("no-store");
		await expect(response.json()).resolves.toEqual({
			status: "ok",
			service: "edgeops-dashboard",
			version: "0.1.0-test",
			environment: "test",
			timestamp: "2026-07-16T11:00:00.000Z",
			durationMs: 5,
			checks: { d1: { status: "ok", durationMs: 2 } },
		});
	});

	it("returns 503 without leaking a D1 failure message", async () => {
		const logger = { info: vi.fn(), error: vi.fn() };
		const sensitiveMessage = "database account resource identifier must stay private";
		const failingDb = {
			prepare() {
				return {
					first() {
						throw new Error(sensitiveMessage);
					},
				};
			},
		} as unknown as D1Database;
		const response = await createHealthResponse({
			db: failingDb,
			version: "0.1.0-test",
			environment: "test",
			now: () => new Date("2026-07-16T11:05:00.000Z"),
			monotonicNow: (() => {
				const values = [200, 201, 204, 206];
				return () => values.shift() ?? 206;
			})(),
			logger,
		});
		const body = await response.text();

		expect(response.status).toBe(503);
		expect(body).not.toContain(sensitiveMessage);
		expect(JSON.parse(body)).toMatchObject({ status: "degraded", checks: { d1: { status: "unavailable" } } });
		expect(logger.error).toHaveBeenCalledWith("health_check_completed", {
			status: "degraded",
			durationMs: 6,
			d1Status: "unavailable",
			d1DurationMs: 3,
		});
	});
});
