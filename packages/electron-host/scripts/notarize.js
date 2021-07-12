/* eslint-disable @typescript-eslint/no-var-requires */
const { notarize } = require('electron-notarize');
const AdmZip = require('adm-zip');
const path = require('path');

exports.default = async function notarizing(context) {
	const { electronPlatformName, appOutDir } = context;

	if (electronPlatformName !== 'darwin')
		return void 0;

	const appName = context.packager.appInfo.productFilename;
	const appFilePath = path.join(appOutDir, `${appName}.app`);

	await notarize({
		appBundleId: 'app.getbeak.beak',
		appPath: appFilePath,
		appleId: process.env.APPLE_ID,
		appleIdPassword: process.env.APPLE_ID_PASSWORD,
		ascProvider: process.env.ASC_PROVIDER,
	});

	const archive = new AdmZip();
	const zipFilePath = path.join(appOutDir, `${appName}.zip`);

	archive.addLocalFolder(appFilePath);
	archive.writeZip(zipFilePath);
};
