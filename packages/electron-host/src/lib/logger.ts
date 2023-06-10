/* eslint-disable no-sync */
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { Logger } from 'tslog';

export type LogLevel =
	| 'silly'
	| 'trace'
	| 'debug'
	| 'info'
	| 'warn'
	| 'error'
	| 'fatal';

export function setupLoggerForFsLogging(logger: Logger<unknown>, logDirectoryName: string) {
	logger.attachTransport(logObj => {
		const now = new Date();
		const year = now.getUTCFullYear();
		const month = now.getUTCMonth() + 1;
		const logDir = path.join(app.getPath('userData'), 'logs', logDirectoryName);
		const logFilePath = path.join(logDir, `${year}-${month}.txt`);

		if (!fs.existsSync(logDir))
			fs.mkdirSync(logDir, { recursive: true });

		fs.appendFileSync(logFilePath, `${JSON.stringify(logObj)}\n`);
	});
}
