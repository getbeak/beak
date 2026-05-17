import type { WorkflowEdge, WorkflowNodeKind } from '@beak/state/workflows';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Button, Flex, Input, Stack, Textarea } from '@chakra-ui/react';
import { AlertTriangle, Bell, GitBranch, Globe, Repeat, StickyNote, Trash2, X } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

/**
 * Editor-chrome bits — the pieces that surround the xyflow canvas but
 * aren't the canvas itself. Pulled out of `WorkflowEditor.tsx` so the
 * editor file stays focused on graph plumbing.
 */

export type AddableNodeKind = Exclude<WorkflowNodeKind, 'start'>;

interface MetaPillProps {
	icon: React.ReactNode;
	count: number;
	label: string;
}

// Mirrors the variable-set editor's header pill so the two surfaces feel
// like siblings rather than two different visual languages.
export const MetaPill: React.FC<MetaPillProps> = ({ icon, count, label }) => (
	<Flex
		align='center'
		gap='1'
		px='1.5'
		h='18px'
		borderRadius='sm'
		borderWidth='1px'
		borderColor='border.subtle'
		bg='bg.canvas'
		color='fg.subtle'
		fontVariantNumeric='tabular-nums'
	>
		{icon}
		<Box as='span'>{count}</Box>
		<Box as='span' color='fg.muted'>
			{label}
		</Box>
	</Flex>
);

// "Saved 10s ago" / "Saving…" indicator next to the meta pills. Reads the
// workflow slice's debounce nonce + last-write timestamp directly. Falls
// back to workflow.updatedAt when latestWrite is 0 (in-memory mode where
// writes are no-ops but the reducer still stamps the workflow on each
// mutation), so the user gets feedback even without a disk-backed project.
export const SaveStateIndicator: React.FC<{ workflowId?: string }> = ({ workflowId }) => {
	const pending = useAppSelector(s => s.global.workflows.writeDebouncer);
	const latestWrite = useAppSelector(s => s.global.workflows.latestWrite ?? 0);
	const updatedAt = useAppSelector(s => (workflowId ? s.global.workflows.workflows[workflowId]?.updatedAt ?? 0 : 0));
	const latest = latestWrite || updatedAt;
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		// Tick every 5s so the "X ago" stamp doesn't lie. Skip while pending —
		// the label is just "Saving…" then, no need to repaint.
		if (pending) return;
		const id = window.setInterval(() => setNow(Date.now()), 5000);
		return () => window.clearInterval(id);
	}, [pending]);

	if (pending) {
		return (
			<Flex
				align='center'
				gap='1'
				px='1.5'
				h='18px'
				borderRadius='sm'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='bg.canvas'
				color='fg.muted'
			>
				<Box w='5px' h='5px' borderRadius='full' bg='accent.pink' />
				{'Saving…'}
			</Flex>
		);
	}
	if (!latest) return null;
	const seconds = Math.max(0, Math.floor((now - latest) / 1000));
	const label = formatSavedLabel(seconds);
	return (
		<Flex
			align='center'
			gap='1'
			px='1.5'
			h='18px'
			borderRadius='sm'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='bg.canvas'
			color='fg.muted'
			title={new Date(latest).toLocaleString()}
		>
			<Box w='5px' h='5px' borderRadius='full' bg='accent.success' />
			{label}
		</Flex>
	);
};

// Amber pill that appears when the graph picks up unreachable steps or
// unlinked request nodes — same shape as MetaPill so the two read as a row.
export const WarningPill: React.FC<{ count: number; label: string; title?: string; onClick?: () => void }> = ({
	count,
	label,
	title,
	onClick,
}) => {
	const clickable = Boolean(onClick);
	return (
		<Flex
			as={clickable ? 'button' : 'div'}
			align='center'
			gap='1'
			px='1.5'
			h='18px'
			borderRadius='sm'
			borderWidth='1px'
			borderColor='color-mix(in srgb, var(--beak-colors-accent-warning) 38%, transparent)'
			bg='color-mix(in srgb, var(--beak-colors-accent-warning) 14%, transparent)'
			color='accent.warning'
			fontVariantNumeric='tabular-nums'
			title={title}
			cursor={clickable ? 'pointer' : undefined}
			_hover={
				clickable
					? {
							bg: 'color-mix(in srgb, var(--beak-colors-accent-warning) 22%, transparent)',
						}
					: undefined
			}
			onClick={onClick}
		>
			<AlertTriangle size={10} strokeWidth={2.2} />
			<Box as='span'>{count}</Box>
			<Box as='span' opacity={0.85}>
				{label}
			</Box>
		</Flex>
	);
};

