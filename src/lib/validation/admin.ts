import { z } from "zod";

const serviceId = z
	.string()
	.trim()
	.min(2)
	.max(48)
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase service identifier");

export const createDeploymentSchema = z
	.object({
		idempotencyKey: z.string().trim().min(8).max(80).regex(/^[A-Za-z0-9._:-]+$/),
		serviceId,
		version: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9][A-Za-z0-9._+-]*$/),
		commitSha: z.string().trim().regex(/^[0-9a-f]{7,12}$/),
		result: z.enum(["succeeded", "failed", "rolled_back"]),
	})
	.strict();

export const createIncidentSchema = z
	.object({
		serviceId,
		title: z.string().trim().min(3).max(160),
	})
	.strict();

export const resolveIncidentSchema = z.object({ status: z.literal("resolved") }).strict();

export const incidentIdSchema = z.coerce.number().int().positive();
