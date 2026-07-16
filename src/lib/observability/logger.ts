export type LogFieldValue = string | number | boolean | null;
export type LogFields = Record<string, LogFieldValue>;

export interface StructuredLogger {
	info(event: string, fields: LogFields): void;
	error(event: string, fields: LogFields): void;
}

function write(level: "info" | "error", event: string, fields: LogFields): void {
	const entry = JSON.stringify({ level, event, ...fields });
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
