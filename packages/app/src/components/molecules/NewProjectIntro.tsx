import React from 'react';
import { useDispatch } from 'react-redux';
import { ipcExplorerService } from '@beak/app/lib/ipc';
import { defaultOrCreateRequest } from '@beak/app/store/project/actions';
import styled from 'styled-components';

import Button from '../atoms/Button';

const NewProjectIntro: React.FC<React.PropsWithChildren<unknown>> = () => {
	const dispatch = useDispatch();

	return (
		<Wrapper>
			<WelcomeBanner>
				<WelcomeBannerBody>
					<WelcomeBannerTitle>{'Beak'}</WelcomeBannerTitle>
					<WelcomeBannerSummary>
						{'Welcome to your Beak project. Beak\'s provides comprehensive a '}
						{'toolkit that will make building, editing, testing, and '}
						{'researching API\'s super simple. Click the button below to get '}
						{'started with making a request, or you can browse the guides below '}
						{'to learn more about the features Beak has to offer.'}
					</WelcomeBannerSummary>
					<Button onClick={() => dispatch(defaultOrCreateRequest())}>{'Get started'}</Button>
				</WelcomeBannerBody>
			</WelcomeBanner>

			<Guides>
				<GuidesTitle>{'Learn how to get the most out of Beak'}</GuidesTitle>
				<GuidesGrid>
					<GuidesGridItem>
						<GuidesGridItemTitle>{'Visit the documentation'}</GuidesGridItemTitle>
						<GuidesGridItemBody>
							{'Read and explore about all the features that Beak has to offer.'}
						</GuidesGridItemBody>
						<Button onClick={() => ipcExplorerService.launchUrl('https://docs.getbeak.app/')}>
							{'View Beak manual'}
						</Button>
					</GuidesGridItem>
					<GuidesGridItem>
						<GuidesGridItemTitle>{'Variable groups'}</GuidesGridItemTitle>
						<GuidesGridItemBody>
							{'Easily share common values between requests, and group them '}
							{'by trait.'}
						</GuidesGridItemBody>
						<Button onClick={() => ipcExplorerService.launchUrl('https://getbeak.notion.site/Variable-groups-b5e2083aa597496b89006e1a48acf5fb')}>
							{'Read docs'}
						</Button>
					</GuidesGridItem>
					<GuidesGridItem>
						<GuidesGridItemTitle>{'Versioning'}</GuidesGridItemTitle>
						<GuidesGridItemBody>
							{'Learn how to easily sync changes to your Beak project with '}
							{'your team or community.'}
						</GuidesGridItemBody>
						<Button onClick={() => ipcExplorerService.launchUrl('https://getbeak.notion.site/Source-control-versioning-aa9b4d423e614148a10f69d42b3bc746')}>
							{'Read docs'}
						</Button>
					</GuidesGridItem>
					<GuidesGridItem>
						<GuidesGridItemTitle>{'Realtime values'}</GuidesGridItemTitle>
						<GuidesGridItemBody>
							{'Body'}
						</GuidesGridItemBody>
						<Button onClick={() => ipcExplorerService.launchUrl('https://getbeak.notion.site/Realtime-values-e569e07fec964859926edcab2a3351ac')}>
							{'Read docs'}
						</Button>
					</GuidesGridItem>
				</GuidesGrid>
			</Guides>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	width: calc(100% - 300px);
	height: calc(100% - 200px);

	padding: 100px 150px;

	align-items: center;
	justify-content: center;
	flex-direction: column;

	background-color: ${props => props.theme.ui.surface};
`;

const WelcomeBanner = styled.div`
	border-radius: 10px;
	padding: 25px 50px;
	background: url('${p => `./images/backgrounds/${p.theme.theme}-waves.jpg`}');
	background-position: center;
	background-size: cover;
	background-repeat: no-repeat;
`;

const WelcomeBannerBody = styled.div`
	max-width: 700px;
`;

const WelcomeBannerTitle = styled.div`
	font-size: 30px;
	font-weight: 300;
	color: ${p => p.theme.ui.textOnAction};
`;

const WelcomeBannerSummary = styled.div`
	font-size: 15px;
	margin-top: 15px;
	margin-bottom: 15px;
	color: ${p => p.theme.ui.textOnAction};
`;

const Guides = styled.div`
	margin-top: 30px;
`;

const GuidesTitle = styled.div`
	font-size: 20px;
	margin-bottom: 10px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;

const GuidesGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	column-gap: 40px;
	row-gap: 30px;
`;

const GuidesGridItem = styled.div`
	background: ${p => p.theme.ui.surfaceFill};
	border: 1px solid ${p => p.theme.ui.surfaceBorderSeparator};
	border-radius: 5px;
	padding: 15px 20px;
`;

const GuidesGridItemTitle = styled.div`
	font-size: 20px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;

const GuidesGridItemBody = styled.div`
	font-size: 15px;
	margin-top: 10px;
	margin-bottom: 10px;
	color: ${p => p.theme.ui.textMinor};
`;

export default NewProjectIntro;
