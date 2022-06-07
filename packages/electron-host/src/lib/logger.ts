/* eslint-disable no-sync */
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { ILogObject, Logger } from 'tslog';

const logger = new Logger({ name: 'electron-host' });

logger.attachTransport({
	silly: obj => logToFileSystem(obj, 'main'),
	debug: obj => logToFileSystem(obj, 'main'),
	trace: obj => logToFileSystem(obj, 'main'),
	info: obj => logToFileSystem(obj, 'main'),
	warn: obj => logToFileSystem(obj, 'main'),
	error: obj => logToFileSystem(obj, 'main'),
	fatal: obj => logToFileSystem(obj, 'main'),
}, 'info');

export function logToFileSystem(obj: ILogObject, logName: string) {
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
