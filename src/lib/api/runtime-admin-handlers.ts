import { accessConfigFromEnvironment, requireAccessIdentity } from "../auth/access";
import { OperationsRepository } from "../db/repository";
import { consoleLogger } from "../observability/logger";
import { createAdminHandlers } from "./admin-handlers";

export function createRuntimeAdminHandlers(db: D1Database) {
	return createAdminHandlers({
		repository: new OperationsRepository(db),
		authorize: (request) => requireAccessIdentity(request, accessConfigFromEnvironment()),
		now: () => new Date(),
		logger: consoleLogger,
	});
}
