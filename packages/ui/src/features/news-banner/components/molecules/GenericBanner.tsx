import { Box, Button, Grid, IconButton } from '@chakra-ui/react';
import type { NewsItemGenericBanner } from '@beak/common/types/nest';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';

interface GenericBannerProps {
	item: NewsItemGenericBanner;
}

const GenericBanner: React.FC<GenericBannerProps> = ({ item }) => {
	const { action, body, emoji, title } = item.payload;

	function visitAction() {
		if (!action) return;
		ipcExplorerService.launchUrl(action.url);
	}

	return (
		<Grid templateColumns='40px 1fr 20px' px='5' py='3' bg='accent.pink.muted' borderRadius='md'>
			<Box gridColumn={1} fontSize='2xl'>{emoji}</Box>
			<Box gridColumn={2}>
				<Box fontSize='lg' fontWeight='bold'>{title}</Box>
				<Box fontSize='sm' mt='0.5'>
					{body}
					{action && (
						<Button
							variant='plain'
							size='xs'
							color='accent.pink'
							p='0'
							ml='1'
							fontSize='sm'
							onClick={visitAction}
						>
							{action.cta}
						</Button>
					)}
				</Box>
			</Box>
			<Box gridColumn={3} textAlign='right'>
				{item.dismissible && (
					<IconButton variant='ghost' size='xs' aria-label='Dismiss' bg='transparent' p='0' minW='auto'>
						<FontAwesomeIcon icon={faTimes} color='var(--beak-colors-fg-muted)' />
					</IconButton>
				)}
			</Box>
		</Grid>
	);
};

export default GenericBanner;
