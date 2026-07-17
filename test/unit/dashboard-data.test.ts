import { describe, expect, it } from "vitest";
import { loadDashboardData, type DashboardRepository } from "../../src/lib/dashboard-data";

function repository(overrides: Partial<DashboardRepository> = {}): DashboardRepository {
	return {
		listServices: async () => [],
		listRecentDeployments: async () => [],
		listRecentIncidents: async () => [],
		...overrides,
	};
}

describe("loadDashboardData", () => {
	it("returns an explicit empty state when every collection is empty", async () => {
		await expect(loadDashboardData(repository())).resolves.toEqual({
			state: "empty",
			services: [],
			deployments: [],
			incidents: [],
		});
	});

	it("returns a redacted unavailable state when a D1 read fails", async () => {
		const data = await loadDashboardData(
			repository({ listRecentDeployments: async () => Promise.reject(new Error("sensitive database detail")) }),
		);

		expect(data).toEqual({ state: "unavailable", services: [], deployments: [], incidents: [] });
		expect(JSON.stringify(data)).not.toContain("sensitive");
	});
});
