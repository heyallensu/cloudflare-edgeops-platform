export type ServiceEnvironment = "production" | "staging";
export type ServiceStatus = "healthy" | "degraded" | "down";
export type DeploymentResult = "succeeded" | "failed" | "rolled_back";
export type IncidentStatus = "open" | "resolved";

export interface Service {
	id: string;
	name: string;
	environment: ServiceEnvironment;
	status: ServiceStatus;
	updatedAt: string;
}

export interface Deployment {
	id: number;
	idempotencyKey: string;
	serviceId: string;
	version: string;
	commitSha: string;
	result: DeploymentResult;
	deployedAt: string;
}

export interface Incident {
	id: number;
	serviceId: string;
	title: string;
	status: IncidentStatus;
	startedAt: string;
	resolvedAt: string | null;
}

export interface CreateDeploymentInput {
	idempotencyKey: string;
	serviceId: string;
	version: string;
	commitSha: string;
	result: DeploymentResult;
	deployedAt: string;
}

export interface CreateIncidentInput {
	serviceId: string;
	title: string;
	startedAt: string;
}
