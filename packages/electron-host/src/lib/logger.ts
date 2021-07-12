/* eslint-disable no-sync */
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { ILogObject, Logger } from 'tslog';

const logger = new Logger({ name: 'electron-host' });

logger.attachTransport({
	silly: logToFileSystem,
	debug: logToFileSystem,
	trace: logToFileSystem,
	info: logToFileSystem,
	warn: logToFileSystem,
	error: logToFileSystem,
	fatal: logToFileSystem,
}, 'warn');

function logToFileSystem(obj: ILogObject) {
	const now = new Date();
	const year = now.getUTCFullYear();
	const month = now.getUTCMonth() + 1;
	const logDir = path.join(app.getPath('userData'), 'logs', 'main');
	const logFilePath = path.join(logDir, `${year}-${month}.txt`);

	if (!fs.existsSync(logDir))
		fs.mkdirSync(logDir, { recursive: true });

	fs.appendFileSync(logFilePath, `${JSON.stringify(obj)}\n`);
}

export default logger;