interface EmptySelectionPanelProps {
	addNode: (kind: AddableNodeKind) => void;
	unreachableCount: number;
	unlinkedCount: number;
	cycleCount: number;
	description: string;
	onChangeDescription: (next: string | undefined) => void;
	tags: string[];
	onChangeTags: (next: string[]) => void;
}

// Shown on the right when nothing's selected — gives the canvas an obvious
// "what next" instead of empty space. Buttons fire the same toolbar handlers
// so the user has one entry point for adding nodes regardless of focus.
export const EmptySelectionPanel: React.FC<EmptySelectionPanelProps> = ({
	addNode,
	unreachableCount,
	unlinkedCount,
	cycleCount,
	description,
	onChangeDescription,
	tags,
	onChangeTags,
}) => {
	const items: { kind: AddableNodeKind; icon: React.ReactNode; title: string; subtitle: string; tone: string }[] = [
		{
			kind: 'request',
			icon: <Globe size={14} strokeWidth={1.8} />,
			title: 'Request',
			subtitle: 'Run a linked request with per-step overrides.',
			tone: 'pink',
		},
		{
			kind: 'loop',
			icon: <Repeat size={14} strokeWidth={1.8} />,
			title: 'Loop',
			subtitle: 'Repeat the inner branch N times or for each item.',
			tone: 'teal',
		},
		{
			kind: 'condition',
			icon: <GitBranch size={14} strokeWidth={1.8} />,
			title: 'Condition',
			subtitle: 'Branch on a value — true/false outputs.',
			tone: 'indigo',
		},
		{
			kind: 'notification',
			icon: <Bell size={14} strokeWidth={1.8} />,
			title: 'Notification',
			subtitle: 'Fire a desktop notification at this step.',
			tone: 'warning',
		},
		{
			kind: 'comment',
			icon: <StickyNote size={14} strokeWidth={1.8} />,
			title: 'Comment',
			subtitle: 'Document a section — runs nothing, just a sticky note.',
			tone: 'warning',
		},
	];
	return (
		<Flex
			direction='column'
			w='320px'
			flexShrink={0}
			bg='bg.surface'
			borderLeftWidth='1px'
			borderColor='border.subtle'
			minH={0}
			overflowY='auto'
		>
			<Box px='3' py='3' borderBottomWidth='1px' borderColor='border.subtle'>
				<Box fontSize='10px' fontWeight='700' color='fg.muted' textTransform='uppercase' letterSpacing='0.06em' mb='1'>
					{'Description'}
				</Box>
				<Textarea
					size='sm'
					value={description}
					placeholder='What does this workflow do?'
					minH='60px'
					resize='vertical'
					onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeDescription(e.target.value)}
					onBlur={() => onChangeDescription(description.trim() || undefined)}
				/>
			</Box>
			<TagsEditor tags={tags} onChange={onChangeTags} />
			<Box px='3' py='3' borderBottomWidth='1px' borderColor='border.subtle'>
				<Box fontSize='10px' fontWeight='700' color='fg.muted' textTransform='uppercase' letterSpacing='0.06em'>
					{'Add a step'}
				</Box>
				<Box mt='1' fontSize='11px' color='fg.subtle' lineHeight='1.5'>
					{'Click a node to edit its details. Or add a new step from below — it lands next to your existing work.'}
				</Box>
			</Box>
			<Stack px='2' py='2' gap='1'>
				{items.map(item => (
					<Flex
						as='button'
						key={item.kind}
						role='button'
						align='flex-start'
						gap='2'
						px='2'
						py='2'
						bg='transparent'
						borderRadius='sm'
						cursor='pointer'
						textAlign='left'
						_hover={{ bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 6%, transparent)' }}
						onClick={() => addNode(item.kind)}
					>
						<Flex
							align='center'
							justify='center'
							w='24px'
							h='24px'
							flexShrink={0}
							borderRadius='sm'
							color={`accent.${item.tone}`}
							bg={`color-mix(in srgb, var(--beak-colors-accent-${item.tone}) 14%, transparent)`}
						>
							{item.icon}
						</Flex>
						<Stack gap='0.5' flex='1' minW={0}>
							<Box fontSize='12px' fontWeight='600' color='fg.default'>
								{item.title}
							</Box>
							<Box fontSize='11px' color='fg.subtle' lineHeight='1.4'>
								{item.subtitle}
							</Box>
						</Stack>
					</Flex>
				))}
			</Stack>
			{(unreachableCount > 0 || unlinkedCount > 0 || cycleCount > 0) && (
				<Box px='3' py='3' borderTopWidth='1px' borderColor='border.subtle'>
					<Box
						fontSize='10px'
						fontWeight='700'
						color='accent.warning'
						textTransform='uppercase'
						letterSpacing='0.06em'
						mb='1.5'
					>
						{'Heads up'}
					</Box>
					<Stack gap='1' fontSize='11px' color='fg.subtle' lineHeight='1.5'>
						{unreachableCount > 0 && (
							<Box>{`${unreachableCount} step${unreachableCount === 1 ? '' : 's'} not connected to Start.`}</Box>
						)}
						{unlinkedCount > 0 && (
							<Box>{`${unlinkedCount} request step${unlinkedCount === 1 ? '' : 's'} missing a linked request.`}</Box>
						)}
						{cycleCount > 0 && (
							<Box>{`${cycleCount} step${cycleCount === 1 ? '' : 's'} sit on a directed cycle — use a Loop node to bound iteration.`}</Box>
						)}
					</Stack>
				</Box>
			)}
			<Box flex='1' />
			<Box
				px='3'
				py='2.5'
				borderTopWidth='1px'
				borderColor='border.subtle'
				fontSize='10px'
				color='fg.subtle'
				lineHeight='1.5'
			>
				<Box mb='0.5'>
					<KbdHint>Esc</KbdHint> {'clear selection'}
				</Box>
				<Box mb='0.5'>
					<KbdHint>Delete</KbdHint> {'remove the selected step'}
				</Box>
				<Box mb='0.5'>
					<KbdHint>⌘ D</KbdHint> {'duplicate the selected step'}
				</Box>
				<Box mb='0.5'>
					<KbdHint>⌘ K</KbdHint> {'jump to a step by name'}
				</Box>
				<Box mb='0.5'>
					<KbdHint>R / L / C / N / M</KbdHint> {'add a step'}
				</Box>
				<Box mb='0.5'>
					<KbdHint>Double-click</KbdHint> {'a node to rename it'}
				</Box>
				<Box mb='0.5'>
					<KbdHint>↑ ↓ ← →</KbdHint> {'nudge selected (Shift = 5×)'}
				</Box>
				<Box mb='0.5'>
					<KbdHint>?</KbdHint> {'show all shortcuts'}
				</Box>
				<Box mb='0.5'>
					<KbdHint>⌘ .</KbdHint> {'fit viewport to selection / graph'}
				</Box>
				<Box mb='0.5'>
					<KbdHint>Right-click</KbdHint> {'an edge to delete it'}
				</Box>
				<Box>
					<KbdHint>Double-click</KbdHint> {'an edge to label it'}
				</Box>
			</Box>
		</Flex>
	);
};

