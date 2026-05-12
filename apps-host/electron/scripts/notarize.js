/* eslint-disable @typescript-eslint/no-var-requires */

import path from 'node:path';
import { notarize } from '@electron/notarize';

export default async function notarizing(context) {
	const { electronPlatformName, appOutDir } = context;

	if (electronPlatformName !== 'darwin') return;

	const appName = context.packager.appInfo.productFilename;
	const appFilePath = path.join(appOutDir, `${appName}.app`);

	await notarize({
		tool: 'notarytool',
		appleId: process.env.APPLE_ID,
		appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
		teamId: process.env.APPLE_TEAM_ID,
		appPath: appFilePath,
	});
}
