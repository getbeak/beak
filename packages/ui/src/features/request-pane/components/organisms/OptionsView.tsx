import { actions } from '@beak/ui/store/project';
import { Box, chakra, Flex, Text } from '@chakra-ui/react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import { Cookie, CornerDownRight, FileArchive, GitCompare, Timer } from 'lucide-react';
import * as React from 'react';
import { useId } from 'react';
import { useDispatch } from 'react-redux';

export interface OptionsViewProps {
	node: ValidRequestNode;
}

interface ToggleRowProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	checked: boolean;
	onChange: (next: boolean) => void;
}

interface NumberRowProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	value: number;
	min?: number;
	max?: number;
	step?: number;
	suffix?: string;
	placeholder?: string;
	onChange: (next: number) => void;
}

const HiddenCheckbox = chakra('input', {
	base: {
		position: 'absolute',
		opacity: 0,
		w: '100%',
		h: '100%',
		m: 0,
		cursor: 'pointer',
	},
});

/**
 * Pill toggle. Pink fill when on, neutral when off. Slightly bigger than the
 * dense table-editor toggle because settings rows aren't space-constrained —
 * the larger tap target reads as deliberate.
 */
const ToggleSwitch: React.FC<{ checked: boolean }> = ({ checked }) => (
	<Box
		data-toggle-track
		as='span'
		position='relative'
		display='inline-block'
		flex='0 0 auto'
		w='32px'
		h='18px'
		borderRadius='full'
		bg={checked ? 'accent.pink' : 'bg.surface.emphasized'}
		borderWidth='1px'
		borderColor={checked ? 'accent.pink' : 'border.default'}
		transition='background-color .15s linear, border-color .15s linear'
		pointerEvents='none'
	>
		<Box
			as='span'
			position='absolute'
			top='2px'
			left={checked ? '15px' : '2px'}
			w='12px'
			h='12px'
			borderRadius='full'
			bg='fg.onAccent'
			boxShadow='0 1px 2px rgba(0,0,0,0.18)'
			transition='left .15s cubic-bezier(.4,0,.2,1)'
		/>
	</Box>
);

/**
 * One row inside a section. No outer card / border on the row itself — the
 * surrounding section's spacing provides the visual frame. Hover lifts to
 * `bg.surface.alt` so the row reads as live; nothing else.
 */
const RowFrame = chakra('label', {
	base: {
		display: 'flex',
		alignItems: 'center',
		gap: '3',
		px: '3',
		py: '3',
		position: 'relative',
		cursor: 'pointer',
		_hover: { bg: 'bg.surface.alt' },
		_focusWithin: {
			'& [data-toggle-track]': {
				boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 38%, transparent)',
			},
		},
	},
});

const RowContainer = chakra('div', {
	base: {
		display: 'flex',
		alignItems: 'center',
		gap: '3',
		px: '3',
		py: '3',
		position: 'relative',
		_hover: { bg: 'bg.surface.alt' },
	},
});

const NumberInput = chakra('input', {
	base: {
		flex: '0 0 auto',
		w: '96px',
		h: '28px',
		px: '2.5',
		borderRadius: 'sm',
		borderWidth: '1px',
		borderColor: 'border.subtle',
		bg: 'bg.surface',
		color: 'fg.default',
		fontFamily: 'mono',
		fontSize: '12px',
		fontVariantNumeric: 'tabular-nums',
		outline: 'none',
		textAlign: 'right',
		_hover: { borderColor: 'border.default' },
		_focus: {
			borderColor: 'accent.pink',
			boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)',
		},
	},
});

/**
 * Leading icon chip. Sits in a soft neutral surface so the icon reads as a
 * deliberate badge, not a stray glyph against the row background. The chip
 * uses `bg.surface.emphasized` which is one step lighter than the parent
 * panel in dark mode — distinct without painting in colour.
 */
const RowIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<Flex
		align='center'
		justify='center'
		w='28px'
		h='28px'
		flex='0 0 auto'
		borderRadius='md'
		bg='bg.surface.emphasized'
		color='fg.muted'
	>
		{children}
	</Flex>
);

const ToggleRow: React.FC<ToggleRowProps> = ({ icon, title, description, checked, onChange }) => {
	const id = useId();
	return (
		<RowFrame htmlFor={id}>
			<HiddenCheckbox
				type='checkbox'
				id={id}
				checked={checked}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.checked)}
			/>
			<RowIcon>{icon}</RowIcon>
			<Box flex='1 1 auto' minW={0}>
				<Text as='span' display='block' color='fg.default' fontSize='13px' fontWeight='500' lineHeight='1.3'>
					{title}
				</Text>
				<Text as='span' display='block' color='fg.subtle' fontSize='11.5px' lineHeight='1.45' mt='0.5'>
					{description}
				</Text>
			</Box>
			<ToggleSwitch checked={checked} />
		</RowFrame>
	);
};