interface EdgeInspectorPanelProps {
	edge: WorkflowEdge;
	sourceLabel: string;
	targetLabel: string;
	onRename: (label: string | undefined) => void;
	onDelete: () => void;
	onClose: () => void;
	onJumpToNode: (nodeId: string) => void;
}

/**
 * Right-side panel that mirrors the node properties panel but for an
 * edge selection — source / target / handle / inline label editor +
 * a Delete button. Click either endpoint to jump back to that node.
 */
export const EdgeInspectorPanel: React.FC<EdgeInspectorPanelProps> = ({
	edge,
	sourceLabel,
	targetLabel,
	onRename,
	onDelete,
	onClose,
	onJumpToNode,
}) => {
	const [draft, setDraft] = useState(edge.label ?? '');
	useEffect(() => {
		setDraft(edge.label ?? '');
	}, [edge.id, edge.label]);

	function commit() {
		const next = draft.trim();
		onRename(next || undefined);
	}

	return (
		<Flex
			direction='column'
			w='320px'
			flexShrink={0}
			bg='bg.surface'
			borderLeftWidth='1px'
			borderColor='border.subtle'
			minH={0}
		>
			<Flex align='center' h='38px' px='3' gap='2' borderBottomWidth='1px' borderColor='border.subtle' flexShrink={0}>
				<Box fontSize='10px' fontWeight='700' color='fg.muted' textTransform='uppercase' letterSpacing='0.06em' flex='1'>
					{'Edge'}
				</Box>
				<Button
					type='button'
					size='xs'
					variant='ghost'
					color='accent.alert'
					aria-label='Delete edge'
					onClick={onDelete}
					_hover={{ bg: 'color-mix(in srgb, var(--beak-colors-accent-alert) 14%, transparent)' }}
				>
					<Trash2 size={13} strokeWidth={1.8} />
				</Button>
				<Button
					type='button'
					size='xs'
					variant='ghost'
					color='fg.muted'
					aria-label='Close panel'
					onClick={onClose}
					_hover={{ color: 'fg.default' }}
				>
					<X size={14} strokeWidth={1.8} />
				</Button>
			</Flex>
			<Stack gap='3' px='3' py='3'>
				<Stack gap='1'>
					<Box fontSize='10px' fontWeight='700' color='fg.muted' textTransform='uppercase' letterSpacing='0.06em'>
						{'From'}
					</Box>
					<Flex
						as='button'
						role='button'
						align='center'
						gap='2'
						px='2'
						py='1.5'
						bg='bg.subtle'
						borderRadius='sm'
						borderWidth='1px'
						borderColor='border.subtle'
						cursor='pointer'
						_hover={{ borderColor: 'accent.pink' }}
						onClick={() => onJumpToNode(edge.source)}
					>
						<Box fontSize='12px' fontWeight='600' color='fg.default' flex='1' minW={0}>
							{sourceLabel}
						</Box>
						{edge.sourceHandle && (
							<Box fontSize='10px' color='fg.muted' fontFamily='mono'>
								{`:${edge.sourceHandle}`}
							</Box>
						)}
					</Flex>
				</Stack>
				<Stack gap='1'>
					<Box fontSize='10px' fontWeight='700' color='fg.muted' textTransform='uppercase' letterSpacing='0.06em'>
						{'To'}
					</Box>
					<Flex
						as='button'
						role='button'
						align='center'
						gap='2'
						px='2'
						py='1.5'
						bg='bg.subtle'
						borderRadius='sm'
						borderWidth='1px'
						borderColor='border.subtle'
						cursor='pointer'
						_hover={{ borderColor: 'accent.pink' }}
						onClick={() => onJumpToNode(edge.target)}
					>
						<Box fontSize='12px' fontWeight='600' color='fg.default' flex='1' minW={0}>
							{targetLabel}
						</Box>
						{edge.targetHandle && (
							<Box fontSize='10px' color='fg.muted' fontFamily='mono'>
								{`:${edge.targetHandle}`}
							</Box>
						)}
					</Flex>
				</Stack>
				<Stack gap='1'>
					<Box fontSize='10px' fontWeight='700' color='fg.muted' textTransform='uppercase' letterSpacing='0.06em'>
						{'Label'}
					</Box>
					<Input
						size='sm'
						value={draft}
						placeholder='e.g. happy path'
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
						onBlur={commit}
						onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								commit();
							}
						}}
					/>
					<Box fontSize='11px' color='fg.subtle' lineHeight='1.5'>
						{'Press Enter or click away to save. Empty = no label.'}
					</Box>
				</Stack>
			</Stack>
		</Flex>
	);
};

