import { Box, Button, Flex, IconButton } from '@chakra-ui/react';
import type { NewsItemGenericBanner } from '@beak/common/types/nest';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

import * as React from 'react';
import { useState } from 'react';

interface GenericBannerProps {
	item: NewsItemGenericBanner;
}

const MotionFlex = motion.create(Flex);

const GenericBanner: React.FC<GenericBannerProps> = ({ item }) => {
	const { action, body, emoji, title } = item.payload;
	const [dismissed, setDismissed] = useState(false);

	function visitAction() {
		if (!action) return;
		ipcExplorerService.launchUrl(action.url);
	}

	if (dismissed) return null;

	return (
		<MotionFlex
			initial={{ opacity: 0, y: -6 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -6 }}
			transition={{ duration: 0.2, ease: 'easeOut' }}
			align='center'
			gap='3'
			px='4'
			py='2.5'
			borderRadius='lg'
			borderWidth='1px'
			borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 26%, var(--beak-colors-border-subtle))'
			bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
			boxShadow='0 6px 18px color-mix(in srgb, var(--beak-colors-accent-pink) 14%, rgba(0,0,0,0.06)), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
			style={{ borderLeft: '3px solid var(--beak-colors-accent-pink)' }}
		>
			<Box fontSize='2xl' flex='0 0 auto' aria-hidden>
				{emoji}
			</Box>
			<Box flex='1 1 auto' minW={0}>
				<Box fontSize='sm' fontWeight='600' color='fg.default'>{title}</Box>
				<Box fontSize='xs' color='fg.muted' mt='0.5'>
					{body}
					{action && (
						<Button
							variant='plain'
							size='xs'
							color='accent.pink'
							p='0'
							ml='1'
							fontSize='xs'
							fontWeight='600'
							_hover={{ textDecoration: 'underline' }}
							onClick={visitAction}
						>
							{action.cta}
						</Button>
					)}
				</Box>
			</Box>
			{item.dismissible && (
				<IconButton
					variant='ghost'
					size='xs'
					aria-label='Dismiss'
					bg='transparent'
					p='0'
					h='18px'
					w='18px'
					minW='18px'
					borderRadius='sm'
					color='fg.subtle'
					_hover={{
						color: 'fg.default',
						bg: 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 60%, transparent)',
					}}
					onClick={() => setDismissed(true)}
				>
					<X size={11} />
				</IconButton>
			)}
		</MotionFlex>
	);
};

export default GenericBanner;
