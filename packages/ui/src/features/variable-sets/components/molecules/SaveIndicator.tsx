import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import * as React from 'react';

const SAVED_DISPLAY_MS = 1800;

const SaveIndicator: React.FC = () => {
	const writeDebouncer = useAppSelector(s => s.global.variableSets.writeDebouncer);
	const latestWrite = useAppSelector(s => s.global.variableSets.latestWrite);
	const [status, setStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');
	const debouncerSeen = React.useRef<string>('');
	const writeSeen = React.useRef<number>(latestWrite ?? 0);

	React.useEffect(() => {
		if (!writeDebouncer || writeDebouncer === debouncerSeen.current) return;
		debouncerSeen.current = writeDebouncer;
		setStatus('saving');
	}, [writeDebouncer]);

	React.useEffect(() => {
		if (!latestWrite || latestWrite === writeSeen.current) return;
		writeSeen.current = latestWrite;
		setStatus('saved');
		const t = window.setTimeout(() => {
			setStatus(prev => (prev === 'saved' ? 'idle' : prev));
		}, SAVED_DISPLAY_MS);
		return () => window.clearTimeout(t);
	}, [latestWrite]);

	if (status === 'idle') return null;

	const isSaving = status === 'saving';

	return (
		<Flex
			align='center'
			gap='1'
			px='1.5'
			h='20px'
			borderRadius='sm'
			fontSize='10px'
			fontWeight='600'
			color={isSaving ? 'fg.subtle' : 'accent.success'}
			bg={
				isSaving
					? 'color-mix(in srgb, var(--beak-colors-fg-default) 6%, transparent)'
					: 'color-mix(in srgb, var(--beak-colors-accent-success) 12%, transparent)'
			}
			transition='color .15s ease, background-color .15s ease'
		>
			{isSaving ? (
				<motion.div
					style={{ display: 'inline-flex' }}
					animate={{ rotate: 360 }}
					transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, ease: 'linear' }}
				>
					<Loader2 size={10} strokeWidth={2.4} />
				</motion.div>
			) : (
				<Check size={10} strokeWidth={2.6} />
			)}
			<Box as='span'>{isSaving ? 'Saving…' : 'Saved'}</Box>
		</Flex>
	);
};

export default SaveIndicator;
