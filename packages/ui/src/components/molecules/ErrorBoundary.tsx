import { Box, chakra, Flex } from '@chakra-ui/react';
import { captureException } from '@sentry/electron/renderer';
import { AlertTriangle, ChevronDown, Copy, RefreshCw } from 'lucide-react';
import * as React from 'react';

import Button from '../atoms/Button';

export type ErrorBoundaryVariant = 'full' | 'panel' | 'inline';

interface RenderProps {
	error: Error;
	reset: () => void;
	label?: string;
}

interface ErrorBoundaryProps {
	children: React.ReactNode;
	/**
	 * Visual treatment for the fallback. Defaults to `panel`.
	 *  - `full`   — fills its container (use at app/window/screen level).
	 *  - `panel`  — centered card sized to fit the parent flex slot.
	 *  - `inline` — compact one-line strip (tab strips, narrow toolbars).
	 */
	variant?: ErrorBoundaryVariant;
	/** Short label describing what failed (e.g. "Request editor"). */
	label?: string;
	/**
	 * Any change in this list re-mounts the children and clears the error
	 * state. Useful for resetting when, say, the selected tab changes.
	 */
	resetKeys?: ReadonlyArray<unknown>;
	/** Called when the user clicks "Try again", before children re-render. */
	onReset?: () => void;
	/** Override the default fallback UI entirely. */
	fallback?: (props: RenderProps) => React.ReactNode;
}

interface ErrorBoundaryState {
	error: Error | null;
}

function keysChanged(a: ReadonlyArray<unknown> | undefined, b: ReadonlyArray<unknown> | undefined) {
	if (a === b) return false;
	if (!a || !b) return true;
	if (a.length !== b.length) return true;
	for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return true;
	return false;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { error: null };

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { error };
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		captureException(error, {
			extra: { componentStack: info.componentStack, label: this.props.label ?? null },
			tags: { boundary: this.props.label ?? 'unlabeled' },
		});
		console.error('[ErrorBoundary]', this.props.label ?? '(unlabeled)', error, info);
	}

	componentDidUpdate(prevProps: ErrorBoundaryProps) {
		if (this.state.error !== null && keysChanged(prevProps.resetKeys, this.props.resetKeys)) this.reset();
	}

	reset = () => {
		this.props.onReset?.();
		this.setState({ error: null });
	};

	render() {
		const { error } = this.state;
		if (!error) return this.props.children;

		if (this.props.fallback) return this.props.fallback({ error, reset: this.reset, label: this.props.label });

		return (
			<ErrorFallback error={error} reset={this.reset} variant={this.props.variant ?? 'panel'} label={this.props.label} />
		);
	}
}

interface FallbackProps {
	error: Error;
	reset: () => void;
	variant: ErrorBoundaryVariant;
	label?: string;
}

const Details = chakra('details');
const Summary = chakra('summary');
const Pre = chakra('pre');

