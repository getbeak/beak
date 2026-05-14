import { Box, Flex, IconButton } from '@chakra-ui/react';
import WindowSessionContext from '@beak/ui/contexts/window-session-context';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import useShareLink from '@beak/ui/hooks/use-share-link';
import { Check, Copy, Share2, Terminal } from 'lucide-react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import * as React from 'react';
import { useContext, useState } from 'react';

import { createBasicHttpOutput } from '../molecules/RequestOutput';

interface RequestPaneSplitterProps {
	selectedNode: ValidRequestNode;
}

const RequestPaneSplitter: React.FC<RequestPaneSplitterProps> = ({ selectedNode }) => {
	const context = useVariableContext(selectedNode.id);
	const windowSession = useContext(WindowSessionContext);
	const shareUrl = useShareLink(selectedNode.id);
	const [copied, setCopied] = useState<'preview' | 'share' | null>(null);

	function flash(kind: 'preview' | 'share') {
		setCopied(kind);
		window.setTimeout(() => setCopied(c => (c === kind ? null : c)), 1400);
	}

	function copyRequestPreview() {
		createBasicHttpOutput(selectedNode.info, context, windowSession).then(output =>
			navigator.clipboard.writeText(output),
		);
		flash('preview');
	}

	function copyShareLink() {
		navigator.clipboard.writeText(shareUrl);
		flash('share');
	}

	return (
		<Flex
			justify='space-between'
			align='center'
			bg='bg.canvas'
			borderTopWidth='1px'
			borderBottomWidth='1px'
			borderColor='border.subtle'
			px='3'
			py='1.5'
		>
			<Flex align='center' gap='1.5'>
				<Flex
					align='center'
					justify='center'
					w='20px'
					h='20px'
					borderRadius='sm'
					bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
					color='accent.pink'
					boxShadow='inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
				>
					<Terminal size={10} strokeWidth={2.2} />
				</Flex>
				<Box
					fontSize='10px'
					fontWeight='700'
					textTransform='uppercase'
					letterSpacing='0.06em'
					color='fg.subtle'
				>
					{'Request preview'}
				</Box>
			</Flex>
			<Flex align='center' gap='1' pointerEvents='all'>
				<IconButton
					aria-label='Copy as raw HTTP'
					title='Copy as raw HTTP'
					size='xs'
					variant='ghost'
					h='22px'
					w='22px'
					minW='22px'
					borderRadius='sm'
					color={copied === 'preview' ? 'accent.teal' : 'fg.subtle'}
					_hover={{ color: copied === 'preview' ? 'accent.teal' : 'accent.pink', bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)' }}
					onClick={copyRequestPreview}
				>
					{copied === 'preview' ? <Check size={12} /> : <Copy size={12} />}
				</IconButton>
				<IconButton
					aria-label='Copy share link'
					title='Copy share link'
					size='xs'
					variant='ghost'
					h='22px'
					w='22px'
					minW='22px'
					borderRadius='sm'
					color={copied === 'share' ? 'accent.teal' : 'fg.subtle'}
					_hover={{ color: copied === 'share' ? 'accent.teal' : 'accent.pink', bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)' }}
					onClick={copyShareLink}
				>
					{copied === 'share' ? <Check size={12} /> : <Share2 size={12} />}
				</IconButton>
			</Flex>
		</Flex>
	);
};

export default RequestPaneSplitter;
