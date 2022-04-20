import supersecretFile from './supersecret-file';

/*
	This sounds pretty stupid, but bare with me. Standard migrations happen once, and then
	are reflected in visible files, so other team members don't need to worry.

	However some migrations change "silent" files, which needs to happen everywhere,
	otherwise the project will fail to open.

	𝓼𝓲𝓵𝓮𝓷𝓽 𝓶𝓲𝓰𝓻𝓪𝓽𝓲𝓸𝓷𝓼
*/

export default async function checkAndHandleSilentMigrations(projectFolder: string) {
	await supersecretFile(projectFolder);
}
