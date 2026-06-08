import VariableInput from '@beak/ui/features/variable-input/components/VariableInput';
import { useVariableInputV2Flag, VariableInputV2 } from '@beak/ui/features/variable-input-v2';
import type { ValueSections } from '@beak/ui/features/variables/values';
import { Badge, Box, Button, Flex, Stack, Text } from '@chakra-ui/react';
import { Bug, FlaskConical, RotateCcw, Sparkles } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import DebugPanel from './components/DebugPanel';
import ScenarioPicker, { type Scenario } from './components/ScenarioPicker';
import { useSelectionTracker } from './hooks/use-selection-tracker';

const SCENARIOS: Scenario[] = [
	{ id: 'empty', label: 'Empty', notes: 'Caret on a placeholder field.', parts: [] },
	{ id: 'plain', label: 'Plain text', notes: 'Word selection + arrow navigation.', parts: ['hello world'] },
	{
		id: 'single-chip',
		label: 'Single chip',
		notes: 'Caret before/after a single non-editable chip.',
		parts: [{ type: 'uuid', payload: { version: 'v4' } }],
	},
	{
		id: 'text-chip-text',
		label: 'Text + chip + text',
		notes: 'Most common URL shape — assert caret survives a chip insert.',
		parts: ['/users/', { type: 'uuid', payload: { version: 'v4' } }, '/profile'],
	},
	{
		id: 'two-chips',
		label: 'Adjacent chips',
		notes: 'Gap anchor must hold a caret between two chips.',
		parts: [
			{ type: 'uuid', payload: { version: 'v4' } },
			{ type: 'nonce', payload: {} },
		],
	},
	{
		id: 'trailing-chip',
		label: 'Trailing chip',
		notes: 'Tail anchor must accept typing after the last chip.',
		parts: ['prefix-', { type: 'nonce', payload: {} }],
	},
	{
		id: 'leading-chip',
		label: 'Leading chip',
		notes: 'Backspace at offset 0 should not eat the chip silently.',
		parts: [{ type: 'request_name', payload: {} }, '/edit'],
	},
	{
		id: 'long-text',
		label: 'Long text',
		notes: 'Caret + selection across a horizontally overflowing input.',
		parts: [
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
		],
	},
	{
		id: 'masked',
		label: 'Masked token',
		notes: 'CSS text-security disc — caret should stay visible.',
		parts: ['super-secret-token-value'],
		mask: true,
	},
	{
		id: 'missing-var',
		label: 'Missing variable type',
		notes: 'Unknown chip type — rendered as missing/alert.',
		parts: ['x-', { type: 'does_not_exist', payload: {} }, '-y'],
	},
];

interface PlaygroundInputProps {
	scenario: Scenario;
	parts: ValueSections;
	onChange: (parts: ValueSections) => void;
	onEvent: (event: { kind: string; detail?: string }) => void;
	useV2?: boolean;
}

/**
 * Wraps `VariableInput` so we can grab a ref to the inner contenteditable
 * element and observe its native focus/selection events from the outside.
 * The component itself doesn't expose hooks for those, which is precisely
 * what we want to inspect in the playground.
 */
const PlaygroundInput = React.forwardRef<HTMLElement, PlaygroundInputProps>((props, forwardedRef) => {
	const { scenario, parts, onChange, onEvent, useV2 } = props;
	const localRef = useRef<HTMLElement | null>(null);

	const setRef = useCallback(
		(elem: HTMLElement | null) => {
			localRef.current = elem;
			if (typeof forwardedRef === 'function') forwardedRef(elem);
			else if (forwardedRef) forwardedRef.current = elem;
		},
		[forwardedRef],
	);

	useEffect(() => {
		const elem = localRef.current;
		if (!elem) return;

		const onFocus = () => onEvent({ kind: 'focus' });
		const onBlur = () => onEvent({ kind: 'blur' });
		const onInput = (event: Event) => {
			const ie = event as InputEvent;
			onEvent({ kind: 'input', detail: ie.data == null ? `(${ie.inputType})` : `data=${JSON.stringify(ie.data)}` });
		};
		const onKeyDown = (event: KeyboardEvent) => {
			onEvent({ kind: 'keydown', detail: event.key });
		};

		elem.addEventListener('focus', onFocus);
		elem.addEventListener('blur', onBlur);
		elem.addEventListener('input', onInput, true);
		elem.addEventListener('keydown', onKeyDown, true);

		return () => {
			elem.removeEventListener('focus', onFocus);
			elem.removeEventListener('blur', onBlur);
			elem.removeEventListener('input', onInput, true);
			elem.removeEventListener('keydown', onKeyDown, true);
		};
	}, [scenario.id, onEvent]);

	const Component = useV2 ? VariableInputV2 : VariableInput;
	return (
		<Component
			ref={setRef}
			parts={parts}
			onChange={onChange}
			mask={scenario.mask}
			placeholder={`Try editing — ${scenario.label.toLowerCase()}`}
		/>
	);
});

