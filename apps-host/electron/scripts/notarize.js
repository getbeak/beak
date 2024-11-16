/* eslint-disable @typescript-eslint/no-var-requires */
const { notarize } = require('@electron/notarize');
const path = require('path');

module.exports = async function notarizing(context) {
	const { electronPlatformName, appOutDir } = context;

	if (electronPlatformName !== 'darwin')
		return;

	const appName = context.packager.appInfo.productFilename;
	const appFilePath = path.join(appOutDir, `${appName}.app`);

	await notarize({
		tool: 'notarytool',
		appleId: process.env.APPLE_ID,
		appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
		teamId: process.env.APPLE_TEAM_ID,
		appPath: appFilePath,
	});
};
