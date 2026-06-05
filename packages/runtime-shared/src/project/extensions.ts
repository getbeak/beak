import { BeakBase } from '../base';

export default class BeakExtensions extends BeakBase {
	createPackageJsonContent(name: string) {
		const slug = name
			.toString()
			.normalize('NFKD')
			.toLowerCase()
			.trim()
			.replace(/\s+/g, '-')
			.replace(/[^\w-]+/g, '')
			.replace(/--+/g, '-');

		return {
			name: `${slug}-extensions`,
			version: '1.0.0',
			private: true,
			dependencies: {},
		};
	}

	createReadmeContent(name: string) {
		return [
			`# ${name} extensions`,
			'',
			'Extensions for this project are installed and managed from inside Beak:',
			'',
			'    Settings → Extensions',
			'',
			'Extensions are npm packages published with a `"beak": { "apiVersion": 1 }` field in their `package.json`. Beak fetches them straight from the npm registry — no Node, yarn, or pnpm installation required on your machine.',
			'',
			'## Authoring an extension',
			'',
			'See [@getbeak/extension-sdk](https://www.npmjs.com/package/@getbeak/extension-sdk) for the authoring contract.',
			'',
		].join('\n');
	}
}
