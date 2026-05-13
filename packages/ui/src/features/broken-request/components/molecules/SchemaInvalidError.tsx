import { Box, Flex } from '@chakra-ui/react';
import type Squawk from '@beak/common/utils/squawk';
import Button from '@beak/ui/components/atoms/Button';
import MeshGradient from '@beak/ui/components/molecules/MeshGradient';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { motion } from 'framer-motion';
import { FileWarning } from 'lucide-react';
import React from 'react';

import { Body, Header, Wrapper } from '../atoms';
import ErrorRenderer from './ErrorRenderer';

interface SchemaInvalidErrorProps {
	filePath: string;
	error: Squawk;
}

const MotionBox = motion.create(Box);

const SchemaInvalidError: React.FC<SchemaInvalidErrorProps> = ({ filePath, error }) => (
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
			>
				<Flex
					align='center'
					justify='center'
					w='64px'
					h='64px'
					borderRadius='full'
					bg='color-mix(in srgb, var(--beak-colors-accent-alert) 14%, transparent)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 28%, transparent)'
					color='accent.alert'
					boxShadow='0 10px 28px color-mix(in srgb, var(--beak-colors-accent-alert) 28%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)'
				>
					<FileWarning size={28} strokeWidth={1.8} />
				</Flex>
			</MotionBox>
			<Header>{'Request file validation has failed'}</Header>
			<Body>{'The file for this request is corrupt. The error below should help you resolve the issue.'}</Body>

			<Button onClick={() => ipcExplorerService.revealFile(filePath)}>{'Show request in finder'}</Button>

			<ErrorRenderer error={error} />
		</Flex>
	</Wrapper>
);

export default SchemaInvalidError;
