import { useEffect, useState } from 'react';

import downloadsFetcher, { buildsRepoBaseUrl, type Downloads } from './fetcher';

export default function useDownloadLinks() {
	const [downloads, setDownloads] = useState<Downloads>();

	useEffect(() => {
		downloadsFetcher().then(response => {
			setDownloads(response);
		});
	}, []);

	function getSiliconDownloadPath() {
		const armFile = downloads!.macOS!.files.find(f => f.url.endsWith('arm64-mac.zip'));

		if (!armFile) return '#silicon-download-missing';

		return `${buildsRepoBaseUrl}/${armFile?.url}`;
	}

	return { downloads, getSiliconDownloadPath };
}
