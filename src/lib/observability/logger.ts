export type LogFieldValue = string | number | boolean | null;
export interface LogFields {
	status?: LogFieldValue;
	durationMs?: LogFieldValue;
	d1Status?: LogFieldValue;
	d1DurationMs?: LogFieldValue;
	requestId?: LogFieldValue;
	route?: LogFieldValue;
	result?: LogFieldValue;
	recordType?: LogFieldValue;
}

export interface StructuredLogger {
	info(event: string, fields: LogFields): void;
	error(event: string, fields: LogFields): void;
}

function write(level: "info" | "error", event: string, fields: LogFields): void {
	const entry = JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...fields });
	if (level === "error") {
		console.error(entry);
		return;
	}
	console.log(entry);
}

export const consoleLogger: StructuredLogger = {
	info(event, fields) {
		write("info", event, fields);
	},
	error(event, fields) {
		write("error", event, fields);
	},
};
