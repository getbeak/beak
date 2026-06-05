import { Box, chakra, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FileCode2, Hash, ImportIcon, Network } from 'lucide-react';
import * as React from 'react';

import type { SourceSchemaKind } from '../../../source-schemas/types';

interface SchemaSourceCardProps {
	idx: number;
	onPick: (kind: SourceSchemaKind) => void;
}

const ChakraButton = chakra('button');
const MotionDiv = motion.div;

const PINK = 'var(--beak-colors-accent-pink)';

interface Option {
	kind: SourceSchemaKind;
	label: string;
	tagline: string;
	icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

const OPTIONS: Option[] = [
	{ kind: 'openapi', label: 'OpenAPI', tagline: 'Pick a spec', icon: ImportIcon },
	{ kind: 'graphql', label: 'GraphQL', tagline: 'Introspect a live endpoint', icon: Hash },
	{ kind: 'grpc', label: 'gRPC', tagline: 'Reflect or upload a .proto', icon: Network },
];

const SchemaSourceCard: React.FC<SchemaSourceCardProps> = ({ idx, onPick }) => (
	<MotionDiv
		initial={{ opacity: 0, y: 10 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 + idx * 0.05 }}
		style={{ display: 'block', width: '100%', gridColumn: '1 / -1' }}
	>
		<Flex
			direction='column'
			w='100%'
			p='3'
			borderRadius='lg'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='bg.surface'
		>
			<Flex align='flex-start' gap='2.5' mb='2.5'>
				<Flex
					flex='0 0 auto'
					align='center'
					justify='center'
					w='32px'
					h='32px'
					borderRadius='md'
					css={{
						background: `color-mix(in srgb, ${PINK} 14%, transparent)`,
						borderWidth: '1px',
						borderStyle: 'solid',
						borderColor: `color-mix(in srgb, ${PINK} 30%, transparent)`,
						color: PINK,
						boxShadow: 'inset 0 1px 0 color-mix(in srgb, white 14%, transparent)',
					}}
				>
					<FileCode2 size={15} />
				</Flex>
				<Box flex='1 1 auto' minW={0}>
					<Box fontSize='sm' fontWeight='600' color='fg.default' letterSpacing='-0.005em' mb='0.5'>
						{'Start from a schema'}
					</Box>
					<Box fontSize='xs' color='fg.muted' lineHeight='1.45'>
						{'Materialise every operation as a request.'}
					</Box>
				</Box>
			</Flex>
			<Flex direction={{ base: 'column', md: 'row' }} gap='1.5' css={{ '& > *': { flex: '1 1 0', minWidth: 0 } }}>
				{OPTIONS.map(opt => {
					const Icon = opt.icon;
					return (
						<ChakraButton
							key={opt.kind}
							type='button'
							display='flex'
							alignItems='center'
							gap='2'
							textAlign='left'
							px='2.5'
							py='2'
							borderRadius='md'
							borderWidth='1px'
							borderColor='border.subtle'
							bg='bg.canvas'
							color='fg.default'
							cursor='pointer'
							transition='border-color .12s ease, background-color .12s ease, color .12s ease'
							_hover={{
								borderColor: PINK,
								color: PINK,
								bg: `color-mix(in srgb, ${PINK} 5%, var(--beak-colors-bg-canvas))`,
							}}
							_focusVisible={{
								outline: 'none',
								borderColor: PINK,
								color: PINK,
								boxShadow: `0 0 0 2px color-mix(in srgb, ${PINK} 28%, transparent)`,
							}}
							onClick={() => onPick(opt.kind)}
						>
							<Box flex='0 0 auto' display='inline-flex'>
								<Icon size={13} strokeWidth={2} />
							</Box>
							<Box minW={0} flex='1 1 auto'>
								<Box fontSize='xs' fontWeight='600' lineHeight='1.2'>
									{opt.label}
								</Box>
								<Box fontSize='11px' color='fg.muted' fontWeight='500' lineHeight='1.3' truncate>
									{opt.tagline}
								</Box>
							</Box>
						</ChakraButton>
					);
				})}
			</Flex>
		</Flex>
	</MotionDiv>
);

export default SchemaSourceCard;
