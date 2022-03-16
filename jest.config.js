module.exports = {
	name: '',
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: [
		'<rootDir>/jest-setup.ts',
	],
	projects: [
		'<rootDir>/packages/*',
	],
	transform: {
		'^.+\\.tsx?$': 'esbuild-jest',
	},
};
