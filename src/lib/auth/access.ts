import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

export type AccessConfigSource = Readonly<Record<string, string | undefined>>;

export interface AccessIdentity {
	authenticated: true;
	subject: string;
}

export class AccessUnauthorizedError extends Error {
	constructor() {
		super("Access identity is required");
		this.name = "AccessUnauthorizedError";
	}
}

export interface AccessVerificationDependencies {
	keySet?: JWTVerifyGetKey;
}

export function accessConfigFromEnvironment(): AccessConfigSource {
	return {
		NODE_ENV: process.env.NODE_ENV,
		ACCESS_TEAM_DOMAIN: process.env.ACCESS_TEAM_DOMAIN,
		ACCESS_AUD: process.env.ACCESS_AUD,
		LOCAL_ACCESS_BYPASS: process.env.LOCAL_ACCESS_BYPASS,
	};
}

const remoteKeySets = new Map<string, JWTVerifyGetKey>();

function parseIssuer(value: string | undefined): string {
	if (!value) {
		throw new AccessUnauthorizedError();
	}

	const issuer = new URL(value);
	if (
		issuer.protocol !== "https:" ||
		issuer.username ||
		issuer.password ||
		issuer.pathname !== "/" ||
		issuer.search ||
		issuer.hash ||
		!issuer.hostname.endsWith(".cloudflareaccess.com")
	) {
		throw new AccessUnauthorizedError();
	}

	return issuer.origin;
}

function getRemoteKeySet(issuer: string): JWTVerifyGetKey {
	const existing = remoteKeySets.get(issuer);
	if (existing) {
		return existing;
	}

	const keySet = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
	remoteKeySets.set(issuer, keySet);
	return keySet;
}

export async function requireAccessIdentity(
	request: Request,
	config: AccessConfigSource,
	dependencies: AccessVerificationDependencies = {},
): Promise<AccessIdentity> {
	if (config.NODE_ENV !== "production" && config.LOCAL_ACCESS_BYPASS === "true") {
		return { authenticated: true, subject: "local-development" };
	}

	const token = request.headers.get("CF-Access-Jwt-Assertion")?.trim();
	if (!token) {
		throw new AccessUnauthorizedError();
	}

	try {
		const issuer = parseIssuer(config.ACCESS_TEAM_DOMAIN);
		const audience = config.ACCESS_AUD?.trim();
		if (!audience) {
			throw new AccessUnauthorizedError();
		}

		const { payload } = await jwtVerify(token, dependencies.keySet ?? getRemoteKeySet(issuer), {
			issuer,
			audience,
			algorithms: ["RS256"],
		});

		if (typeof payload.sub !== "string" || !payload.sub.trim()) {
			throw new AccessUnauthorizedError();
		}

		return { authenticated: true, subject: payload.sub };
	} catch {
		throw new AccessUnauthorizedError();
	}
}
