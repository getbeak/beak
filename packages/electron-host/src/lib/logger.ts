/* eslint-disable no-sync */
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { Logger } from 'tslog';
import { ILogObjMeta } from 'tslog/dist/types/interfaces';

export type LogLevel =
	| 'silly'
	| 'trace'
	| 'debug'
	| 'info'
	| 'warn'
	| 'error'
	| 'fatal';

const logger = new Logger({ name: 'electron-host' });

logger.attachTransport(logObj => {
	logToFileSystem(logObj, 'main');
});

export function logToFileSystem(obj: ILogObjMeta, logName: string) {
	const now = new Date();
	const year = now.getUTCFullYear();
	const month = now.getUTCMonth() + 1;
	const logDir = path.join(app.getPath('userData'), 'logs', logName);
	const logFilePath = path.join(logDir, `${year}-${month}.txt`);

	if (!fs.existsSync(logDir))
		fs.mkdirSync(logDir, { recursive: true });

	fs.appendFileSync(logFilePath, `${JSON.stringify(obj)}\n`);
}

export default logger;
