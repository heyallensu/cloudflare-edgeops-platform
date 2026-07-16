import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { OperationsRepository, RepositoryConflictError } from "../../src/lib/db/repository";

describe("OperationsRepository", () => {
	it("lists synthetic services in a stable order", async () => {
		const repository = new OperationsRepository(env.DB);

		const services = await repository.listServices();

		expect(services.map(({ id }) => id)).toEqual(["edge-api", "event-worker", "web-console"]);
		expect(services.every(({ name }) => !name.includes("@"))).toBe(true);
	});

	it("returns recent deployments and incidents newest first", async () => {
		const repository = new OperationsRepository(env.DB);

		const deployments = await repository.listRecentDeployments(2);
		const incidents = await repository.listRecentIncidents(2);

		expect(deployments.map(({ serviceId }) => serviceId)).toEqual(["edge-api", "web-console"]);
		expect(incidents.map(({ status }) => status)).toEqual(["open", "resolved"]);
	});

	it("returns the existing deployment for a repeated idempotency key", async () => {
		const repository = new OperationsRepository(env.DB);
		const input = {
			idempotencyKey: "test-edge-api-2026-07-16-2",
			serviceId: "edge-api",
			version: "2026.07.16.2",
			commitSha: "91ac3ef",
			result: "succeeded" as const,
			deployedAt: "2026-07-16T09:00:00.000Z",
		};

		const first = await repository.createDeployment(input);
		const second = await repository.createDeployment(input);
		const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM deployments WHERE idempotency_key = ?")
			.bind(input.idempotencyKey)
			.first<{ count: number }>();

		expect(second).toEqual(first);
		expect(count?.count).toBe(1);
	});

	it("rejects an idempotency key reused for different deployment data", async () => {
		const repository = new OperationsRepository(env.DB);
		const original = {
			idempotencyKey: "test-conflicting-deployment",
			serviceId: "edge-api",
			version: "2026.07.16.3",
			commitSha: "71bc9fa",
			result: "succeeded" as const,
			deployedAt: "2026-07-16T09:15:00.000Z",
		};

		await repository.createDeployment(original);

		await expect(repository.createDeployment({ ...original, version: "2026.07.16.4" })).rejects.toBeInstanceOf(
			RepositoryConflictError,
		);
	});

	it("creates and resolves an incident with an explicit transition time", async () => {
		const repository = new OperationsRepository(env.DB);
		const incident = await repository.createIncident({
			serviceId: "event-worker",
			title: "Synthetic retry backlog",
			startedAt: "2026-07-16T09:30:00.000Z",
		});

		const resolved = await repository.resolveIncident(incident.id, "2026-07-16T09:40:00.000Z");

		expect(incident).toMatchObject({ status: "open", resolvedAt: null });
		expect(resolved).toMatchObject({ status: "resolved", resolvedAt: "2026-07-16T09:40:00.000Z" });
	});

	it("rejects a second resolution transition", async () => {
		const repository = new OperationsRepository(env.DB);
		const incident = await repository.createIncident({
			serviceId: "web-console",
			title: "Synthetic cache warning",
			startedAt: "2026-07-16T10:00:00.000Z",
		});
		await repository.resolveIncident(incident.id, "2026-07-16T10:05:00.000Z");

		await expect(repository.resolveIncident(incident.id, "2026-07-16T10:06:00.000Z")).rejects.toBeInstanceOf(
			RepositoryConflictError,
		);
	});
});
