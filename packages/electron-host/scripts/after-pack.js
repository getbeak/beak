/* eslint-disable no-sync */
/* eslint-disable @typescript-eslint/no-var-requires */
const asar = require('asar');
const path = require('path');
const fs = require('fs');
const os = require('os');

const architectures = ['ia32', 'x64', 'armv7l', 'arm64', 'universal'];

exports.default = async function afterPack(context) {
	const arch = architectures[context.arch];
	const platform = context.packager.platform.nodeName;
	const tempDirPath = path.join(os.tmpdir(), Date.now().toString());
	const asarPath = path.join(context.appOutDir, 'Beak.app', 'Contents', 'Resources', 'app.asar');
	const nativeKeytarDir = path.join(__dirname, '..', '..', '..', 'native', 'keytar');
	const nativeKeytarPath = path.join(nativeKeytarDir, generateKeytarFilename(arch, platform));
	const asarKeytarPath = path.join(tempDirPath, 'dist', 'main', 'keytar.node');

	fs.mkdirSync(tempDirPath);
	asar.extractAll(asarPath, tempDirPath);
	fs.copyFileSync(nativeKeytarPath, asarKeytarPath);
	fs.rmSync(asarPath);

	await asar.createPackage(tempDirPath, asarPath);

	console.log(`Injected platform specific keytar for ${platform}-${arch}`);
};

function generateKeytarFilename(arch, platform) {
	switch (platform) {
		case 'darwin': {
			if (arch === 'arm64')
				return 'darwin-arm64-keytar.node';
			else if (arch === 'x64')
				return 'darwin-keytar.node';

			break;
		}

		case 'linux': {
			if (arch === 'x64')
				return 'linux-x64-keytar.node';

			break;
		}

		case 'win32': {
			if (arch === 'x64')
				return 'win-x64-keytar.node';

			break;
		}

		default:
			throw new Error(`Unknown platform ${platform}`);
	}

	throw new Error(`Unsupported platform (${platform}) arch (${arch})`);
}
