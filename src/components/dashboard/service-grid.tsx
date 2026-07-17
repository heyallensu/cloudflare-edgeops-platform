import type { Service } from "@/lib/db/types";

const statusCopy = {
	healthy: "Healthy",
	degraded: "Degraded",
	down: "Down",
} as const;

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

export function ServiceGrid({ services }: Readonly<{ services: Service[] }>) {
	return (
		<div className="service-grid">
			{services.map((service, index) => (
				<article className={`service-card status-${service.status}`} data-testid="service-card" key={service.id}>
					<div className="service-card-head">
						<span className="service-number">S-{String(index + 1).padStart(2, "0")}</span>
						<span className="status-chip"><span aria-hidden="true" />{statusCopy[service.status]}</span>
					</div>
					<h3>{service.name}</h3>
					<dl>
						<div><dt>Environment</dt><dd>{service.environment}</dd></div>
						<div><dt>Last signal</dt><dd><time dateTime={service.updatedAt}>{formatTime(service.updatedAt)} UTC</time></dd></div>
					</dl>
				</article>
			))}
		</div>
	);
}
