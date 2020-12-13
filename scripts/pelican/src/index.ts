import fs from 'fs-extra';
import fetch from 'node-fetch';
import path from 'path';
import process from 'process';
import { Logger } from 'tslog';

import { ReleaseFile } from './types';

const logger = new Logger();
const allowedExtensions = ['.exe', '.dmg'];
const ACCOUNT = process.env.BEAK_KEYGEN_ACCOUNT_ID;
const PRODUCT = process.env.BEAK_KEYGEN_PRODUCT_ID;
const ADMIN_TOKEN = process.env.BEAK_KEYGEN_USER_TOKEN;

await main();

async function main() {
	if (!ACCOUNT || !PRODUCT || !ADMIN_TOKEN)
		throw new Error('Keygen environment variables missing!');

	const releases = await setupReleaseFolder();

	await deployReleases(releases);
}

async function setupReleaseFolder(): Promise<ReleaseFile[]> {
	const wd = process.cwd();
	const electronDist = path.join(wd, '../..', 'packages', 'electron-host', 'dist-electron');
	const releasePath = path.join(electronDist, 'release');

	await fs.remove(releasePath);
	await fs.ensureDir(releasePath);

	const distFiles = await fs.readdir(electronDist);
	const binaries = await Promise.all(distFiles.map(async f => {
		const fullPath = path.join(electronDist, f);
		const stat = await fs.stat(fullPath);

		if (!stat.isFile())
			return null;

		const ext = path.extname(f);

		return allowedExtensions.includes(ext) ? fullPath : null;
	}));

	const realBinaryPaths = binaries.filter(Boolean) as string[];

	await Promise.all(realBinaryPaths.map(async f => {
		const name = path.basename(f);

		await fs.copyFile(f, path.join(releasePath, name));
	}));

	return realBinaryPaths.map(filePath => {
		const ext = path.extname(filePath);

		if (!allowedExtensions.includes(ext))
			throw new Error(`Unsupported extension ${ext}`);

		const platform = ext === '.exe' ? 'windows' : 'macos';

		logger.info(`New release for ${platform} detected`);

		return { platform, filePath };
	});
}

async function deployReleases(releases: ReleaseFile[]) {
	const version = await getBeakAppVersion();
	const identifier = getReleaseIdentifier();

	await Promise.all(releases.map(async r => {
		const { filePath, platform } = r;
		const ext = path.extname(filePath);
		const releaseName = `${version}-${identifier}${ext}`;
		const createUrl = `https://dist.keygen.sh/v1/${ACCOUNT}/${PRODUCT}/releases/${platform}/${version}`;

		logger.info(`Creating new release for @${releaseName}"!`);

		const response = await fetch(createUrl, {
			method: 'post',
			headers: {
				authorization: `Bearer ${ADMIN_TOKEN}`,
				accept: 'application/json',
			},
		});

		const json = await response.json();

		if (!response.ok) {
			logger.error(`Failed to create release for ${releaseName}`, json);

			return;
		}

		logger.info(`Uploading new release for @${releaseName}"!`);

		const releaseFile = await fs.readFile(filePath);
		const resp = await fetch(json.url, {
			method: 'put',
			compress: false,
			body: releaseFile,
		});

		if (!resp.ok) {
			const json = await resp.json();

			logger.error(`Failed to upload release for ${releaseName}`, json);

			return;
		}

		logger.info(`Deployed new release for @${releaseName}"!`);
	}));
}

async function getBeakAppVersion() {
	const wd = process.cwd();
	const beakPackagePath = path.join(wd, '../..', 'packages', 'electron-host', 'package.json');
	const { version } = await fs.readJSON(beakPackagePath);

	return version;
}

function getReleaseIdentifier() {
	const githubHash = process.env.GITHUB_SHA;

	if (githubHash)
		return githubHash.substr(0, 7);

	return 'non+ci+build';
}
