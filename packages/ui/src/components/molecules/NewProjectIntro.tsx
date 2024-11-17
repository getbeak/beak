import React from 'react';
import { useDispatch } from 'react-redux';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { defaultOrCreateRequest } from '@beak/ui/store/project/actions';
import styled from 'styled-components';

import Button from '../atoms/Button';

const NewProjectIntro: React.FC<React.PropsWithChildren<unknown>> = () => {
	const dispatch = useDispatch();

	return (
		<Wrapper>
			<WelcomeBanner>
				<WelcomeBannerBody>
					<WelcomeBannerTitle>{'Welcome to your Beak project'}</WelcomeBannerTitle>
					<WelcomeBannerSummary>
						{'Welcome to your Beak project. Beak\'s provides a comprehensive'}
						{'toolkit that will make building, editing, testing, and '}
						{'researching API\'s super simple.'}
						<br />
						<br />
						{'Click the button below to get started with making a request, '}
						{'or you can browse the guides below to learn more about the '}
						{'features Beak has to offer.'}
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
						<GuidesGridItemTitle>{'Variable sets'}</GuidesGridItemTitle>
						<GuidesGridItemBody>
							{'Easily share common variables between requests, and group them '}
							{'in sets.'}
						</GuidesGridItemBody>
						<Button onClick={() => ipcExplorerService.launchUrl('https://getbeak.notion.site/Variable-sets-b5e2083aa597496b89006e1a48acf5fb?pvs=74')}>
							{'Read about variable sets'}
						</Button>
					</GuidesGridItem>
					<GuidesGridItem>
						<GuidesGridItemTitle>{'Versioning'}</GuidesGridItemTitle>
						<GuidesGridItemBody>
							{'Learn how to easily sync changes to your Beak project with '}
							{'your team or community.'}
						</GuidesGridItemBody>
						<Button onClick={() => ipcExplorerService.launchUrl('https://getbeak.notion.site/Source-control-versioning-aa9b4d423e614148a10f69d42b3bc746')}>
							{'Read about versioning'}
						</Button>
					</GuidesGridItem>
					<GuidesGridItem>
						<GuidesGridItemTitle>{'Variables'}</GuidesGridItemTitle>
						<GuidesGridItemBody>
							{'Variables can be inserted into your request, and are '}
							{'calculated for every request.'}
						</GuidesGridItemBody>
						<Button onClick={() => ipcExplorerService.launchUrl('https://www.notion.so/getbeak/Variables-e569e07fec964859926edcab2a3351ac')}>
							{'Read more'}
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

	overflow-y: scroll;
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
	font-weight: 400;
	color: ${p => p.theme.ui.textOnAction};
`;

const WelcomeBannerSummary = styled.div`
	font-size: 14px;
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
	font-size: 18px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;

const GuidesGridItemBody = styled.div`
	font-size: 14px;
	margin-top: 10px;
	margin-bottom: 20px;
	color: ${p => p.theme.ui.textMinor};
`;

export default NewProjectIntro;
