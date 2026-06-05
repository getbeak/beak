import { Box, Heading } from '@chakra-ui/react';
import React from 'react';

import Container from '../../components/Container';
import Downloader from '../downloader/Downloader';
import BeakOverview from './BeakOverview';
import FeatureHighlight from './FeatureHighlight';
import FeatureOverview from './FeatureOverview';
import HeaderCta from './HeaderCta';
import SneakPeak from './SneakPeak';

const Home: React.FC = () => (
	<>
		<Box pt='50px' textAlign='center' bg='background' css={{ '@media (max-width: 850px)': { paddingTop: '50px' } }}>
			<Container>
				<Heading
					as='h1'
					mx='auto'
					maxW='510px'
					fontWeight={800}
					fontSize='min(8vw, 55px)'
					lineHeight='min(8.75vw, 70px)'
					css={{ '> span': { color: 'var(--chakra-colors-textHighlight)' } }}
				>
					{'The '}
					<span>feathery</span>
					{' cross-platform API crafting tool'}
				</Heading>
				<Heading
					as='h2'
					mx='auto'
					mt='20px'
					maxW='550px'
					px='25px'
					fontWeight={100}
					fontSize='min(4vw, 18px)'
					lineHeight='min(5.25vw, 30px)'
					color='textMinorMuted'
				>
					{
						'Beak makes building 🛠, spying 🕵️‍♀️, and collaborating 👪 on API development fast, frictionless, and dare we say... fun'
					}
				</Heading>

				<HeaderCta />

				<SneakPeak />
			</Container>
		</Box>
		<Box as='main' position='relative' zIndex={1} mt='-80px' pt='80px' bg='secondaryBackground' color='textMinorMuted'>
			<FeatureOverview />
			<Downloader />
			<BeakOverview />

			<FeatureHighlight
				flipped
				title='Multi-tasking'
				description="Tabs allow you to switch context quickly, without losing your train of thought. We're past iOS 1..."
				asset='feature-multitasking'
			/>
			<FeatureHighlight
				title='Enhanced discovery'
				description='Open up the the Omni Bar to search through your project. Spend less time digging through lists and more time hacking.'
				asset='feature-omni'
			/>
			<FeatureHighlight
				flipped
				title='Intuitive, secure collaboration'
				description='None of your project ever touches our servers, and projects are just simple directories. Use your existing workflow, for example Git, with Beak for minimal distruption.'
				asset='feature-git'
			/>
			<FeatureHighlight
				title='Powerful variable replacement'
				description='Beak allows you to place inline variables which can have dynamic content, and be changed in real time.'
				asset='feature-variable-editor'
			/>
		</Box>
	</>
);

export default Home;