interface EdgeLabelEditorProps {
	screen: { x: number; y: number };
	initialLabel: string;
	onCommit: (label: string) => void;
	onCancel: () => void;
}

/**
 * Inline floating input for editing an edge's label — spawned on
 * double-click of an edge in xyflow. Enter commits, Escape cancels,
 * blur commits (matches the way every other inline-rename in Beak
 * works). Replaces the earlier `window.prompt` placeholder.
 */
export const EdgeLabelEditor: React.FC<EdgeLabelEditorProps> = ({ screen, initialLabel, onCommit, onCancel }) => {
	const [value, setValue] = useState(initialLabel);
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		inputRef.current?.focus();
		inputRef.current?.select();
	}, []);

	return (
		<Box
			position='fixed'
			left={`${screen.x}px`}
			top={`${screen.y}px`}
			transform='translate(-50%, -50%)'
			zIndex={50}
			minW='200px'
			bg='bg.surface'
			borderRadius='md'
			borderWidth='1px'
			borderColor='accent.pink'
			boxShadow='md'
		>
			<Input
				ref={inputRef}
				size='sm'
				variant='subtle'
				bg='transparent'
				borderWidth='0'
				value={value}
				placeholder='Edge label'
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
				onBlur={() => onCommit(value.trim())}
				onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						onCommit(value.trim());
					} else if (e.key === 'Escape') {
						e.preventDefault();
						onCancel();
					}
				}}
			/>
		</Box>
	);
};

