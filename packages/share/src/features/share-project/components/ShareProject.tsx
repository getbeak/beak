import React from 'react';
import Helmet from 'react-helmet';
import { SmallContainer } from '@beak/share/components/atoms/Container';
import styled from 'styled-components';

import InfoCard from './molecules/InfoCard';

const ShareProject: React.FunctionComponent = () => (
	<SpacedContainer>
		<Helmet defer={false}>
			{/* <!-- Primary Meta Tags --> */}
			<title>{'Beak :: Someone has shared a project with you'}</title>
			<meta name={'title'} content={'Someone has shared a project with you'} />
			<meta name={'description'} content={'Stylish and clean UI, powerful git-based revision control'} />

			{/* <!-- Open Graph / Facebook --> */}
			<meta property={'og:type'} content={'website'} />
			<meta property={'og:url'} content={'https://share.getbeak.app/'} />
			<meta property={'og:title'} content={'Someone has shared a project with you'} />
			<meta property={'og:description'} content={'Stylish and clean UI, powerful git-based revision control'} />
			{/* <meta property={'og:image'} content={'/assets/home.png'} /> */}

			{/* <!-- Twitter --> */}
			<meta property={'twitter:card'} content={'summary_large_image'} />
			<meta property={'twitter:url'} content={'https://share.getbeak.app/'} />
			<meta property={'twitter:title'} content={'Someone has shared a project with you'} />
			<meta property={'twitter:description'} content={'Stylish and clean UI, powerful git-based revision control'} />
			{/* <meta property={'twitter:image'} content={'/assets/home.png'} /> */}
		</Helmet>
		<InfoCard />
	</SpacedContainer>
);

const SpacedContainer = styled(SmallContainer)`
	margin-top: 100px;
`;

export default ShareProject;
