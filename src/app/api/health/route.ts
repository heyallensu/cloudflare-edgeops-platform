import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createHealthResponse } from "@/lib/health";
import { consoleLogger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
	const { env } = await getCloudflareContext({ async: true });

	return createHealthResponse({
		db: env.DB,
		version: env.APP_VERSION,
		environment: env.APP_ENVIRONMENT,
		now: () => new Date(),
		monotonicNow: () => performance.now(),
		logger: consoleLogger,
	});
}