interface PaneContextMenuProps {
	screen: { x: number; y: number };
	onPick: (kind: AddableNodeKind) => void;
	onClose: () => void;
}

const paneMenuItems: { kind: AddableNodeKind; icon: React.ReactNode; label: string; tone: string }[] = [
	{ kind: 'request', icon: <Globe size={13} strokeWidth={1.8} />, label: 'Request', tone: 'pink' },
	{ kind: 'loop', icon: <Repeat size={13} strokeWidth={1.8} />, label: 'Loop', tone: 'teal' },
	{ kind: 'condition', icon: <GitBranch size={13} strokeWidth={1.8} />, label: 'Condition', tone: 'indigo' },
	{ kind: 'notification', icon: <Bell size={13} strokeWidth={1.8} />, label: 'Notification', tone: 'warning' },
	{ kind: 'comment', icon: <StickyNote size={13} strokeWidth={1.8} />, label: 'Note', tone: 'warning' },
];

/**
 * Floating "Add step here" menu spawned by right-clicking the canvas
 * pane. Renders at the click position via fixed coordinates; closes on
 * Escape or any outside click. We deliberately avoid Chakra's MenuRoot
 * here — its trigger model doesn't match a context-menu position;
 * rolling a tiny absolute panel is simpler.
 */
export const PaneContextMenu: React.FC<PaneContextMenuProps> = ({ screen, onPick, onClose }) => {
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		function onDoc(event: MouseEvent) {
			if (ref.current && !ref.current.contains(event.target as Node)) onClose();
		}
		function onKey(event: KeyboardEvent) {
			if (event.key === 'Escape') onClose();
		}
		document.addEventListener('mousedown', onDoc);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDoc);
			document.removeEventListener('keydown', onKey);
		};
	}, [onClose]);

	return (
		<Box
			ref={ref}
			position='fixed'
			left={`${screen.x}px`}
			top={`${screen.y}px`}
			zIndex={50}
			minW='180px'
			bg='bg.surface'
			borderRadius='md'
			borderWidth='1px'
			borderColor='border.subtle'
			boxShadow='md'
			py='1'
			fontSize='12px'
			color='fg.default'
		>
			<Box
				px='2.5'
				py='1'
				fontSize='10px'
				fontWeight='700'
				color='fg.muted'
				textTransform='uppercase'
				letterSpacing='0.06em'
			>
				{'Add step here'}
			</Box>
			{paneMenuItems.map(item => (
				<Flex
					as='button'
					key={item.kind}
					role='menuitem'
					align='center'
					gap='2'
					px='2.5'
					py='1.5'
					textAlign='left'
					bg='transparent'
					cursor='pointer'
					_hover={{ bg: 'bg.subtle' }}
					onClick={() => onPick(item.kind)}
				>
					<Flex
						align='center'
						justify='center'
						w='18px'
						h='18px'
						borderRadius='sm'
						color={`accent.${item.tone}`}
						bg={`color-mix(in srgb, var(--beak-colors-accent-${item.tone}) 14%, transparent)`}
					>
						{item.icon}
					</Flex>
					<Box>{item.label}</Box>
				</Flex>
			))}
		</Box>
	);
};

/**
 * Pretty-print the "saved X ago" label. Under 5s reads as "just now"
 * to avoid the "0s ago" stutter right after a save; over an hour
 * drops the unit entirely since the user usually doesn't care.
 */
function formatSavedLabel(seconds: number): string {
	if (seconds < 5) return 'Saved just now';
	if (seconds < 60) return `Saved ${seconds}s ago`;
	if (seconds < 3600) return `Saved ${Math.floor(seconds / 60)}m ago`;
	return 'Saved';
}

interface MultiSelectPanelProps {
	count: number;
	onDelete: () => void;
	onClear: () => void;
}

