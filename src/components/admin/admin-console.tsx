"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import type { Incident, Service } from "@/lib/db/types";

type ActionState = { kind: "idle" | "pending" | "success" | "error"; message: string };

const idleState: ActionState = { kind: "idle", message: "" };

async function apiError(response: Response): Promise<string> {
	try {
		const body = (await response.json()) as { error?: { message?: string } };
		return body.error?.message ?? "The operation could not be completed";
	} catch {
		return "The operation could not be completed";
	}
}

export function AdminConsole({ services, incidents }: Readonly<{ services: Service[]; incidents: Incident[] }>) {
	const router = useRouter();
	const [deploymentState, setDeploymentState] = useState<ActionState>(idleState);
	const [incidentState, setIncidentState] = useState<ActionState>(idleState);
	const [resolutionState, setResolutionState] = useState<ActionState>(idleState);
	const [resolvedIds, setResolvedIds] = useState<number[]>([]);
	const visibleIncidents = incidents.filter((incident) => !resolvedIds.includes(incident.id));

	async function submitDeployment(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setDeploymentState({ kind: "pending", message: "Recording deployment…" });
		const form = new FormData(event.currentTarget);
		let response: Response;
		try {
			response = await fetch("/api/admin/deployments", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					idempotencyKey: `ui:${crypto.randomUUID()}`,
					serviceId: form.get("serviceId"),
					version: form.get("version"),
					commitSha: form.get("commitSha"),
					result: form.get("result"),
				}),
			});
		} catch {
			setDeploymentState({ kind: "error", message: "The network request failed. Try again." });
			return;
		}

		if (!response.ok) {
			setDeploymentState({ kind: "error", message: await apiError(response) });
			return;
		}
		setDeploymentState({ kind: "success", message: "Deployment recorded." });
		router.refresh();
	}

	async function submitIncident(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIncidentState({ kind: "pending", message: "Opening incident…" });
		const formElement = event.currentTarget;
		const form = new FormData(formElement);
		let response: Response;
		try {
			response = await fetch("/api/admin/incidents", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					serviceId: form.get("serviceId"),
					title: form.get("title"),
				}),
			});
		} catch {
			setIncidentState({ kind: "error", message: "The network request failed. Try again." });
			return;
		}

		if (!response.ok) {
			setIncidentState({ kind: "error", message: await apiError(response) });
			return;
		}
		formElement.reset();
		setIncidentState({ kind: "success", message: "Incident opened." });
		router.refresh();
	}

	async function resolveIncident(id: number) {
		setResolutionState({ kind: "pending", message: "Resolving incident…" });
		let response: Response;
		try {
			response = await fetch(`/api/admin/incidents/${id}`, {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ status: "resolved" }),
			});
		} catch {
			setResolutionState({ kind: "error", message: "The network request failed. Try again." });
			return;
		}

		if (!response.ok) {
			setResolutionState({ kind: "error", message: await apiError(response) });
			return;
		}
		setResolvedIds((current) => [...current, id]);
		setResolutionState({ kind: "success", message: "Incident resolved." });
		router.refresh();
	}

	return (
		<main className="admin-shell">
		<header className="admin-topbar">
			<Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">EO</span><span>EDGEOPS / CONTROL</span></Link>
			<Link href="/">Return to public dashboard</Link>
		</header>

		<section className="admin-intro">
			<div><p className="eyebrow">Access verified / protected write path</p><h1>Operations console</h1></div>
			<p>Record synthetic releases and incident transitions. Inputs are validated again at the API boundary; identity claims are never stored.</p>
		</section>

		<div className="admin-grid">
			<form aria-label="Record deployment" className="admin-form" onSubmit={submitDeployment}>
				<div className="admin-form-heading"><span>01</span><div><p>Release control</p><h2>Record deployment</h2></div></div>
				<label>Service<select name="serviceId" required defaultValue=""><option value="" disabled>Select service</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
				<div className="field-pair">
					<label>Version<input name="version" required maxLength={64} placeholder="2026.07.17.1" /></label>
					<label>Commit SHA<input name="commitSha" required minLength={7} maxLength={12} pattern="[0-9a-f]{7,12}" placeholder="a12bc34" /></label>
				</div>
				<label>Result<select name="result" defaultValue="succeeded"><option value="succeeded">Succeeded</option><option value="failed">Failed</option><option value="rolled_back">Rolled back</option></select></label>
				<button disabled={deploymentState.kind === "pending"} type="submit">{deploymentState.kind === "pending" ? "Recording…" : "Record deployment"}</button>
				<p className={`form-status status-${deploymentState.kind}`} role="status">{deploymentState.message}</p>
			</form>

			<form aria-label="Open incident" className="admin-form" onSubmit={submitIncident}>
				<div className="admin-form-heading"><span>02</span><div><p>Event control</p><h2>Open incident</h2></div></div>
				<label>Service<select name="serviceId" required defaultValue=""><option value="" disabled>Select service</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
				<label>Incident title<input name="title" required minLength={3} maxLength={160} placeholder="Synthetic elevated latency" /></label>
				<button disabled={incidentState.kind === "pending"} type="submit">{incidentState.kind === "pending" ? "Opening…" : "Open incident"}</button>
				<p className={`form-status status-${incidentState.kind}`} role="status">{incidentState.message}</p>
			</form>
		</div>

		<section className="active-incidents" aria-labelledby="active-incidents-title">
			<div className="section-heading compact"><div><p className="section-index">03 / ACTIVE RESPONSE</p><h2 id="active-incidents-title">Open incidents</h2></div></div>
			<p aria-label="Incident action status" className={`form-status status-${resolutionState.kind}`} role="status">{resolutionState.message}</p>
			{visibleIncidents.length === 0 ? <p className="inline-empty">No open synthetic incidents.</p> : (
				<ul>
					{visibleIncidents.map((incident) => (
						<li data-testid="admin-incident" key={incident.id}>
							<div><span className="result incident-open">Open</span><h3>{incident.title}</h3><p>{services.find((service) => service.id === incident.serviceId)?.name ?? incident.serviceId}</p></div>
							<button disabled={resolutionState.kind === "pending"} onClick={() => resolveIncident(incident.id)} type="button">Resolve incident</button>
						</li>
					))}
				</ul>
			)}
		</section>
	</main>
	);
}
