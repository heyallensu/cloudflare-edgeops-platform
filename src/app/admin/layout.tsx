import { headers } from "next/headers";
import { unauthorized } from "next/navigation";
import {
	AccessUnauthorizedError,
	accessConfigFromEnvironment,
	requireAccessIdentity,
} from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const requestHeaders = await headers();
	const request = new Request("https://edgeops.invalid/admin", {
		headers: new Headers(requestHeaders),
	});

	try {
		await requireAccessIdentity(request, accessConfigFromEnvironment());
	} catch (error) {
		if (error instanceof AccessUnauthorizedError) {
			unauthorized();
		}
		throw error;
	}

	return children;
}
