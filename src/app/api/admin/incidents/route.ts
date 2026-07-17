import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createRuntimeAdminHandlers } from "@/lib/api/runtime-admin-handlers";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
	const { env } = await getCloudflareContext({ async: true });
	return createRuntimeAdminHandlers(env.DB).createIncident(request);
}
