import type { RemoteEntry } from '@beak/state/git';
import { Box, Flex } from '@chakra-ui/react';
import { ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import * as React from 'react';

import Button from '../../../../components/atoms/Button';

interface RemotesPanelProps {
	remotes: RemoteEntry[];
	currentBranch: string | undefined;
	disabled: boolean;
	onPush: () => void;
	onPull: () => void;
	onFetch: () => void;
}

const RemotesPanel: React.FC<RemotesPanelProps> = ({ remotes, currentBranch, disabled, onPush, onPull, onFetch }) => {
	const origin = remotes.find(r => r.remote === 'origin') ?? remotes[0];

	return (
		<Flex direction='column' gap='2.5'>
			<Flex
				align='center'
				gap='1.5'
				color='fg.subtle'
				fontSize='10px'
				fontWeight='700'
				letterSpacing='0.08em'
				textTransform='uppercase'
			>
				{'Remote'}
			</Flex>

			{remotes.length === 0 ? (
				<Box
					p='3'
					textAlign='center'
					borderWidth='1px'
					borderStyle='dashed'
					borderColor='border.subtle'
					borderRadius='md'
					bg='bg.surface'
					color='fg.subtle'
					fontSize='xs'
				>
					{'No remotes configured — add one to push or pull.'}
				</Box>
			) : (
				<Box p='2.5' borderWidth='1px' borderColor='border.subtle' borderRadius='md' bg='bg.surface'>
					<Box
						fontSize='10px'
						fontWeight='700'
						color='accent.indigo'
						textTransform='uppercase'
						letterSpacing='0.06em'
						mb='1'
					>
						{origin!.remote}
					</Box>
					<Box
						fontSize='xs'
						fontFamily='mono'
						color='fg.muted'
						overflow='hidden'
						textOverflow='ellipsis'
						whiteSpace='nowrap'
					>
						{origin!.url}
					</Box>
					{remotes.length > 1 && (
						<Box fontSize='10px' color='fg.subtle' mt='1'>
							{`+ ${remotes.length - 1} more`}
						</Box>
					)}
				</Box>
			)}

			<Flex gap='2' wrap='wrap'>
				<Button size='sm' colour='secondary' onClick={onFetch} disabled={disabled || remotes.length === 0}>
					<Flex align='center' gap='1.5'>
						<RefreshCw size={12} />
						{'Fetch'}
					</Flex>
				</Button>
				<Button size='sm' colour='secondary' onClick={onPull} disabled={disabled || remotes.length === 0 || !currentBranch}>
					<Flex align='center' gap='1.5'>
						<ArrowDown size={12} />
						{'Pull'}
					</Flex>
				</Button>
				<Button size='sm' onClick={onPush} disabled={disabled || remotes.length === 0 || !currentBranch}>
					<Flex align='center' gap='1.5'>
						<ArrowUp size={12} />
						{'Push'}
					</Flex>
				</Button>
			</Flex>
		</Flex>
	);
};

export default RemotesPanel;
