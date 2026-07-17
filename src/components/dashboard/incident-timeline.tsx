import type { Incident, Service } from "@/lib/db/types";

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

export function IncidentTimeline({ incidents, services }: Readonly<{ incidents: Incident[]; services: Service[] }>) {
	const serviceNames = new Map(services.map((service) => [service.id, service.name]));
	if (incidents.length === 0) return <p className="inline-empty">No synthetic incidents recorded.</p>;

	return (
		<ol className="incident-list">
			{incidents.map((incident) => (
				<li key={incident.id}>
					<div className="incident-rail"><span className={`incident-dot incident-${incident.status}`} /><span /></div>
					<div className="incident-body">
						<div><span className={`result incident-${incident.status}`}>{incident.status}</span><span className="incident-service">{serviceNames.get(incident.serviceId) ?? incident.serviceId}</span></div>
						<h3>{incident.title}</h3>
						<p><time dateTime={incident.startedAt}>{formatTime(incident.startedAt)} UTC</time>{incident.resolvedAt ? ` · resolved ${formatTime(incident.resolvedAt)} UTC` : " · response active"}</p>
					</div>
				</li>
			))}
		</ol>
	);
}
