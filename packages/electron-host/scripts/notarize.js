/* eslint-disable @typescript-eslint/no-var-requires */
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
	const { electronPlatformName, appOutDir } = context;

	if (electronPlatformName !== 'darwin')
		return void 0;

	const appName = context.packager.appInfo.productFilename;

	return await notarize({
		appBundleId: 'app.getbeakk.beak',
		appPath: `${appOutDir}/${appName}.app`,
		appleId: process.env.APPLE_ID,
		appleIdPassword: process.env.APPLE_ID_PASSWORD,
		ascProvider: process.env.APPLE_ITC_PROVIDER,
	});
};
