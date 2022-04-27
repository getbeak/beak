import React from 'react';
import ScrollTarget from '@beak/app-website/components/atoms/ScrollTarget';
import { faApple } from '@fortawesome/free-brands-svg-icons/faApple';
import { faLinux } from '@fortawesome/free-brands-svg-icons/faLinux';
import { faWindows } from '@fortawesome/free-brands-svg-icons/faWindows';
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled, { useTheme } from 'styled-components';

import Container from '../../../components/atoms/Container';
import { SubTitle, Title } from '../../../components/atoms/Typography';
import useDownloadLinks from '../hooks/use-download-links';

const Downloader: React.FC<React.PropsWithChildren<unknown>> = () => {
	const theme = useTheme();
	const { downloads, getSiliconDownloadPath } = useDownloadLinks();

	if (!downloads)
		return null;

	return (
		<Wrapper>
			<ScrollTarget target={'downloads'} />

			<Container>
				<BadgedTitle>
					{'Download'}
				</BadgedTitle>
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

						<DownloadButton href={downloads.windows!.downloadPath}>
							<FontAwesomeIcon icon={faDownload} color={theme.ui.textOnAction} />
							{'Download for Windows'}
						</DownloadButton>
					</Platform>
					<Platform>
						<FontAwesomeIcon
							icon={faLinux}
							size={'4x'}
						/>

						<DownloadButton href={downloads.linux!.downloadPath}>
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
	margin: min(3vw, 60px) 0;
	text-align: center;
`;

const BadgedTitle = styled(Title)`
	position: relative;
	width: fit-content;
	margin: 0 auto;
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
