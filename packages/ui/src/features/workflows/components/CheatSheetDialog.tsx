import { Box, Dialog, Flex, Stack } from '@chakra-ui/react';
import * as React from 'react';

import { KbdHint } from './editor-chrome';

interface CheatSheetDialogProps {
	open: boolean;
	onClose: () => void;
}

/**
 * Single surface that lists every keyboard + mouse affordance in the
 * workflow editor. Opened via "?" (no modifiers). Sections grouped
 * by what the user is doing (selecting / adding / editing / saving)
 * rather than by key, so newcomers can scan it as a feature list.
 */
const CheatSheetDialog: React.FC<CheatSheetDialogProps> = ({ open, onClose }) => (
	<Dialog.Root open={open} onOpenChange={d => (d.open ? null : onClose())} size='md' placement='center'>
		<Dialog.Backdrop />
		<Dialog.Positioner>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>{'Workflow editor shortcuts'}</Dialog.Title>
				</Dialog.Header>
				<Dialog.Body>
					<Stack gap='4'>
						<Section title='Adding steps'>
							<Row keys={['R']} desc='Add Request' />
							<Row keys={['L']} desc='Add Loop' />
							<Row keys={['C']} desc='Add Condition' />
							<Row keys={['N']} desc='Add Notification' />
							<Row keys={['M']} desc='Add Comment' />
							<Row keys={['Right-click pane']} desc='Add a step at the cursor (auto-wires from selection)' />
						</Section>

						<Section title='Selecting'>
							<Row keys={['Click']} desc='Replace selection with the clicked node' />
							<Row keys={['⌘ Click']} desc='Toggle the clicked node in/out of the selection' />
							<Row keys={['Shift Drag']} desc='Lasso multi-select' />
							<Row keys={['⌘ A']} desc='Select every non-Start node' />
							<Row keys={['Esc']} desc='Clear selection' />
							<Row keys={['⌘ K']} desc='Jump to a step by name / kind / id' />
						</Section>

						<Section title='Editing'>
							<Row keys={['Double-click node']} desc='Inline rename' />
							<Row keys={['Double-click edge']} desc='Set / clear an edge label' />
							<Row keys={['Right-click edge']} desc='Delete the edge' />
							<Row keys={['⌘ D']} desc='Duplicate selected node next to its source' />
							<Row keys={['Delete', 'Backspace']} desc='Remove selected node(s) or edge' />
							<Row keys={['↑ ↓ ← →']} desc='Nudge selected by 20px (Shift = 5×)' />
						</Section>

						<Section title='Workflow'>
							<Row keys={['Simulate']} desc='Walk the graph with default resolvers' />
							<Row keys={['Tidy']} desc='BFS-rank auto-layout' />
							<Row keys={['Compact']} desc='Shift the graph back to the origin' />
							<Row keys={['Fit', '⌘ .']} desc='Fit viewport to graph (or selection)' />
							<Row keys={['Stats']} desc='Per-kind / per-handle breakdown' />
							<Row keys={['Doc']} desc='Copy workflow as Markdown' />
							<Row keys={['Copy / Paste']} desc='Workflow JSON to/from clipboard (Paste re-keys ids)' />
							<Row keys={['Merge']} desc='Graft clipboard JSON into this workflow' />
						</Section>

						<Section title='Help'>
							<Row keys={['?', '⌘ /']} desc='Open this cheat sheet' />
						</Section>
					</Stack>
				</Dialog.Body>
			</Dialog.Content>
		</Dialog.Positioner>
	</Dialog.Root>
);

const Section: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => (
	<Stack gap='1.5'>
		<Box fontSize='10px' fontWeight='700' color='fg.muted' textTransform='uppercase' letterSpacing='0.06em'>
			{title}
		</Box>
		<Stack gap='0.5'>{children}</Stack>
	</Stack>
);

const Row: React.FC<{ keys: string[]; desc: string }> = ({ keys, desc }) => (
	<Flex align='center' gap='2' px='2' py='1' bg='bg.subtle' borderRadius='sm'>
		<Flex gap='1' minW='110px' flexShrink={0} wrap='wrap'>
			{keys.map(k => (
				<KbdHint key={k}>{k}</KbdHint>
			))}
		</Flex>
		<Box fontSize='12px' color='fg.default' flex='1'>
			{desc}
		</Box>
	</Flex>
);

export default CheatSheetDialog;
