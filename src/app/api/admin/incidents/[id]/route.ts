import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createRuntimeAdminHandlers } from "@/lib/api/runtime-admin-handlers";

export const dynamic = "force-dynamic";

export async function PATCH(
	request: Request,
	context: { params: Promise<{ id: string }> },
): Promise<Response> {
	const [{ env }, { id }] = await Promise.all([
		getCloudflareContext({ async: true }),
		context.params,
	]);
	return createRuntimeAdminHandlers(env.DB).resolveIncident(request, id);
}
