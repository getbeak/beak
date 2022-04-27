module.exports = {
	name: '',
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: [
		'<rootDir>/jest-setup.ts',
	],
	projects: [
		'<rootDir>/packages/apps/*',
		'<rootDir>/packages/hosts/*',
		'<rootDir>/packages/shared/*',
	],
	transform: {
		'^.+\\.tsx?$': 'esbuild-jest',
	},
};
