import React from 'react';
import styled from 'styled-components';

import Container from '../../../components/atoms/Container';
import BeakOverview from './molecules/BeakOverview';
import Downloader from './molecules/Downloader';
import FeatureHighlight from './molecules/FeatureHighlight';
import FeatureOverview from './molecules/FeatureOverview';
import HeaderCta from './molecules/HeaderCta';
import SneakPeak from './molecules/SneakPeak';

const Home: React.FunctionComponent = () => (
	<React.Fragment>
		<Header>
			<Container>
				<Title>
					{'The '}
					<span>{'feathery'}</span>{' '}
					{'cross-platform API crafting tool'}
				</Title>
				<SubTitle>
					{'Beak makes building 🛠, spying 🕵️‍♀️, and collaborating 👪 on API '}
					{'development fast, frictionless, and dare we say... fun'}
				</SubTitle>

				<HeaderCta />
				<SneakPeak />
			</Container>
		</Header>
		<Main>
			<FeatureOverview />
			<BeakOverview />

			<Downloader />

			<FeatureHighlight
				flipped
				title={'Multi-tasking'}
				description={'Tabs allow you to switch context quickly, without losing your train of thought. We\'re past iOS 1...'}
				asset={'feature-highlight'}
			/>
			<FeatureHighlight
				title={'Enhanced discovery'}
				description={'Open up the the Omni Bar to search through your project. Spend less time digging through lists and more time hacking.'}
				asset={'feature-highlight'}
			/>
			<FeatureHighlight
				flipped
				title={'Intuitive, secure collaboration'}
				description={'None of your project ever touches our servers, and projects are just simple directories. Use your existing workflow, for example Git, with Beak for minimal distruption.'}
				asset={'feature-highlight'}
			/>
			<FeatureHighlight
				title={'Something else!'}
				description={''}
				asset={'feature-highlight'}
			/>
		</Main>
	</React.Fragment>
);

const Header = styled.div`
	padding-top: 125px;
	text-align: center;

	background: ${p => p.theme.ui.background};

	@media (max-width: 850px) {
		padding-top: 50px;
	}
`;

const Title = styled.h1`
	margin: 0 auto;
	max-width: 510px;
	font-weight: 800;
	font-size: min(8vw, 60px);
	line-height: min(8.75vw, 75px);

	> span {
		color: ${p => p.theme.ui.textHighlight};
	}
`;

const SubTitle = styled.h2`
	margin: 0 auto;
	margin-top: 20px;
	max-width: 550px;
	padding: 0 25px;

	font-weight: 100;

	font-size: min(4vw, 20px);
	line-height: min(5.25vw, 35px);

	color: ${p => p.theme.ui.textMinorMuted};
`;

const Main = styled.main`
	position: relative;
	z-index: 1;
	margin-top: -80px;
	padding-top: 80px;

	background: ${p => p.theme.ui.secondaryBackground};
	color: ${p => p.theme.ui.textMinorMuted};
`;

export default Home;
