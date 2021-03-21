import { faApple, faLinux,faWindows } from '@fortawesome/free-brands-svg-icons';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ScrollTarget from 'packages/website/src/components/atoms/ScrollTarget';
import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import UAParser from 'ua-parser-js';

import Container from '../../../components/atoms/Container';
import { SubTitle, Title } from '../../../components/atoms/Typography';
import downloadsFetcher, { buildsRepoBaseUrl, Downloads } from '../api/fetcher';

const Downloader: React.FunctionComponent = () => {
	const theme = useTheme();
	const [downloads, setDownloads] = useState<Downloads>();

	useEffect(() => {
		downloadsFetcher().then(response => {
			setDownloads(response);
		});
	}, []);

	useEffect(() => {
		const ua = new UAParser(window.navigator.userAgent);
		const os = ua.getOS();
	}, [window.navigator.userAgent]);

	if (!downloads)
		return null;

	function getSiliconDownloadPath() {
		const armFile = downloads!.macOS!.files.find(f => f.url.endsWith('arm64-mac.zip'));

		return `${buildsRepoBaseUrl}/${armFile?.url}`;
	}

	return (
		<Wrapper>
			<ScrollTarget target={'downloads'} />

			<Container>
				<Title>{'Download'}</Title>
				<SubTitle>{'Grab the freshest build of Beak for whatever device you own'}</SubTitle>

				<Grid>
					<Platform>
						<FontAwesomeIcon
							icon={faApple}
							size={'4x'}
						/>

						<DownloadButton href={downloads.macOS!.downloadPath}>
							<FontAwesomeIcon icon={faDownload} color={theme.ui.textOnAction} />
							{'Download for Mac (Intel)'}
						</DownloadButton>
						<SiliconExplainer>{'👆 Most common'}</SiliconExplainer>
						<DownloadButton href={getSiliconDownloadPath()}>
							<FontAwesomeIcon icon={faDownload} color={theme.ui.textOnAction} />
							{'Download for Mac (Silicon)'}
						</DownloadButton>
					</Platform>
					<Platform>
						<FontAwesomeIcon
							icon={faWindows}
							size={'4x'}
						/>

						<DownloadButton href={downloads.windows!.path}>
							<FontAwesomeIcon icon={faDownload} color={theme.ui.textOnAction} />
							{'Download for Windows'}
						</DownloadButton>
					</Platform>
					<Platform>
						<FontAwesomeIcon
							icon={faLinux}
							size={'4x'}
						/>

						<DownloadButton href={downloads.linux!.path}>
							<FontAwesomeIcon icon={faDownload} color={theme.ui.textOnAction} />
							{'Download for Linux'}
						</DownloadButton>
					</Platform>
				</Grid>
			</Container>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	margin-bottom: 60px;
	text-align: center;
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	column-gap: 25px;

	margin-top: 40px;
`;

const Platform = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 25px;

	> svg {
		margin-bottom: 15px;
	}
`;

const DownloadButton = styled.a`
	margin-top: 10px;
	padding: 10px 20px;
	width: calc(100% - 40px);
	text-align: center;

	border-radius: 10px;
	background: ${p => p.theme.ui.primaryFill};
	color: ${p => p.theme.ui.textOnAction};
	text-decoration: none;

	> svg {
		margin-right: 5px;
	}
`;

const SiliconExplainer = styled.div`
	margin-top: 5px;
	margin-bottom: 10px;
	text-transform: uppercase;
	font-weight: 600;
	font-size: 14px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;

export default Downloader;
