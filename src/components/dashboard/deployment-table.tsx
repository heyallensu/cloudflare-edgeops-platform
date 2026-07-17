import type { Deployment, Service } from "@/lib/db/types";

function formatTime(value: string): string {
	return new Intl.DateTimeFormat("en-AU", {
		day: "2-digit",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone: "UTC",
	}).format(new Date(value));
}

export function DeploymentTable({ deployments, services }: Readonly<{ deployments: Deployment[]; services: Service[] }>) {
	const serviceNames = new Map(services.map((service) => [service.id, service.name]));
	if (deployments.length === 0) return <p className="inline-empty">No synthetic deployments recorded.</p>;

	return (
		<div className="table-scroll">
			<table className="deployment-table">
				<thead><tr><th>Service</th><th>Version</th><th>Commit</th><th>Result</th><th>UTC</th></tr></thead>
				<tbody>
					{deployments.map((deployment) => (
						<tr key={deployment.id}>
							<td>{serviceNames.get(deployment.serviceId) ?? deployment.serviceId}</td>
							<td>{deployment.version}</td>
							<td><code>{deployment.commitSha}</code></td>
							<td><span className={`result result-${deployment.result}`}>{deployment.result.replace("_", " ")}</span></td>
							<td><time dateTime={deployment.deployedAt}>{formatTime(deployment.deployedAt)}</time></td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
