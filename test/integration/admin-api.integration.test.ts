import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { createAdminHandlers } from "../../src/lib/api/admin-handlers";
import { AccessUnauthorizedError } from "../../src/lib/auth/access";
import { OperationsRepository } from "../../src/lib/db/repository";

const silentLogger = {
	info() {},
	error() {},
};

function jsonRequest(path: string, method: "POST" | "PATCH", body: unknown) {
	return new Request(`https://edgeops.example${path}`, {
		method,
		headers: {
			"content-type": "application/json",
			origin: "https://edgeops.example",
		},
		body: JSON.stringify(body),
	});
}

function authorizedHandlers() {
	return createAdminHandlers({
		repository: new OperationsRepository(env.DB),
		authorize: async () => ({ authenticated: true, subject: "test-user" }),
		now: () => new Date("2026-07-17T08:00:00.000Z"),
		logger: silentLogger,
	});
}

describe("admin API handlers", () => {
	it("rejects deployment writes when Access authentication fails", async () => {
		const handlers = createAdminHandlers({
			repository: new OperationsRepository(env.DB),
			authorize: async () => {
				throw new AccessUnauthorizedError();
			},
			now: () => new Date("2026-07-17T08:00:00.000Z"),
			logger: silentLogger,
		});

		const response = await handlers.createDeployment(
			jsonRequest("/api/admin/deployments", "POST", {
				idempotencyKey: "test-auth-rejection",
				serviceId: "edge-api",
				version: "2026.07.17.1",
				commitSha: "a12bc34",
				result: "succeeded",
			}),
		);

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			error: { code: "unauthorized", message: "Access could not be verified" },
		});
	});

	it("creates a validated deployment with a server-generated timestamp", async () => {
		const response = await authorizedHandlers().createDeployment(
			jsonRequest("/api/admin/deployments", "POST", {
				idempotencyKey: "test-api-deployment-20260717-1",
				serviceId: "edge-api",
				version: "2026.07.17.1",
				commitSha: "a12bc34",
				result: "succeeded",
			}),
		);

		expect(response.status).toBe(201);
		expect(await response.json()).toMatchObject({
			deployment: {
				idempotencyKey: "test-api-deployment-20260717-1",
				serviceId: "edge-api",
				deployedAt: "2026-07-17T08:00:00.000Z",
			},
		});
	});

	it("returns the same deployment for an identical idempotent retry", async () => {
		const handlers = authorizedHandlers();
		const body = {
			idempotencyKey: "test-api-idempotent-retry-20260717",
			serviceId: "edge-api",
			version: "2026.07.17.3",
			commitSha: "c34de56",
			result: "succeeded",
		};
		const first = await handlers.createDeployment(jsonRequest("/api/admin/deployments", "POST", body));
		const second = await handlers.createDeployment(jsonRequest("/api/admin/deployments", "POST", body));
		const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM deployments WHERE idempotency_key = ?")
			.bind(body.idempotencyKey)
			.first<{ count: number }>();

		expect(first.status).toBe(201);
		expect(second.status).toBe(200);
		expect(await second.json()).toEqual(await first.json());
		expect(count?.count).toBe(1);
	});

	it("rejects an idempotency key reused for different deployment data", async () => {
		const handlers = authorizedHandlers();
		const original = {
			idempotencyKey: "test-api-conflicting-retry-20260717",
			serviceId: "edge-api",
			version: "2026.07.17.4",
			commitSha: "d45ef67",
			result: "succeeded",
		};
		await handlers.createDeployment(jsonRequest("/api/admin/deployments", "POST", original));

		const response = await handlers.createDeployment(
			jsonRequest("/api/admin/deployments", "POST", { ...original, version: "2026.07.17.5" }),
		);

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			error: { code: "conflict", message: "The idempotency key is already in use" },
		});
	});

	it("rejects invalid deployment fields without a partial write", async () => {
		const idempotencyKey = "test-api-invalid-deployment-20260717";
		const response = await authorizedHandlers().createDeployment(
			jsonRequest("/api/admin/deployments", "POST", {
				idempotencyKey,
				serviceId: "edge-api",
				version: "2026.07.17.6",
				commitSha: "not-a-sha",
				result: "succeeded",
				unexpected: true,
			}),
		);
		const persisted = await env.DB.prepare("SELECT id FROM deployments WHERE idempotency_key = ?")
			.bind(idempotencyKey)
			.first();

		expect(response.status).toBe(400);
		expect(persisted).toBeNull();
	});

	it("rejects non-JSON content and cross-origin writes", async () => {
		const handlers = authorizedHandlers();
		const nonJson = new Request("https://edgeops.example/api/admin/deployments", {
			method: "POST",
			headers: { "content-type": "text/plain" },
			body: "not json",
		});
		const crossOrigin = jsonRequest("/api/admin/deployments", "POST", {});
		crossOrigin.headers.set("origin", "https://attacker.example");
		const forgedForwardedOrigin = jsonRequest("/api/admin/deployments", "POST", {});
		forgedForwardedOrigin.headers.set("origin", "https://attacker.example");
		forgedForwardedOrigin.headers.set("x-forwarded-host", "attacker.example");
		forgedForwardedOrigin.headers.set("x-forwarded-proto", "https");

		expect((await handlers.createDeployment(nonJson)).status).toBe(415);
		expect((await handlers.createDeployment(crossOrigin)).status).toBe(403);
		expect((await handlers.createDeployment(forgedForwardedOrigin)).status).toBe(403);
	});

	it("rejects malformed JSON with a stable error response", async () => {
		const request = new Request("https://edgeops.example/api/admin/deployments", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: "{",
		});

		const response = await authorizedHandlers().createDeployment(request);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: { code: "invalid_json", message: "The request body must be valid JSON" },
		});
	});

	it("rejects a deployment for an unknown service without writing a record", async () => {
		const idempotencyKey = "test-api-unknown-service-20260717";
		const response = await authorizedHandlers().createDeployment(
			jsonRequest("/api/admin/deployments", "POST", {
				idempotencyKey,
				serviceId: "missing-service",
				version: "2026.07.17.2",
				commitSha: "b23cd45",
				result: "failed",
			}),
		);
		const persisted = await env.DB.prepare("SELECT id FROM deployments WHERE idempotency_key = ?")
			.bind(idempotencyKey)
			.first();

		expect(response.status).toBe(404);
		expect(persisted).toBeNull();
	});

	it("creates a validated open incident", async () => {
		const response = await authorizedHandlers().createIncident(
			jsonRequest("/api/admin/incidents", "POST", {
				serviceId: "event-worker",
				title: "Synthetic delivery latency",
			}),
		);

		expect(response.status).toBe(201);
		expect(await response.json()).toMatchObject({
			incident: {
				serviceId: "event-worker",
				title: "Synthetic delivery latency",
				status: "open",
				startedAt: "2026-07-17T08:00:00.000Z",
				resolvedAt: null,
			},
		});
	});

	it("rejects an incident for an unknown service without a partial write", async () => {
		const title = "Synthetic unknown service incident";
		const response = await authorizedHandlers().createIncident(
			jsonRequest("/api/admin/incidents", "POST", { serviceId: "missing-service", title }),
		);
		const persisted = await env.DB.prepare("SELECT id FROM incidents WHERE title = ?").bind(title).first();

		expect(response.status).toBe(404);
		expect(persisted).toBeNull();
	});

	it("resolves an open incident through an explicit state transition", async () => {
		const handlers = authorizedHandlers();
		const createResponse = await handlers.createIncident(
			jsonRequest("/api/admin/incidents", "POST", {
				serviceId: "web-console",
				title: "Synthetic cache saturation",
			}),
		);
		const created = (await createResponse.json()) as { incident: { id: number } };

		const response = await handlers.resolveIncident(
			jsonRequest(`/api/admin/incidents/${created.incident.id}`, "PATCH", { status: "resolved" }),
			String(created.incident.id),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			incident: {
				id: created.incident.id,
				status: "resolved",
				resolvedAt: "2026-07-17T08:00:00.000Z",
			},
		});
	});

	it("rejects illegal incident identifiers and repeated transitions", async () => {
		const handlers = authorizedHandlers();
		const invalidStatus = await handlers.resolveIncident(
			jsonRequest("/api/admin/incidents/1", "PATCH", { status: "open" }),
			"1",
		);
		const invalidId = await handlers.resolveIncident(
			jsonRequest("/api/admin/incidents/not-a-number", "PATCH", { status: "resolved" }),
			"not-a-number",
		);
		const missing = await handlers.resolveIncident(
			jsonRequest("/api/admin/incidents/999999", "PATCH", { status: "resolved" }),
			"999999",
		);
		const createdResponse = await handlers.createIncident(
			jsonRequest("/api/admin/incidents", "POST", {
				serviceId: "edge-api",
				title: "Synthetic repeated resolution",
			}),
		);
		const created = (await createdResponse.json()) as { incident: { id: number } };
		await handlers.resolveIncident(
			jsonRequest(`/api/admin/incidents/${created.incident.id}`, "PATCH", { status: "resolved" }),
			String(created.incident.id),
		);
		const repeated = await handlers.resolveIncident(
			jsonRequest(`/api/admin/incidents/${created.incident.id}`, "PATCH", { status: "resolved" }),
			String(created.incident.id),
		);

		expect(invalidStatus.status).toBe(400);
		expect(invalidId.status).toBe(400);
		expect(missing.status).toBe(404);
		expect(repeated.status).toBe(409);
	});
});
