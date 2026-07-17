import type { Deployment, Incident, Service } from "./db/types";

export interface DashboardRepository {
	listServices(): Promise<Service[]>;
	listRecentDeployments(limit?: number): Promise<Deployment[]>;
	listRecentIncidents(limit?: number): Promise<Incident[]>;
}

export interface DashboardData {
	state: "ready" | "empty" | "unavailable";
	services: Service[];
	deployments: Deployment[];
	incidents: Incident[];
}

export function unavailableDashboardData(): DashboardData {
	return { state: "unavailable", services: [], deployments: [], incidents: [] };
}

export async function loadDashboardData(repository: DashboardRepository): Promise<DashboardData> {
	try {
		const [services, deployments, incidents] = await Promise.all([
			repository.listServices(),
			repository.listRecentDeployments(8),
			repository.listRecentIncidents(8),
		]);
		const state = services.length === 0 && deployments.length === 0 && incidents.length === 0 ? "empty" : "ready";
		return { state, services, deployments, incidents };
	} catch {
		return unavailableDashboardData();
	}
}
