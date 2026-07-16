import { afterEach, describe, expect, it, vi } from "vitest";
import { consoleLogger } from "../../src/lib/observability/logger";

describe("consoleLogger", () => {
	afterEach(() => vi.restoreAllMocks());

	it("emits one parseable JSON object per event", () => {
		const output = vi.spyOn(console, "log").mockImplementation(() => undefined);

		consoleLogger.info("health_check_completed", {
			status: "ok",
			durationMs: 5,
			d1Status: "ok",
		});

		expect(output).toHaveBeenCalledTimes(1);
		expect(JSON.parse(String(output.mock.calls[0][0]))).toEqual({
			level: "info",
			event: "health_check_completed",
			status: "ok",
			durationMs: 5,
			d1Status: "ok",
		});
	});
});
