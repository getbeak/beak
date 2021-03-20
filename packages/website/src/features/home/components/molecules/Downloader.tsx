import { faApple, faLinux,faWindows } from '@fortawesome/free-brands-svg-icons';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ScrollTarget from 'packages/website/src/components/atoms/ScrollTarget';
import React, { useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import UAParser from 'ua-parser-js';

import Container from '../../../../components/atoms/Container';
import { SubTitle, Title } from '../../../../components/atoms/Typography';

const Downloader: React.FunctionComponent = () => {
	const theme = useTheme();

	useEffect(() => {
		const ua = new UAParser(window.navigator.userAgent);
		const os = ua.getOS();
	}, [window.navigator.userAgent]);

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

						<DownloadButton href={'#download'}>
							<FontAwesomeIcon icon={faDownload} color={theme.ui.textOnAction} />
							{'Download for Mac (Intel)'}
						</DownloadButton>
						<SiliconExplainer>{'👆 Most common'}</SiliconExplainer>
						<DownloadButton href={'#download'}>
							<FontAwesomeIcon icon={faDownload} color={theme.ui.textOnAction} />
							{'Download for Mac (Silicon)'}
						</DownloadButton>
					</Platform>
					<Platform>
						<FontAwesomeIcon
							icon={faWindows}
							size={'4x'}
						/>

						<DownloadButton href={'#download'}>
							<FontAwesomeIcon icon={faDownload} color={theme.ui.textOnAction} />
							{'Download for Windows'}
						</DownloadButton>
					</Platform>
					<Platform>
						<FontAwesomeIcon
							icon={faLinux}
							size={'4x'}
						/>

						<DownloadButton href={'#download'}>
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
	border-radius: 10px;
	padding: 10px 20px;
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
