import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { AccessUnauthorizedError, requireAccessIdentity } from "../../src/lib/auth/access";

const productionConfig = {
	NODE_ENV: "production",
	ACCESS_TEAM_DOMAIN: "https://portfolio-test.cloudflareaccess.com",
	ACCESS_AUD: "edgeops-test-audience",
	LOCAL_ACCESS_BYPASS: "false",
};

let privateKey: CryptoKey;
let untrustedPrivateKey: CryptoKey;
let localKeySet: ReturnType<typeof createLocalJWKSet>;

beforeAll(async () => {
	const keyPair = await generateKeyPair("RS256", { extractable: true });
	privateKey = keyPair.privateKey;
	untrustedPrivateKey = (await generateKeyPair("RS256")).privateKey;
	const publicJwk = await exportJWK(keyPair.publicKey);
	localKeySet = createLocalJWKSet({
		keys: [{ ...publicJwk, alg: "RS256", kid: "test-key", use: "sig" }],
	});
});

async function signAccessToken(
	overrides: { issuer?: string; audience?: string | string[]; expiresAt?: number } = {},
) {
	const now = Math.floor(Date.now() / 1000);
	return new SignJWT({ sub: "user-123", email: "never-return@example.com" })
		.setProtectedHeader({ alg: "RS256", kid: "test-key" })
		.setIssuer(overrides.issuer ?? productionConfig.ACCESS_TEAM_DOMAIN)
		.setAudience(overrides.audience ?? productionConfig.ACCESS_AUD)
		.setIssuedAt(now)
		.setExpirationTime(overrides.expiresAt ?? now + 300)
		.sign(privateKey);
}

function requestWithToken(token: string) {
	return new Request("https://edgeops.example/admin", {
		headers: { "CF-Access-Jwt-Assertion": token },
	});
}

describe("requireAccessIdentity", () => {
	it("rejects a request without the Access JWT header", async () => {
		const request = new Request("https://edgeops.example/admin");

		await expect(requireAccessIdentity(request, productionConfig)).rejects.toBeInstanceOf(AccessUnauthorizedError);
	});

	it("allows the explicit bypass only outside production", async () => {
		const request = new Request("http://127.0.0.1:8787/admin");

		await expect(
			requireAccessIdentity(request, {
				NODE_ENV: "development",
				LOCAL_ACCESS_BYPASS: "true",
			}),
		).resolves.toEqual({ authenticated: true, subject: "local-development" });
	});

	it("ignores the local bypass flag in production", async () => {
		const request = new Request("https://edgeops.example/admin");

		await expect(
			requireAccessIdentity(request, {
				...productionConfig,
				LOCAL_ACCESS_BYPASS: "true",
			}),
		).rejects.toBeInstanceOf(AccessUnauthorizedError);
	});

	it("rejects a JWT from the wrong issuer", async () => {
		const token = await signAccessToken({ issuer: "https://wrong.cloudflareaccess.com" });

		await expect(
			requireAccessIdentity(requestWithToken(token), productionConfig, { keySet: localKeySet }),
		).rejects.toBeInstanceOf(AccessUnauthorizedError);
	});

	it("rejects a JWT with the wrong audience", async () => {
		const token = await signAccessToken({ audience: "another-application" });

		await expect(
			requireAccessIdentity(requestWithToken(token), productionConfig, { keySet: localKeySet }),
		).rejects.toBeInstanceOf(AccessUnauthorizedError);
	});

	it("rejects an expired JWT", async () => {
		const token = await signAccessToken({ expiresAt: Math.floor(Date.now() / 1000) - 1 });

		await expect(
			requireAccessIdentity(requestWithToken(token), productionConfig, { keySet: localKeySet }),
		).rejects.toBeInstanceOf(AccessUnauthorizedError);
	});

	it("rejects a JWT with an invalid signature", async () => {
		const now = Math.floor(Date.now() / 1000);
		const token = await new SignJWT({ sub: "user-123" })
			.setProtectedHeader({ alg: "RS256", kid: "test-key" })
			.setIssuer(productionConfig.ACCESS_TEAM_DOMAIN)
			.setAudience(productionConfig.ACCESS_AUD)
			.setIssuedAt(now)
			.setExpirationTime(now + 300)
			.sign(untrustedPrivateKey);

		await expect(
			requireAccessIdentity(requestWithToken(token), productionConfig, { keySet: localKeySet }),
		).rejects.toBeInstanceOf(AccessUnauthorizedError);
	});

	it("fails closed when the production Access configuration is incomplete", async () => {
		const token = await signAccessToken();

		await expect(
			requireAccessIdentity(
				requestWithToken(token),
				{ NODE_ENV: "production", ACCESS_AUD: productionConfig.ACCESS_AUD },
				{ keySet: localKeySet },
			),
		).rejects.toBeInstanceOf(AccessUnauthorizedError);
	});

	it("rejects a validly signed JWT without a subject", async () => {
		const now = Math.floor(Date.now() / 1000);
		const token = await new SignJWT({})
			.setProtectedHeader({ alg: "RS256", kid: "test-key" })
			.setIssuer(productionConfig.ACCESS_TEAM_DOMAIN)
			.setAudience(productionConfig.ACCESS_AUD)
			.setIssuedAt(now)
			.setExpirationTime(now + 300)
			.sign(privateKey);

		await expect(
			requireAccessIdentity(requestWithToken(token), productionConfig, { keySet: localKeySet }),
		).rejects.toBeInstanceOf(AccessUnauthorizedError);
	});

	it("accepts a valid Access JWT and returns only the minimal identity", async () => {
		const token = await signAccessToken();

		await expect(
			requireAccessIdentity(requestWithToken(token), productionConfig, { keySet: localKeySet }),
		).resolves.toEqual({ authenticated: true, subject: "user-123" });
	});
});
