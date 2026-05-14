import { Box, Flex, IconButton } from '@chakra-ui/react';
import WindowSessionContext from '@beak/ui/contexts/window-session-context';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import useShareLink from '@beak/ui/hooks/use-share-link';
import { Check, Copy, Share2, Terminal } from 'lucide-react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import * as React from 'react';
import { useContext, useEffect, useRef, useState } from 'react';

import { createBasicHttpOutput } from '../molecules/RequestOutput';

interface RequestPaneToolbarProps {
	selectedNode: ValidRequestNode;
}

const RequestPaneToolbar: React.FC<RequestPaneToolbarProps> = ({ selectedNode }) => {
	const context = useVariableContext(selectedNode.id);
	const windowSession = useContext(WindowSessionContext);
	const shareUrl = useShareLink(selectedNode.id);
	const [copied, setCopied] = useState<'preview' | 'share' | null>(null);
	const flashTimerRef = useRef<number | null>(null);

	useEffect(() => () => {
		if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
	}, []);

	function flash(kind: 'preview' | 'share') {
		setCopied(kind);
		if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
		flashTimerRef.current = window.setTimeout(() => {
			setCopied(c => (c === kind ? null : c));
			flashTimerRef.current = null;
		}, 1400);
	}

	async function copyRequestPreview() {
		try {
			const output = await createBasicHttpOutput(selectedNode.info, context, windowSession);
			await navigator.clipboard.writeText(output);
			flash('preview');
		} catch (err) {
			console.warn('copy request preview failed', err);
		}
	}

	async function copyShareLink() {
		// useShareLink returns '' until the project id is loaded; copying an
		// empty string and flashing 'Copied!' is misleading.
		if (!shareUrl) return;
		try {
			await navigator.clipboard.writeText(shareUrl);
			flash('share');
		} catch (err) {
			console.warn('copy share link failed', err);
		}
	}

	return (
		<Flex
			position='absolute'
			top='2'
			right='2'
			align='center'
			gap='1'
			zIndex={2}
			pointerEvents='auto'
		>
			<Flex
				align='center'
				gap='1.5'
				h='22px'
				pl='1.5'
				pr='1'
				borderRadius='sm'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='color-mix(in srgb, var(--beak-colors-bg-surface) 80%, transparent)'
				backdropFilter='blur(8px)'
				boxShadow='0 2px 8px rgba(0,0,0,0.12)'
			>
				<Flex align='center' gap='1' color='fg.subtle'>
					<Terminal size={10} strokeWidth={2.2} />
					<Box
						fontSize='9px'
						fontWeight='700'
						textTransform='uppercase'
						letterSpacing='0.08em'
					>
						{'Preview'}
					</Box>
				</Flex>
				<Box w='1px' h='12px' bg='border.subtle' />
				<IconButton
					aria-label='Copy as raw HTTP'
					title='Copy as raw HTTP'
					size='xs'
					variant='ghost'
					h='18px'
					w='18px'
					minW='18px'
					borderRadius='sm'
					color={copied === 'preview' ? 'accent.teal' : 'fg.subtle'}
					transition='color .12s ease, background-color .12s ease'
					_hover={{
						color: copied === 'preview' ? 'accent.teal' : 'accent.pink',
						bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)',
					}}
					_focusVisible={{
						outline: 'none',
						boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
					}}
					onClick={copyRequestPreview}
				>
					{copied === 'preview' ? <Check size={11} strokeWidth={3} /> : <Copy size={11} />}
				</IconButton>
				<IconButton
					aria-label='Copy share link'
					title={shareUrl ? 'Copy share link' : 'Share link unavailable until project loads'}
					size='xs'
					variant='ghost'
					h='18px'
					w='18px'
					minW='18px'
					borderRadius='sm'
					color={copied === 'share' ? 'accent.teal' : 'fg.subtle'}
					transition='color .12s ease, background-color .12s ease'
					_hover={{
						color: copied === 'share' ? 'accent.teal' : 'accent.pink',
						bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)',
					}}
					_focusVisible={{
						outline: 'none',
						boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
					}}
					disabled={!shareUrl}
					onClick={copyShareLink}
				>
					{copied === 'share' ? <Check size={11} strokeWidth={3} /> : <Share2 size={11} />}
				</IconButton>
			</Flex>
		</Flex>
	);
};

export default RequestPaneToolbar;
