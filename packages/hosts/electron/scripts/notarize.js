/* eslint-disable @typescript-eslint/no-var-requires */
const { notarize } = require('electron-notarize');
const path = require('path');

exports.default = async function notarizing(context) {
	const { electronPlatformName, appOutDir } = context;

	if (electronPlatformName !== 'darwin')
		return;

	const appName = context.packager.appInfo.productFilename;
	const appFilePath = path.join(appOutDir, `${appName}.app`);

	await notarize({
		appBundleId: 'app.getbeak.beak',
		appPath: appFilePath,
		appleId: process.env.APPLE_ID,
		appleIdPassword: process.env.APPLE_ID_PASSWORD,
		ascProvider: process.env.ASC_PROVIDER,
	});
};
