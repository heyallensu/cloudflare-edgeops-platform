import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PublicDashboard } from "@/components/dashboard/public-dashboard";
import { OperationsRepository } from "@/lib/db/repository";
import { loadDashboardData, unavailableDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function Home() {
	let data;
	try {
		const { env } = await getCloudflareContext({ async: true });
		data = await loadDashboardData(new OperationsRepository(env.DB));
	} catch {
		data = unavailableDashboardData();
	}

	return <PublicDashboard data={data} />;
}
