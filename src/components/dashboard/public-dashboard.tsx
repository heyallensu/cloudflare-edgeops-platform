import Link from "next/link";
import type { DashboardData } from "@/lib/dashboard-data";
import { DeploymentTable } from "./deployment-table";
import { IncidentTimeline } from "./incident-timeline";
import { ServiceGrid } from "./service-grid";

export function PublicDashboard({ data }: Readonly<{ data: DashboardData }>) {
	const healthyCount = data.services.filter((service) => service.status === "healthy").length;
	const openCount = data.incidents.filter((incident) => incident.status === "open").length;

	return (
		<main className="dashboard-shell">
			<header className="topbar">
				<Link className="brand" href="/" aria-label="EdgeOps Dashboard home">
					<span className="brand-mark" aria-hidden="true">EO</span>
					<span>EDGEOPS / CONTROL</span>
				</Link>
				<div className="topbar-actions">
					<span className="data-label">Synthetic demo data</span>
					<Link className="console-link" href="/admin">Open operations console</Link>
				</div>
			</header>

			<section className="hero" aria-labelledby="dashboard-title">
				<div>
					<p className="eyebrow">Cloud platform reference / 001</p>
					<h1 id="dashboard-title">EdgeOps Dashboard</h1>
					<p className="hero-copy">
						A compact operating view for service health, releases, and incident state—running at the edge with a D1-backed control plane.
					</p>
				</div>
				<dl className="hero-metrics" aria-label="Current operational summary">
					<div><dt>Services</dt><dd>{data.services.length.toString().padStart(2, "0")}</dd></div>
					<div><dt>Healthy</dt><dd>{healthyCount.toString().padStart(2, "0")}</dd></div>
					<div><dt>Open events</dt><dd>{openCount.toString().padStart(2, "0")}</dd></div>
				</dl>
			</section>

			{data.state === "unavailable" ? (
				<section className="state-panel" role="status">
					<p className="eyebrow">Read path unavailable</p>
					<h2>Operational data is temporarily unavailable</h2>
					<p>The public surface remains safe and does not expose database or binding details. Try again shortly.</p>
				</section>
			) : data.state === "empty" ? (
				<section className="state-panel" role="status">
					<p className="eyebrow">No records</p>
					<h2>The dashboard is ready for synthetic data</h2>
					<p>Apply the separate seed migration to populate the reference environment.</p>
				</section>
			) : (
				<>
					<section className="dashboard-section" aria-labelledby="services-title">
						<div className="section-heading">
							<div><p className="section-index">01 / SERVICE MAP</p><h2 id="services-title">Runtime posture</h2></div>
							<p>Explicit health states from the synthetic control plane.</p>
						</div>
						<ServiceGrid services={data.services} />
					</section>

					<div className="operations-grid">
						<section className="dashboard-section" aria-labelledby="deployments-title">
							<div className="section-heading compact">
								<div><p className="section-index">02 / RELEASE FEED</p><h2 id="deployments-title">Recent deployments</h2></div>
							</div>
							<DeploymentTable deployments={data.deployments} services={data.services} />
						</section>

						<section className="dashboard-section" aria-labelledby="incidents-title">
							<div className="section-heading compact">
								<div><p className="section-index">03 / EVENT LOG</p><h2 id="incidents-title">Incident timeline</h2></div>
							</div>
							<IncidentTimeline incidents={data.incidents} services={data.services} />
						</section>
					</div>
				</>
			)}

			<section className="architecture-strip" aria-labelledby="architecture-title">
				<div><p className="section-index">REFERENCE PATH</p><h2 id="architecture-title">Next.js → OpenNext → Workers → D1</h2></div>
				<p>Access secures only the administrative surface. The dashboard and health endpoint remain public, observable, and intentionally free of real customer data.</p>
			</section>

			<footer className="dashboard-footer">
				<span>EDGEOPS REFERENCE / CLEAN-ROOM BUILD</span>
				<span>PUBLIC READ · PROTECTED WRITE</span>
			</footer>
		</main>
	);
}
