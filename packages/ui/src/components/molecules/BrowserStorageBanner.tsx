import { useAppSelector } from '@beak/ui/store/redux';
import { ipcBeakHubService } from '@beak/ui/lib/ipc';
import { exportProjectToLocalFolder } from '@beak/ui/features/welcome/lib/export-to-local-folder';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Cloud } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';

/**
 * Thin strip rendered above the sidebar/main split when the active project
 * lives inside the web shell's OPFS sandbox. The CTA pops a folder picker
 * via the File System Access API, copies the project to the chosen folder,
 * persists the new handle, and reloads so the next session reads/writes
 * from disk directly.
 *
 * Returns null for desktop projects and for web projects already mounted on
 * a real folder — production workspaces pay no layout cost. Mirrors the
 * `UntitledBanner` pattern (same height, accent treatment, single CTA).
 */
const embedded = Boolean(window.embeddedIndicator);
const MotionFlex = motion.create(Flex);

const BrowserStorageBanner: React.FC = () => {
	const projectId = useAppSelector(s => s.global.project.id ?? null);
	const projectName = useAppSelector(s => s.global.project.name ?? '');
	const projectMode = useAppSelector(s => s.global.project.mode);
	const [eligible, setEligible] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (embedded) return;
		if (projectMode !== 'disk') return;
		let cancelled = false;
		void (async () => {
			try {
				const source = await ipcBeakHubService.getRootSource();
				if (!cancelled) setEligible(source === 'browser');
			} catch {
				if (!cancelled) setEligible(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [projectMode]);

	if (!eligible || !projectId) return null;

	async function onSave() {
		if (!projectId || busy) return;
		setBusy(true);
		setError(null);
		const outcome = await exportProjectToLocalFolder({ projectId, projectName: projectName || 'Beak Project' });
		setBusy(false);

		if (outcome.ok) {
			// Reload onto the same project URL — the host will mount the picked
			// folder as the fs root and `getCurrentProjectFolder` resolves to `/`.
			window.location.reload();
			return;
		}

		switch (outcome.reason) {
			case 'cancelled':
				return;
			case 'unsupported':
				setError('Your browser doesn’t expose the File System Access API. Use Chrome or Edge.');
				return;
			case 'permission_denied':
				setError('Read/write permission was denied for that folder.');
				return;
			case 'target_not_empty':
				setError('Pick an empty folder — Beak won’t mix the project with existing files.');
				return;
			case 'source_missing':
				setError('Couldn’t find the project in browser storage.');
				return;
			case 'copy_failed':
				setError(`Copy failed${outcome.detail ? `: ${outcome.detail}` : ''}.`);
				return;
			case 'persistence_failed':
				setError('Files copied, but Beak couldn’t remember the new folder. Reload and try again.');
				return;
			default:
				setError('Something went wrong saving the project.');
		}
	}

	return (
		<MotionFlex
			initial={{ opacity: 0, y: -6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2, ease: 'easeOut' }}
			role='status'
			aria-label='browser-storage-project'
			align='center'
			justify='space-between'
			gap='3'
			px='3.5'
			py='2'
			borderBottomWidth='1px'
			borderColor='color-mix(in srgb, var(--beak-colors-accent-teal) 22%, var(--beak-colors-border-subtle))'
			color='fg.default'
			fontSize='xs'
			css={{
				background:
					'linear-gradient(90deg, color-mix(in srgb, var(--beak-colors-accent-teal) 22%, transparent), color-mix(in srgb, var(--beak-colors-accent-teal) 8%, transparent) 60%, transparent)',
				borderLeft: '3px solid var(--beak-colors-accent-teal)',
				boxShadow: 'inset 0 -1px 0 color-mix(in srgb, var(--beak-colors-accent-teal) 16%, transparent)',
			}}
		>
			<Flex
				align='center'
				justify='center'
				flexShrink={0}
				w='24px'
				h='24px'
				borderRadius='md'
				bg='color-mix(in srgb, var(--beak-colors-accent-teal) 14%, transparent)'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-teal) 28%, transparent)'
				color='accent.teal'
				boxShadow='0 3px 8px color-mix(in srgb, var(--beak-colors-accent-teal) 18%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
			>
				<Cloud size={12} strokeWidth={2.2} />
			</Flex>
			<Text flex='1 1 auto' truncate lineHeight='1.4'>
				<Text
					as='span'
					fontWeight='700'
					color='accent.teal'
					textTransform='uppercase'
					fontSize='10px'
					letterSpacing='0.06em'
					mr='1'
				>
					{'Browser storage'}
				</Text>
				{error ?? 'This project lives in the browser sandbox. Save it to a local folder to keep a copy on disk.'}
			</Text>
			<Button
				type='button'
				size='xs'
				bg='accent.teal'
				color='fg.onAccent'
				borderRadius='sm'
				px='3'
				fontWeight='600'
				transitionProperty='filter, transform'
				transitionDuration='0.12s'
				disabled={busy}
				_hover={{ filter: 'brightness(1.1)' }}
				_active={{ transform: 'scale(0.97)' }}
				_focusVisible={{
					outline: 'none',
					boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-teal) 30%, transparent)',
				}}
				onClick={() => void onSave()}
			>
				{busy ? 'Saving…' : 'Save to local folder'}
			</Button>
		</MotionFlex>
	);
};

export default BrowserStorageBanner;
