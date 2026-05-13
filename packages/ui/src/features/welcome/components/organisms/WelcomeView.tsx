import { Flex } from '@chakra-ui/react';
import React from 'react';

import type { WelcomeViewType } from '../../../../containers/Welcome';
import ViewIntroLine from '../atoms/ViewIntroLine';
import ViewTitle from '../atoms/ViewTitle';
import GetStartedColumn from './GetStartedColumn';
import OpenRecentColumn from './OpenRecentColumn';

export interface WelcomeViewProps {
	setView: (view: WelcomeViewType) => void;
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ setView }) => (
	<Flex direction='column' h='100%'>
		<ViewTitle>{'Welcome to Beak!'}</ViewTitle>
		<ViewIntroLine>{'The feathery cross-platform API crafting tool'}</ViewIntroLine>

		<Flex h='calc(100% - 89px)' gap='5'>
			<OpenRecentColumn />
			<GetStartedColumn setView={setView} />
		</Flex>
	</Flex>
);

export default WelcomeView;