const NumberRow: React.FC<NumberRowProps> = ({
	icon,
	title,
	description,
	value,
	min,
	max,
	step,
	suffix,
	placeholder,
	onChange,
}) => {
	const id = useId();
	return (
		<RowContainer>
			<RowIcon>{icon}</RowIcon>
			<Box flex='1 1 auto' minW={0}>
				<chakra.label
					htmlFor={id}
					display='block'
					color='fg.default'
					fontSize='13px'
					fontWeight='500'
					cursor='pointer'
					lineHeight='1.3'
				>
					{title}
				</chakra.label>
				<Text as='span' display='block' color='fg.subtle' fontSize='11.5px' lineHeight='1.45' mt='0.5'>
					{description}
				</Text>
			</Box>
			<Flex align='center' gap='1.5' flex='0 0 auto'>
				<NumberInput
					id={id}
					type='number'
					min={min}
					max={max}
					step={step}
					value={value}
					placeholder={placeholder}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
						const raw = Number(e.currentTarget.value);
						if (!Number.isFinite(raw)) return;
						const clamped = Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? 0, Math.round(raw)));
						onChange(clamped);
					}}
				/>
				{suffix && (
					<Text as='span' fontSize='11px' color='fg.subtle' minW='24px'>
						{suffix}
					</Text>
				)}
			</Flex>
		</RowContainer>
	);
};

/**
 * Section block: uppercase label + optional description above, then the row
 * group beneath. There's no outer card or border around the rows — settings
 * groups in 2026 don't need nested chrome to feel grouped. A top-edge
 * separator + per-row hover lifts via `bg.surface.alt` do the work.
 */
const Section: React.FC<React.PropsWithChildren<{ title: string; description?: string }>> = ({
	title,
	description,
	children,
}) => (
	<Box>
		<Flex direction='column' gap='1' mb='2'>
			<Text as='span' fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.08em' color='fg.subtle'>
				{title}
			</Text>
			{description && (
				<Text as='span' fontSize='12px' color='fg.muted' lineHeight='1.45'>
					{description}
				</Text>
			)}
		</Flex>
		<Flex
			direction='column'
			borderTopWidth='1px'
			borderTopColor='border.subtle'
			css={{
				'& > *:not(:last-child)': {
					borderBottom: '1px solid var(--beak-colors-border-subtle)',
				},
			}}
		>
			{children}
		</Flex>
	</Box>
);

const OptionsView: React.FC<OptionsViewProps> = ({ node }) => {
	const dispatch = useDispatch();
	const options = node.info.options;

	const followRedirects = options.followRedirects;
	const decompressResponse = options.decompressResponse ?? true;
	const timeoutMs = options.timeoutMs ?? 0;
	const maxRedirects = options.maxRedirects ?? 5;
	const sendCookies = options.sendCookies !== false;

	return (
		<Box h='100%' overflowY='auto'>
			<Flex direction='column' maxW='760px' mx='auto' px='6' py='8' gap='8'>
				<Section title='Connection' description='Behaviour while the request is in flight.'>
					<NumberRow
						icon={<Timer size={14} strokeWidth={1.8} />}
						title='Timeout'
						description='Abort if no response arrives within this many milliseconds. 0 disables the timeout.'
						value={timeoutMs}
						min={0}
						max={600000}
						step={500}
						suffix='ms'
						onChange={next => dispatch(actions.requestOptionTimeoutMs({ requestId: node.id, timeoutMs: next }))}
					/>
				</Section>

				<Section title='Redirects' description='How HTTP 3xx responses are followed.'>
					<ToggleRow
						icon={<CornerDownRight size={14} strokeWidth={1.8} />}
						title='Follow redirects'
						description='Automatically follow Location headers up to the cap below.'
						checked={followRedirects}
						onChange={next =>
							dispatch(
								actions.requestOptionFollowRedirects({
									requestId: node.id,
									followRedirects: next,
								}),
							)
						}
					/>
					<NumberRow
						icon={<GitCompare size={14} strokeWidth={1.8} />}
						title='Maximum redirects'
						description='Cap on how many redirects the requester will follow before giving up.'
						value={maxRedirects}
						min={0}
						max={50}
						step={1}
						onChange={next => dispatch(actions.requestOptionMaxRedirects({ requestId: node.id, maxRedirects: next }))}
					/>
				</Section>

				<Section title='Response' description='What to do with the response body after it lands.'>
					<ToggleRow
						icon={<FileArchive size={14} strokeWidth={1.8} />}
						title='Decompress response'
						description='Accept gzip / brotli / deflate and decode the body. Turn off to inspect compressed bytes verbatim.'
						checked={decompressResponse}
						onChange={next =>
							dispatch(
								actions.requestOptionDecompressResponse({
									requestId: node.id,
									decompressResponse: next,
								}),
							)
						}
					/>
				</Section>

				<Section title='Cookies' description='Which jars contribute to the outgoing request.'>
					<ToggleRow
						icon={<Cookie size={14} strokeWidth={1.8} />}
						title='Send cookies'
						description='Attach matching cookies from the project’s primary cookie jar. Turn off for unauthenticated calls or when you want to manually drive a Cookie header.'
						checked={sendCookies}
						onChange={next =>
							dispatch(
								actions.requestOptionSendCookies({
									requestId: node.id,
									sendCookies: next,
								}),
							)
						}
					/>
				</Section>
			</Flex>
		</Box>
	);
};

export default OptionsView;
