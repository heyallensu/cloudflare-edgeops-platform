import { AccessUnauthorizedError } from "../auth/access";
import {
	OperationsRepository,
	RepositoryConflictError,
	RepositoryNotFoundError,
} from "../db/repository";
import type { StructuredLogger } from "../observability/logger";
import {
	createDeploymentSchema,
	createIncidentSchema,
	incidentIdSchema,
	resolveIncidentSchema,
} from "../validation/admin";

type Authorize = (request: Request) => Promise<unknown>;

export interface AdminHandlerDependencies {
	repository: OperationsRepository;
	authorize: Authorize;
	now: () => Date;
	logger: StructuredLogger;
}

function errorResponse(status: number, code: string, message: string): Response {
	return Response.json(
		{ error: { code, message } },
		{
			status,
			headers: { "cache-control": "no-store" },
		},
	);
}

function successResponse(body: unknown, status: number): Response {
	return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

function validateWriteRequest(request: Request): Response | null {
	if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
		return errorResponse(415, "unsupported_media_type", "Content-Type must be application/json");
	}

	const origin = request.headers.get("origin");
	if (origin) {
		const requestUrl = new URL(request.url);
		const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
		const expectedHost = forwardedHost || request.headers.get("host") || requestUrl.host;
		const expectedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || requestUrl.protocol.slice(0, -1);
		try {
			const originUrl = new URL(origin);
			if (originUrl.host !== expectedHost || originUrl.protocol !== `${expectedProtocol}:`) {
				return errorResponse(403, "forbidden_origin", "The request origin is not allowed");
			}
		} catch {
			return errorResponse(403, "forbidden_origin", "The request origin is not allowed");
		}
	}

	return null;
}

async function readJson(request: Request): Promise<unknown> {
	try {
		return await request.json();
	} catch {
		throw new SyntaxError("Invalid JSON");
	}
}

export function createAdminHandlers(dependencies: AdminHandlerDependencies) {
	return {
		async createDeployment(request: Request): Promise<Response> {
			const requestId = crypto.randomUUID();
			const startedAt = performance.now();
			try {
				await dependencies.authorize(request);
			} catch (error) {
				if (error instanceof AccessUnauthorizedError) {
					return errorResponse(401, "unauthorized", "Access could not be verified");
				}
				return errorResponse(500, "internal_error", "The operation could not be completed");
			}

			const requestError = validateWriteRequest(request);
			if (requestError) {
				return requestError;
			}

			try {
				const parsed = createDeploymentSchema.safeParse(await readJson(request));
				if (!parsed.success) {
					return errorResponse(400, "invalid_request", "The deployment request is invalid");
				}

				const { deployment, created } = await dependencies.repository.createDeploymentWithOutcome({
					...parsed.data,
					deployedAt: dependencies.now().toISOString(),
				});
				dependencies.logger.info("admin_write_completed", {
					requestId,
					route: "/api/admin/deployments",
					result: created ? "created" : "idempotent_replay",
					recordType: "deployment",
					durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
				});
				return successResponse({ deployment }, created ? 201 : 200);
			} catch (error) {
				if (error instanceof SyntaxError) {
					return errorResponse(400, "invalid_json", "The request body must be valid JSON");
				}
				if (error instanceof RepositoryConflictError) {
					return errorResponse(409, "conflict", "The idempotency key is already in use");
				}
				if (error instanceof RepositoryNotFoundError) {
					return errorResponse(404, "service_not_found", "The service was not found");
				}
				dependencies.logger.error("admin_write_failed", {
					requestId,
					route: "/api/admin/deployments",
					result: "failed",
					recordType: "deployment",
					durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
				});
				return errorResponse(500, "internal_error", "The operation could not be completed");
			}
		},

		async createIncident(request: Request): Promise<Response> {
			const requestId = crypto.randomUUID();
			const startedAt = performance.now();
			try {
				await dependencies.authorize(request);
			} catch (error) {
				if (error instanceof AccessUnauthorizedError) {
					return errorResponse(401, "unauthorized", "Access could not be verified");
				}
				return errorResponse(500, "internal_error", "The operation could not be completed");
			}

			const requestError = validateWriteRequest(request);
			if (requestError) {
				return requestError;
			}

			try {
				const parsed = createIncidentSchema.safeParse(await readJson(request));
				if (!parsed.success) {
					return errorResponse(400, "invalid_request", "The incident request is invalid");
				}

				const incident = await dependencies.repository.createIncident({
					...parsed.data,
					startedAt: dependencies.now().toISOString(),
				});
				dependencies.logger.info("admin_write_completed", {
					requestId,
					route: "/api/admin/incidents",
					result: "created",
					recordType: "incident",
					durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
				});
				return successResponse({ incident }, 201);
			} catch (error) {
				if (error instanceof SyntaxError) {
					return errorResponse(400, "invalid_json", "The request body must be valid JSON");
				}
				if (error instanceof RepositoryNotFoundError) {
					return errorResponse(404, "service_not_found", "The service was not found");
				}
				dependencies.logger.error("admin_write_failed", {
					requestId,
					route: "/api/admin/incidents",
					result: "failed",
					recordType: "incident",
					durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
				});
				return errorResponse(500, "internal_error", "The operation could not be completed");
			}
		},

		async resolveIncident(request: Request, idParameter: string): Promise<Response> {
			const requestId = crypto.randomUUID();
			const startedAt = performance.now();
			try {
				await dependencies.authorize(request);
			} catch (error) {
				if (error instanceof AccessUnauthorizedError) {
					return errorResponse(401, "unauthorized", "Access could not be verified");
				}
				return errorResponse(500, "internal_error", "The operation could not be completed");
			}

			const requestError = validateWriteRequest(request);
			if (requestError) {
				return requestError;
			}

			try {
				const id = incidentIdSchema.safeParse(idParameter);
				const body = resolveIncidentSchema.safeParse(await readJson(request));
				if (!id.success || !body.success) {
					return errorResponse(400, "invalid_request", "The incident resolution request is invalid");
				}

				const incident = await dependencies.repository.resolveIncident(
					id.data,
					dependencies.now().toISOString(),
				);
				dependencies.logger.info("admin_write_completed", {
					requestId,
					route: "/api/admin/incidents/:id",
					result: "resolved",
					recordType: "incident",
					durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
				});
				return successResponse({ incident }, 200);
			} catch (error) {
				if (error instanceof SyntaxError) {
					return errorResponse(400, "invalid_json", "The request body must be valid JSON");
				}
				if (error instanceof RepositoryNotFoundError) {
					return errorResponse(404, "incident_not_found", "The incident was not found");
				}
				if (error instanceof RepositoryConflictError) {
					return errorResponse(409, "conflict", "The incident is not open");
				}
				dependencies.logger.error("admin_write_failed", {
					requestId,
					route: "/api/admin/incidents/:id",
					result: "failed",
					recordType: "incident",
					durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
				});
				return errorResponse(500, "internal_error", "The operation could not be completed");
			}
		},
	};
}
