import { Button, Flex, Text } from '@chakra-ui/react';
import { useAppSelector } from '@beak/ui/store/redux';
import * as React from 'react';

import { ipcProjectService } from '../../lib/ipc';

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
const UntitledBanner: React.FC = () => {
	const untitled = useAppSelector(s => Boolean(s.global.project.untitled));

	if (!untitled) return null;

	async function onSaveAs() {
		try {
			await ipcProjectService.promoteUntitled({});
		} catch (err) {
			console.warn('Save Project As… failed', err);
		}
	}

	return (
		<Flex
			role='status'
			aria-label='untitled-project'
			align='center'
			justify='space-between'
			gap='3'
			px='3'
			py='1.5'
			bg='accent.pink.muted'
			borderBottomWidth='1px'
			borderColor='border.subtle'
			color='fg.default'
			fontSize='xs'
			bgGradient='linear-gradient(90deg, accent.pink.muted, transparent)'
		>
			<Text flex='1' truncate>
				<Text as='span' fontWeight='semibold'>{'Untitled project.'}</Text>
				{' Your changes are live but in a temporary folder. Save the project to keep it.'}
			</Text>
			<Button
				type='button'
				size='xs'
				bg='accent.pink'
				color='fg.onAccent'
				borderRadius='sm'
				px='3'
				_hover={{ filter: 'brightness(1.1)' }}
				onClick={onSaveAs}
			>
				{'Save Project As…'}
			</Button>
		</Flex>
	);
};

export default UntitledBanner;
