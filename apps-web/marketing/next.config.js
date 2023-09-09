/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ['@beak/design-system'],
	compiler: {
		styledComponents: true,
	},
};

module.exports = nextConfig;
