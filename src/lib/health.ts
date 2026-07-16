import type { StructuredLogger } from "./observability/logger";

interface CreateHealthResponseOptions {
	db: D1Database;
	version: string;
	environment: string;
	now: () => Date;
	monotonicNow: () => number;
	logger: StructuredLogger;
}

function elapsed(startedAt: number, endedAt: number): number {
	return Math.max(0, Math.round(endedAt - startedAt));
}

export async function createHealthResponse(options: CreateHealthResponseOptions): Promise<Response> {
	const totalStartedAt = options.monotonicNow();
	const d1StartedAt = options.monotonicNow();

	try {
		const result = await options.db.prepare("SELECT 1 AS ok").first<{ ok: number }>();
		if (result?.ok !== 1) {
			throw new Error("D1 check returned an unexpected result");
		}

		const d1DurationMs = elapsed(d1StartedAt, options.monotonicNow());
		const durationMs = elapsed(totalStartedAt, options.monotonicNow());
		options.logger.info("health_check_completed", {
			status: "ok",
			durationMs,
			d1Status: "ok",
			d1DurationMs,
		});

		return Response.json(
			{
				status: "ok",
				service: "edgeops-dashboard",
				version: options.version,
				environment: options.environment,
				timestamp: options.now().toISOString(),
				durationMs,
				checks: { d1: { status: "ok", durationMs: d1DurationMs } },
			},
			{ status: 200, headers: { "Cache-Control": "no-store" } },
		);
	} catch {
		const d1DurationMs = elapsed(d1StartedAt, options.monotonicNow());
		const durationMs = elapsed(totalStartedAt, options.monotonicNow());
		options.logger.error("health_check_completed", {
			status: "degraded",
			durationMs,
			d1Status: "unavailable",
			d1DurationMs,
		});

		return Response.json(
			{
				status: "degraded",
				service: "edgeops-dashboard",
				version: options.version,
				environment: options.environment,
				timestamp: options.now().toISOString(),
				durationMs,
				checks: { d1: { status: "unavailable", durationMs: d1DurationMs } },
			},
			{ status: 503, headers: { "Cache-Control": "no-store" } },
		);
	}
}
