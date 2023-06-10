import { BeakBase } from '../base';

export default class BeakExtensions extends BeakBase {
	createPackageJsonContent(name: string) {
		const slug = name.toString()
			.normalize('NFKD')
			.toLowerCase()
			.trim()
			.replace(/\s+/g, '-')
			.replace(/[^\w-]+/g, '')
			.replace(/--+/g, '-');

		return {
			name: `${slug}-extensions`,
			version: '1.0.0',
			dependencies: {},
		};
	}

	createReadmeContent(name: string) {
		return [
			`# ${name} extensions`,
			'',
			'Your Beak extensions live here, you can use the `package.json` to manage the versioning and updating of extensions. Extension management be exposed inside Beak\'s interface soon.',
			'',
			'## Getting started',
			'Below are some useful resources for getting started with Beak\'s extensions',
			'- [Extensions manual](https://getbeak.notion.site/Extensions-realtime-values-4c16ca640b35460787056f8be815b904)',
			'- [GitHub extension template](https://github.com/getbeak/realtime-value-extension-template)',
			'',
		].join('\n');
	}
}