/**
 * Replaces NodePropertiesPanel when more than one node is selected.
 * Editing properties of a heterogeneous set doesn't make sense (the
 * panel is kind-specific), so the multi-pane is just a delete + clear
 * harness. Single-node selection always falls back to the rich panel.
 */
export const MultiSelectPanel: React.FC<MultiSelectPanelProps> = ({ count, onDelete, onClear }) => (
	<Flex
		direction='column'
		w='320px'
		flexShrink={0}
		bg='bg.surface'
		borderLeftWidth='1px'
		borderColor='border.subtle'
		minH={0}
	>
		<Flex align='center' h='38px' px='3' gap='2' borderBottomWidth='1px' borderColor='border.subtle' flexShrink={0}>
			<Box fontSize='10px' fontWeight='700' color='fg.muted' textTransform='uppercase' letterSpacing='0.06em' flex='1'>
				{`${count} steps selected`}
			</Box>
			<Button
				type='button'
				size='xs'
				variant='ghost'
				color='fg.muted'
				aria-label='Clear selection'
				_hover={{ color: 'fg.default', bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)' }}
				onClick={onClear}
			>
				<X size={14} strokeWidth={1.8} />
			</Button>
		</Flex>
		<Stack gap='3' px='3' py='3'>
			<Box fontSize='12px' color='fg.subtle' lineHeight='1.5'>
				{
					'Editing properties is per-kind, so the panel switches to bulk actions when more than one step is selected. Start nodes are excluded from delete automatically.'
				}
			</Box>
			<Button type='button' size='sm' colorPalette='red' variant='outline' onClick={onDelete}>
				<Trash2 size={13} strokeWidth={1.8} />
				{`Delete ${count} steps`}
			</Button>
		</Stack>
		<Box flex='1' />
		<Box
			px='3'
			py='2.5'
			borderTopWidth='1px'
			borderColor='border.subtle'
			fontSize='10px'
			color='fg.subtle'
			lineHeight='1.5'
		>
			<Box mb='0.5'>
				<KbdHint>⌘ Click</KbdHint> {'toggle a step in the selection'}
			</Box>
			<Box mb='0.5'>
				<KbdHint>⌘ A</KbdHint> {'select every non-Start step'}
			</Box>
			<Box>
				<KbdHint>Delete</KbdHint> {'remove the entire selection'}
			</Box>
		</Box>
	</Flex>
);

/**
 * Tag chips + add input. Lives between Description and Add-a-step in
 * EmptySelectionPanel. The reducer normalises (trim/lowercase/dedupe)
 * so this component only needs to push the user's raw input through.
 */
const TagsEditor: React.FC<{ tags: string[]; onChange: (next: string[]) => void }> = ({ tags, onChange }) => {
	const [draft, setDraft] = useState('');

	function commitDraft() {
		const trimmed = draft.trim();
		if (!trimmed) return;
		onChange([...tags, trimmed]);
		setDraft('');
	}

	function removeAt(idx: number) {
		const next = [...tags];
		next.splice(idx, 1);
		onChange(next);
	}

	return (
		<Box px='3' py='3' borderBottomWidth='1px' borderColor='border.subtle'>
			<Box fontSize='10px' fontWeight='700' color='fg.muted' textTransform='uppercase' letterSpacing='0.06em' mb='1'>
				{'Tags'}
			</Box>
			<Flex wrap='wrap' gap='1' mb='1.5'>
				{tags.map((tag, i) => (
					<Flex
						key={tag}
						align='center'
						gap='1'
						px='1.5'
						h='18px'
						borderRadius='sm'
						borderWidth='1px'
						borderColor='border.subtle'
						bg='bg.canvas'
						color='fg.default'
						fontSize='10px'
					>
						<Box>{tag}</Box>
						<Box
							as='button'
							role='button'
							aria-label={`Remove tag ${tag}`}
							color='fg.muted'
							cursor='pointer'
							_hover={{ color: 'accent.alert' }}
							onClick={() => removeAt(i)}
						>
							<X size={9} strokeWidth={2.2} />
						</Box>
					</Flex>
				))}
			</Flex>
			<Input
				size='xs'
				value={draft}
				placeholder='Add a tag…'
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
				onBlur={commitDraft}
				onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						commitDraft();
					} else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
						// Backspace on empty input drops the trailing tag — matches the
						// pattern in most chip inputs (Mail, Linear).
						e.preventDefault();
						removeAt(tags.length - 1);
					}
				}}
			/>
		</Box>
	);
};