const ErrorFallback: React.FC<FallbackProps> = ({ error, reset, variant, label }) => {
	const [copied, setCopied] = React.useState(false);
	const heading = label ? `${label} crashed` : 'Something went wrong';

	const handleCopy = () => {
		const payload = [
			`Label: ${label ?? '(unlabeled)'}`,
			`Name: ${error.name}`,
			`Message: ${error.message}`,
			'',
			error.stack ?? '(no stack)',
		].join('\n');
		void navigator.clipboard?.writeText(payload).then(
			() => {
				setCopied(true);
				window.setTimeout(() => setCopied(false), 1400);
			},
			() => {
				/* clipboard denied — silently ignore */
			},
		);
	};

	if (variant === 'inline') {
		return (
			<Flex
				role='alert'
				align='center'
				gap='2'
				px='3'
				py='1.5'
				borderRadius='md'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 32%, var(--beak-colors-border-subtle))'
				bg='color-mix(in srgb, var(--beak-colors-accent-alert) 6%, var(--beak-colors-bg-surface))'
				fontSize='xs'
				color='fg.default'
				minW={0}
			>
				<Box color='accent.alert' flex='0 0 auto' display='inline-flex'>
					<AlertTriangle size={13} strokeWidth={2.2} />
				</Box>
				<Box flex='1' minW={0} overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap' fontWeight='500'>
					{heading}
				</Box>
				<chakra.button
					type='button'
					onClick={reset}
					display='inline-flex'
					alignItems='center'
					gap='1'
					px='2'
					h='22px'
					borderRadius='sm'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 50%, transparent)'
					color='accent.alert'
					bg='transparent'
					fontSize='11px'
					fontWeight='600'
					cursor='pointer'
					_hover={{ bg: 'color-mix(in srgb, var(--beak-colors-accent-alert) 12%, transparent)' }}
					_focusVisible={{
						outline: 'none',
						boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-alert) 40%, transparent)',
					}}
				>
					<RefreshCw size={11} strokeWidth={2.4} />
					{'Retry'}
				</chakra.button>
			</Flex>
		);
	}

	const isFull = variant === 'full';

	return (
		<Flex
			role='alert'
			position={isFull ? 'absolute' : 'relative'}
			inset={isFull ? '0' : undefined}
			w='100%'
			h='100%'
			minH={isFull ? '100%' : '180px'}
			align='center'
			justify='center'
			bg={isFull ? 'bg.canvas' : 'transparent'}
			p={isFull ? '6' : '4'}
			zIndex={isFull ? 110 : undefined}
		>
			<Flex
				direction='column'
				maxW={isFull ? '560px' : '480px'}
				w='100%'
				bg='bg.surface'
				borderWidth='1px'
				borderColor='border.subtle'
				borderRadius='lg'
				overflow='hidden'
				boxShadow='0 12px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.06)'
				position='relative'
			>
				<Box
					position='absolute'
					top={0}
					left={0}
					right={0}
					h='3px'
					bg='linear-gradient(90deg, color-mix(in srgb, var(--beak-colors-accent-alert) 80%, transparent), color-mix(in srgb, var(--beak-colors-accent-pink) 75%, transparent))'
				/>

				<Flex align='center' gap='3' px='5' pt='5' pb='3'>
					<Flex
						align='center'
						justify='center'
						w='36px'
						h='36px'
						borderRadius='full'
						bg='color-mix(in srgb, var(--beak-colors-accent-alert) 16%, transparent)'
						color='accent.alert'
						flex='0 0 auto'
						boxShadow='inset 0 0 0 1px color-mix(in srgb, var(--beak-colors-accent-alert) 30%, transparent)'
					>
						<AlertTriangle size={18} strokeWidth={2.2} />
					</Flex>
					<Flex direction='column' minW={0} flex='1'>
						<Box fontSize='md' fontWeight='600' color='fg.default' lineHeight='1.2' letterSpacing='-0.005em'>
							{heading}
						</Box>
						<Box
							fontSize='10px'
							color='accent.alert'
							fontWeight='700'
							letterSpacing='0.06em'
							textTransform='uppercase'
							mt='1'
						>
							{'Renderer error'}
						</Box>
					</Flex>
				</Flex>

				<Box px='5' pb='3' fontSize='sm' color='fg.muted' lineHeight='1.5'>
					{label
						? `The ${label.toLowerCase()} hit an unexpected error. The rest of Beak is still running — retry to remount this view, or copy the details below.`
						: 'This view hit an unexpected error. The rest of Beak is still running — retry to remount it, or copy the details below.'}
				</Box>

				<Box
					mx='5'
					mb='3'
					borderRadius='md'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 28%, var(--beak-colors-border-subtle))'
					bg='color-mix(in srgb, var(--beak-colors-accent-alert) 6%, transparent)'
					px='3'
					py='2'
					fontSize='xs'
					color='fg.default'
					fontFamily='mono'
					wordBreak='break-word'
				>
					{error.message || error.name || 'Unknown error'}
				</Box>

				{error.stack && (
					<Details
						mx='5'
						mb='4'
						css={{
							'& > summary': { listStyle: 'none' },
							'& > summary::-webkit-details-marker': { display: 'none' },
							'&[open] .beak-eb-chevron': { transform: 'rotate(180deg)' },
						}}
					>
						<Summary
							cursor='pointer'
							display='inline-flex'
							alignItems='center'
							gap='1.5'
							fontSize='10px'
							fontWeight='700'
							color='fg.subtle'
							textTransform='uppercase'
							letterSpacing='0.06em'
							userSelect='none'
							_hover={{ color: 'accent.pink' }}
						>
							<Box className='beak-eb-chevron' display='inline-flex' transition='transform .14s ease'>
								<ChevronDown size={11} strokeWidth={2.4} />
							</Box>
							{'Stack trace'}
						</Summary>
						<Pre
							mt='2'
							p='3'
							maxH='200px'
							overflow='auto'
							borderWidth='1px'
							borderColor='border.subtle'
							borderRadius='md'
							bg='bg.canvas'
							fontSize='11px'
							fontFamily='mono'
							color='fg.muted'
							whiteSpace='pre-wrap'
							wordBreak='break-word'
							lineHeight='1.5'
						>
							{error.stack}
						</Pre>
					</Details>
				)}

				<Flex
					gap='2'
					px='5'
					py='3'
					borderTopWidth='1px'
					borderColor='border.subtle'
					bg='bg.canvas'
					justify='flex-end'
					wrap='wrap'
				>
					<Button colour='secondary' size='sm' onClick={handleCopy}>
						<Flex align='center' gap='1.5'>
							<Copy size={12} strokeWidth={2.2} />
							{copied ? 'Copied!' : 'Copy details'}
						</Flex>
					</Button>
					<Button colour='primary' size='sm' onClick={reset}>
						<Flex align='center' gap='1.5'>
							<RefreshCw size={12} strokeWidth={2.2} />
							{'Try again'}
						</Flex>
					</Button>
				</Flex>
			</Flex>
		</Flex>
	);
};
