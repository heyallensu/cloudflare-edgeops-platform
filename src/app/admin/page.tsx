import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AdminConsole } from "@/components/admin/admin-console";
import { OperationsRepository } from "@/lib/db/repository";
import type { Incident, Service } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
	let services: Service[] = [];
	let incidents: Incident[] = [];
	let unavailable = false;
	try {
		const { env } = await getCloudflareContext({ async: true });
		const repository = new OperationsRepository(env.DB);
		[services, incidents] = await Promise.all([
			repository.listServices(),
			repository.listRecentIncidents(20),
		]);
	} catch {
		unavailable = true;
	}

	if (unavailable) {
		return (
			<main className="admin-shell">
				<section className="admin-unavailable" role="status">
					<p className="eyebrow">Protected write path</p>
					<h1>Operations console</h1>
					<p>The control data is temporarily unavailable. No binding or database details have been exposed.</p>
				</section>
			</main>
		);
	}

	return <AdminConsole services={services} incidents={incidents.filter((incident) => incident.status === "open")} />;
}
