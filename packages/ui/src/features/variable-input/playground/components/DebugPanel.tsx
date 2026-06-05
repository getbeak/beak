import type { ValueSections } from '@beak/ui/features/variables/values';
import { Box, Flex, Stack, Text } from '@chakra-ui/react';
import React from 'react';

import type { SelectionSnapshot } from '../hooks/use-selection-tracker';

interface DebugPanelProps {
	parts: ValueSections;
	selection: SelectionSnapshot;
	events: Array<{ ts: number; kind: string; detail?: string }>;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ parts, selection, events }) => (
	<Stack gap='3'>
		<Section title='ValueSections'>
			<pre style={preStyle}>{JSON.stringify(parts, null, 2)}</pre>
		</Section>

		<Section title='Selection (native)'>
			<Stack gap='1' fontSize='xs' fontFamily='mono'>
				<Row label='exists' value={String(selection.exists)} />
				<Row label='collapsed' value={String(selection.collapsed)} />
				<Row label='anchorNode' value={selection.anchorNodeName} />
				<Row label='anchorOffset' value={String(selection.anchorOffset)} />
				<Row label='focusNode' value={selection.focusNodeName} />
				<Row label='focusOffset' value={String(selection.focusOffset)} />
				<Row label='rangeText' value={JSON.stringify(selection.rangeText)} />
			</Stack>
		</Section>

		<Section title='Selection (normalized)'>
			<Stack gap='1' fontSize='xs' fontFamily='mono'>
				<Row label='partIndex' value={String(selection.partIndex ?? '—')} />
				<Row label='isTextNode' value={String(selection.isTextNode ?? '—')} />
				<Row label='offset' value={String(selection.offset ?? '—')} />
			</Stack>
		</Section>

		<Section title={`Events (${events.length})`}>
			<Box maxH='200px' overflow='auto' borderRadius='sm' bg='bg.canvas' borderWidth='1px' borderColor='border.subtle'>
				{events.length === 0 && (
					<Text fontSize='xs' color='fg.subtle' p='2'>
						{'No events yet — click into the input or type.'}
					</Text>
				)}
				{events.length > 0 && (
					<Stack gap='0' fontSize='10px' fontFamily='mono' divideY='1px' divideColor='border.subtle'>
						{events
							.slice()
							.reverse()
							.map((e, i) => (
								<Flex key={`${e.ts}-${i}`} gap='2' px='2' py='1' color='fg.muted'>
									<Box color='accent.teal' w='70px' flexShrink={0}>
										{e.kind}
									</Box>
									<Box color='fg.subtle' flex='1' minW='0' overflow='hidden' textOverflow='ellipsis'>
										{e.detail ?? ''}
									</Box>
								</Flex>
							))}
					</Stack>
				)}
			</Box>
		</Section>
	</Stack>
);

const preStyle: React.CSSProperties = {
	margin: 0,
	padding: '8px 10px',
	fontSize: 11,
	lineHeight: 1.4,
	background: 'var(--beak-colors-bg-canvas)',
	border: '1px solid var(--beak-colors-border-subtle)',
	borderRadius: 4,
	color: 'var(--beak-colors-fg-muted)',
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
	<Stack gap='1'>
		<Text fontSize='10px' fontWeight='700' color='fg.subtle' letterSpacing='0.08em' textTransform='uppercase'>
			{title}
		</Text>
		{children}
	</Stack>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
	<Flex gap='2'>
		<Box w='110px' color='fg.subtle'>
			{label}
		</Box>
		<Box color='fg.default' flex='1' minW='0' overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
			{value}
		</Box>
	</Flex>
);

export default DebugPanel;
