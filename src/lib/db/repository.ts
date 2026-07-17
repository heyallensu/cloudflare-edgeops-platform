import type {
	CreateDeploymentInput,
	CreateIncidentInput,
	Deployment,
	DeploymentResult,
	Incident,
	IncidentStatus,
	Service,
	ServiceEnvironment,
	ServiceStatus,
} from "./types";

interface ServiceRow {
	id: string;
	name: string;
	environment: ServiceEnvironment;
	status: ServiceStatus;
	updated_at: string;
}

interface DeploymentRow {
	id: number;
	idempotency_key: string;
	service_id: string;
	version: string;
	commit_sha: string;
	result: DeploymentResult;
	deployed_at: string;
}

interface IncidentRow {
	id: number;
	service_id: string;
	title: string;
	status: IncidentStatus;
	started_at: string;
	resolved_at: string | null;
}

function mapService(row: ServiceRow): Service {
	return {
		id: row.id,
		name: row.name,
		environment: row.environment,
		status: row.status,
		updatedAt: row.updated_at,
	};
}

function mapDeployment(row: DeploymentRow): Deployment {
	return {
		id: row.id,
		idempotencyKey: row.idempotency_key,
		serviceId: row.service_id,
		version: row.version,
		commitSha: row.commit_sha,
		result: row.result,
		deployedAt: row.deployed_at,
	};
}

function mapIncident(row: IncidentRow): Incident {
	return {
		id: row.id,
		serviceId: row.service_id,
		title: row.title,
		status: row.status,
		startedAt: row.started_at,
		resolvedAt: row.resolved_at,
	};
}

function deploymentMatchesInput(deployment: Deployment, input: CreateDeploymentInput): boolean {
	return (
		deployment.idempotencyKey === input.idempotencyKey &&
		deployment.serviceId === input.serviceId &&
		deployment.version === input.version &&
		deployment.commitSha === input.commitSha &&
		deployment.result === input.result
	);
}

export interface DeploymentWriteResult {
	deployment: Deployment;
	created: boolean;
}

export class RepositoryConflictError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RepositoryConflictError";
	}
}

export class RepositoryNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RepositoryNotFoundError";
	}
}

export class OperationsRepository {
	constructor(private readonly db: D1Database) {}

	async listServices(): Promise<Service[]> {
		const result = await this.db
			.prepare("SELECT id, name, environment, status, updated_at FROM services ORDER BY id")
			.all<ServiceRow>();

		return result.results.map(mapService);
	}

	async listRecentDeployments(limit = 10): Promise<Deployment[]> {
		const result = await this.db
			.prepare(
				"SELECT id, idempotency_key, service_id, version, commit_sha, result, deployed_at FROM deployments ORDER BY deployed_at DESC, id DESC LIMIT ?",
			)
			.bind(limit)
			.all<DeploymentRow>();

		return result.results.map(mapDeployment);
	}

	async listRecentIncidents(limit = 10): Promise<Incident[]> {
		const result = await this.db
			.prepare(
				"SELECT id, service_id, title, status, started_at, resolved_at FROM incidents ORDER BY started_at DESC, id DESC LIMIT ?",
			)
			.bind(limit)
			.all<IncidentRow>();

		return result.results.map(mapIncident);
	}

	async createDeployment(input: CreateDeploymentInput): Promise<Deployment> {
		return (await this.createDeploymentWithOutcome(input)).deployment;
	}

	async createDeploymentWithOutcome(input: CreateDeploymentInput): Promise<DeploymentWriteResult> {
		await this.assertServiceExists(input.serviceId);

		const write = await this.db
			.prepare(
				"INSERT OR IGNORE INTO deployments (idempotency_key, service_id, version, commit_sha, result, deployed_at) VALUES (?, ?, ?, ?, ?, ?)",
			)
			.bind(
				input.idempotencyKey,
				input.serviceId,
				input.version,
				input.commitSha,
				input.result,
				input.deployedAt,
			)
			.run();

		const deployment = await this.db
			.prepare(
				"SELECT id, idempotency_key, service_id, version, commit_sha, result, deployed_at FROM deployments WHERE idempotency_key = ?",
			)
			.bind(input.idempotencyKey)
			.first<DeploymentRow>();

		if (!deployment) {
			throw new Error("Deployment could not be persisted");
		}

		const persisted = mapDeployment(deployment);
		if (!deploymentMatchesInput(persisted, input)) {
			throw new RepositoryConflictError("Idempotency key is already associated with a different deployment");
		}

		return { deployment: persisted, created: write.meta.changes === 1 };
	}

	async createIncident(input: CreateIncidentInput): Promise<Incident> {
		await this.assertServiceExists(input.serviceId);

		const result = await this.db
			.prepare("INSERT INTO incidents (service_id, title, status, started_at, resolved_at) VALUES (?, ?, 'open', ?, NULL)")
			.bind(input.serviceId, input.title, input.startedAt)
			.run();

		const incident = await this.findIncident(Number(result.meta.last_row_id));
		if (!incident) {
			throw new Error("Incident could not be persisted");
		}

		return incident;
	}

	async resolveIncident(id: number, resolvedAt: string): Promise<Incident> {
		const write = await this.db
			.prepare("UPDATE incidents SET status = 'resolved', resolved_at = ? WHERE id = ? AND status = 'open'")
			.bind(resolvedAt, id)
			.run();

		const incident = await this.findIncident(id);
		if (!incident) {
			throw new RepositoryNotFoundError("Incident was not found");
		}
		if (write.meta.changes !== 1 || incident.status !== "resolved" || incident.resolvedAt !== resolvedAt) {
			throw new RepositoryConflictError("Incident is not open");
		}

		return incident;
	}

	private async findIncident(id: number): Promise<Incident | null> {
		const row = await this.db
			.prepare("SELECT id, service_id, title, status, started_at, resolved_at FROM incidents WHERE id = ?")
			.bind(id)
			.first<IncidentRow>();

		return row ? mapIncident(row) : null;
	}

	private async assertServiceExists(id: string): Promise<void> {
		const service = await this.db.prepare("SELECT id FROM services WHERE id = ?").bind(id).first<{ id: string }>();
		if (!service) {
			throw new RepositoryNotFoundError("Service was not found");
		}
	}
}