export const KbdHint: React.FC<React.PropsWithChildren> = ({ children }) => (
	<Box
		as='span'
		display='inline-block'
		px='1'
		mr='1'
		fontFamily='mono'
		fontSize='10px'
		fontWeight='600'
		color='fg.muted'
		bg='bg.canvas'
		borderRadius='sm'
		borderWidth='1px'
		borderColor='border.subtle'
	>
		{children}
	</Box>
);

interface EmptyCanvasCalloutProps {
	onAddRequest: () => void;
}

/**
 * Centered overlay shown on top of an empty canvas (only the Start node
 * present, no edges). Surfaces the hotkey grid so first-time users learn
 * R/L/C/N/M without needing to open the Help panel. The card sits inside
 * the ReactFlow container as an absolutely-positioned, click-through panel
 * except for its primary "Add a Request step" button.
 */
export const EmptyCanvasCallout: React.FC<EmptyCanvasCalloutProps> = ({ onAddRequest }) => (
	<Box
		position='absolute'
		left='50%'
		top='50%'
		transform='translate(-50%, -50%)'
		zIndex={5}
		pointerEvents='none'
		minW='320px'
		maxW='420px'
	>
		<Box
			pointerEvents='auto'
			borderWidth='1px'
			borderStyle='dashed'
			borderColor='border.emphasized'
			borderRadius='lg'
			bg='color-mix(in srgb, var(--beak-colors-bg-surface) 92%, transparent)'
			boxShadow='lg'
			p='5'
		>
			<Box fontSize='sm' fontWeight='700' color='fg.default' mb='1' letterSpacing='-0.005em'>
				{'A blank canvas.'}
			</Box>
			<Box fontSize='12px' color='fg.muted' mb='3' lineHeight='1.45'>
				{'Press a hotkey to drop a step next to Start, or right-click anywhere on the canvas to add one inline.'}
			</Box>
			<Flex gap='1' wrap='wrap' mb='3'>
				<KbdHint>R</KbdHint>
				<Box as='span' color='fg.subtle' fontSize='11px' mr='2'>
					Request
				</Box>
				<KbdHint>L</KbdHint>
				<Box as='span' color='fg.subtle' fontSize='11px' mr='2'>
					Loop
				</Box>
				<KbdHint>C</KbdHint>
				<Box as='span' color='fg.subtle' fontSize='11px' mr='2'>
					Condition
				</Box>
				<KbdHint>N</KbdHint>
				<Box as='span' color='fg.subtle' fontSize='11px' mr='2'>
					Notification
				</Box>
				<KbdHint>M</KbdHint>
				<Box as='span' color='fg.subtle' fontSize='11px'>
					Note
				</Box>
			</Flex>
			<Flex
				as='button'
				role='button'
				align='center'
				gap='2'
				px='3'
				py='1.5'
				borderRadius='md'
				bg='accent.pink'
				color='fg.onAccent'
				fontWeight='600'
				fontSize='12px'
				cursor='pointer'
				_hover={{ filter: 'brightness(1.05)' }}
				onClick={onAddRequest}
			>
				<Box>{'Add a Request step'}</Box>
			</Flex>
		</Box>
	</Box>
);

export const ToolbarButton: React.FC<{
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
	/**
	 * Optional shortcut + extended-tooltip blurb appended to the title
	 * attribute. The toolbar is dense and unlabelled by default — surfacing
	 * the keyboard binding on hover saves the user a trip to the cheat
	 * sheet for "what does Fork do, and is there a hotkey?".
	 */
	shortcut?: string;
	hint?: string;
}> = ({ icon, label, onClick, shortcut, hint }) => {
	const titleParts: string[] = [label];
	if (shortcut) titleParts[0] = `${label}  (${shortcut})`;
	if (hint) titleParts.push(hint);
	return (
		<Flex
			as='button'
			role='button'
			title={titleParts.join(' — ')}
			align='center'
			gap='1.5'
			px='2'
			h='24px'
			fontSize='12px'
			color='fg.muted'
			bg='transparent'
			borderRadius='sm'
			cursor='pointer'
			_hover={{
				color: 'fg.default',
				bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
			}}
			onClick={onClick}
		>
			{icon}
			<Box>{label}</Box>
		</Flex>
	);
};
