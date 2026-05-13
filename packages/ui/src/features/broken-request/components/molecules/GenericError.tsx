import { Box, Flex } from '@chakra-ui/react';
import type Squawk from '@beak/common/utils/squawk';
import Button from '@beak/ui/components/atoms/Button';
import MeshGradient from '@beak/ui/components/molecules/MeshGradient';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { motion } from 'framer-motion';
import { AlertOctagon } from 'lucide-react';
import React from 'react';

import { Body, Header, Wrapper } from '../atoms';
import ErrorRenderer from './ErrorRenderer';

interface GenericErrorProps {
	filePath: string;
	error: Squawk;
}

const MotionBox = motion.create(Box);

const GenericError: React.FC<React.PropsWithChildren<GenericErrorProps>> = ({ filePath, error }) => (
	<Wrapper>
		<MeshGradient
			position='absolute'
			inset='0'
			tone='alert'
			intensity='subtle'
			pointerEvents='none'
		/>
		<Flex position='relative' direction='column' align='center' h='100%'>
			<MotionBox
				initial={{ opacity: 0, scale: 0.92 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ type: 'spring', stiffness: 600, damping: 30 }}
				color='accent.alert'
			>
				<AlertOctagon size={48} strokeWidth={1.5} />
			</MotionBox>
			<Header>{'Unable to load request file'}</Header>
			<Body>{'There was an unknown error while trying to load this request.'}</Body>

			<Button onClick={() => ipcExplorerService.revealFile(filePath)}>{'Show request in finder'}</Button>

			<ErrorRenderer error={error} />
		</Flex>
	</Wrapper>
);

export default GenericError;
