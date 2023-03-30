import { CreatePagesArgs } from 'gatsby';

export async function createPages({ actions }: CreatePagesArgs) {
	const { createRedirect } = actions;

	createRedirect({
		fromPath: '/terms',
		toPath: '/legal/terms',
	});

	createRedirect({
		fromPath: '/privacy',
		toPath: '/legal/privacy',
	});
}