const VariableInputPlayground: React.FC = () => {
	const [scenarioId, setScenarioId] = useState(SCENARIOS[3].id);
	const scenario = useMemo(() => SCENARIOS.find(s => s.id === scenarioId) ?? SCENARIOS[0], [scenarioId]);
	const [parts, setParts] = useState<ValueSections>(scenario.parts);
	const [v2Parts, setV2Parts] = useState<ValueSections>(scenario.parts);
	const [resetKey, setResetKey] = useState(0);
	const [events, setEvents] = useState<Array<{ ts: number; kind: string; detail?: string }>>([]);
	const inputRef = useRef<HTMLElement | null>(null);
	const [v2Flag, setV2Flag] = useVariableInputV2Flag();

	// Reset state whenever the scenario changes so we don't accidentally
	// carry parts from one scenario into the next.
	useEffect(() => {
		setParts(scenario.parts);
		setV2Parts(scenario.parts);
		setEvents([]);
		setResetKey(k => k + 1);
	}, [scenario.id]);

	const handleEvent = useCallback((event: { kind: string; detail?: string }) => {
		setEvents(prev => [...prev.slice(-49), { ts: Date.now(), ...event }]);
	}, []);

	const selection = useSelectionTracker(inputRef);

	return (
		<Flex direction='column' h='100%' bg='bg.canvas'>
			<Flex align='center' gap='3' px='4' py='3' borderBottomWidth='1px' borderBottomColor='border.subtle' bg='bg.surface'>
				<Flex
					align='center'
					justify='center'
					w='28px'
					h='28px'
					borderRadius='sm'
					borderWidth='1px'
					borderStyle='solid'
					color='accent.teal'
					bg='color-mix(in srgb, var(--beak-colors-accent-teal) 14%, transparent)'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-teal) 26%, transparent)'
				>
					<FlaskConical size={14} strokeWidth={2} />
				</Flex>
				<Stack gap='0'>
					<Text fontSize='sm' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
						{'Variable input lab'}
					</Text>
					<Text fontSize='xs' color='fg.muted'>
						{'Sandbox for caret + selection behaviour. Live debug to the right.'}
					</Text>
				</Stack>
				<Box flex='1' />
				<Button
					size='xs'
					variant={v2Flag ? 'solid' : 'outline'}
					colorPalette={v2Flag ? 'pink' : undefined}
					onClick={() => setV2Flag(!v2Flag)}
					title='Persist the V2 preference to localStorage so call-sites that opt in pick it up. Both implementations always render in this lab.'
				>
					<Sparkles size={11} strokeWidth={2.2} style={{ marginRight: 4 }} />
					{v2Flag ? 'V2 preferred' : 'V2 off (preference)'}
				</Button>
				<Button
					size='xs'
					variant='outline'
					onClick={() => {
						setParts(scenario.parts);
						setV2Parts(scenario.parts);
						setEvents([]);
						setResetKey(k => k + 1);
					}}
				>
					<RotateCcw size={11} strokeWidth={2.2} style={{ marginRight: 4 }} />
					{'Reset scenario'}
				</Button>
			</Flex>

			<Flex flex='1' minH={0}>
				<Box w='220px' borderRightWidth='1px' borderRightColor='border.subtle' overflow='auto'>
					<ScenarioPicker scenarios={SCENARIOS} selectedId={scenarioId} onSelect={setScenarioId} />
				</Box>

				<Flex direction='column' flex='1' minW={0} p='5' gap='4' overflow='auto'>
					<Stack gap='2'>
						<Flex align='center' gap='2'>
							<Badge size='sm' variant='subtle' colorPalette='teal'>
								{scenario.label}
							</Badge>
							<Text fontSize='xs' color='fg.muted'>
								{scenario.notes}
							</Text>
						</Flex>

						<Box>
							<Text fontSize='10px' fontWeight='700' letterSpacing='0.08em' textTransform='uppercase' color='fg.subtle' mb='1'>
								{'Legacy contenteditable'}
							</Text>
							<Box
								key={`legacy-${resetKey}`}
								px='3'
								py='2'
								borderRadius='md'
								borderWidth='1px'
								borderColor='border.default'
								bg='bg.surface'
							>
								<PlaygroundInput ref={inputRef} scenario={scenario} parts={parts} onChange={setParts} onEvent={handleEvent} />
							</Box>
						</Box>

						<Box>
							<Flex align='center' gap='1.5' mb='1'>
								<Sparkles size={10} strokeWidth={2.4} color='var(--beak-colors-accent-pink)' />
								<Text fontSize='10px' fontWeight='700' letterSpacing='0.08em' textTransform='uppercase' color='accent.pink'>
									{'V2 — Lexical'}
								</Text>
							</Flex>
							<Box
								key={`v2-${resetKey}`}
								px='3'
								py='2'
								borderRadius='md'
								borderWidth='1px'
								borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent)'
								bg='bg.surface'
							>
								<PlaygroundInput scenario={scenario} parts={v2Parts} onChange={setV2Parts} onEvent={handleEvent} useV2 />
							</Box>
						</Box>

						<Flex gap='2' align='center' fontSize='xs' color='fg.subtle'>
							<Bug size={11} strokeWidth={2} />
							<Text>{'Try: type → select → click into a chip → backspace next to a chip → cmd+a → reload scenario.'}</Text>
						</Flex>
					</Stack>

					<DebugPanel parts={parts} selection={selection} events={events} />
				</Flex>
			</Flex>
		</Flex>
	);
};

export default VariableInputPlayground;
