import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { useAppSelector } from '@beak/ui/store/redux';
import { motion } from 'framer-motion';
import { FileWarning } from 'lucide-react';
import * as React from 'react';

import { ipcDialogService, ipcProjectService } from '../../lib/ipc';

/**
 * Thin strip rendered above the sidebar/main split when the active project
 * is an untitled scratch project (created under
 * userData/untitled-projects/). The CTA fires the same IPC as the File
 * menu's "Save Project As…" item — promoteUntitled — which moves the
 * folder to the user-chosen location and re-opens the window.
 *
 * Returns null for non-untitled projects so production workspaces pay no
 * layout cost.
 */
const MotionFlex = motion.create(Flex);

const UntitledBanner: React.FC = () => {
	const untitled = useAppSelector(s => Boolean(s.global.project.untitled));

	if (!untitled) return null;

	async function onSaveAs() {
		try {
			await ipcProjectService.promoteUntitled({});
		} catch (err) {
			console.warn('Save Project As… failed', err);
			await ipcDialogService.showMessageBox({
				type: 'error',
				title: 'Save Project As… failed',
				message: 'Beak couldn’t save this untitled project.',
				detail: err instanceof Error ? err.message : String(err),
			});
		}
	}

	return (
		<MotionFlex
			initial={{ opacity: 0, y: -6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2, ease: 'easeOut' }}
			role='status'
			aria-label='untitled-project'
			align='center'
			justify='space-between'
			gap='3'
			px='3.5'
			py='2'
			borderBottomWidth='1px'
			borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 22%, var(--beak-colors-border-subtle))'
			color='fg.default'
			fontSize='xs'
			css={{
				background:
					'linear-gradient(90deg, color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent), color-mix(in srgb, var(--beak-colors-accent-pink) 8%, transparent) 60%, transparent)',
				borderLeft: '3px solid var(--beak-colors-accent-pink)',
				boxShadow: 'inset 0 -1px 0 color-mix(in srgb, var(--beak-colors-accent-pink) 16%, transparent)',
			}}
		>
			<Flex
				align='center'
				justify='center'
				flexShrink={0}
				w='24px'
				h='24px'
				borderRadius='md'
				bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
				color='accent.pink'
				boxShadow='0 3px 8px color-mix(in srgb, var(--beak-colors-accent-pink) 18%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
			>
				<FileWarning size={12} strokeWidth={2.2} />
			</Flex>
			<Text flex='1 1 auto' truncate lineHeight='1.4'>
				<Text as='span' fontWeight='700' color='accent.pink' textTransform='uppercase' fontSize='10px' letterSpacing='0.06em' mr='1'>
					{'Untitled'}
				</Text>
				{'Changes are live but in a temporary folder. Save to keep it.'}
			</Text>
			<Button
				type='button'
				size='xs'
				bg='accent.pink'
				color='fg.onAccent'
				borderRadius='sm'
				px='3'
				fontWeight='600'
				transitionProperty='filter, transform'
				transitionDuration='0.12s'
				_hover={{ filter: 'brightness(1.1)' }}
				_active={{ transform: 'scale(0.97)' }}
				_focusVisible={{
					outline: 'none',
					boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent)',
				}}
				onClick={onSaveAs}
			>
				{'Save Project As…'}
			</Button>
		</MotionFlex>
	);
};

export default UntitledBanner;
