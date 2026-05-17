import { inspectGraph, recentWorkflows, searchWorkflows, validateWorkflow } from '@beak/state/workflows';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { actions as workflowActions } from '@beak/ui/store/workflows';
import { Box, chakra, Flex, Input } from '@chakra-ui/react';
import { Copy, Edit3, Pencil, Search, Trash2, Workflow as WorkflowIcon } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

const ChakraButton = chakra('button');

interface ContextMenuState {
	workflowId: string;
	screen: { x: number; y: number };
}

/**
 * Workflows sidebar section — mirrors the VariableSets row look so the two
 * project-level "global" lists feel like siblings. Click a row to open the
 * workflow editor tab. The section is rendered unconditionally so the
 * "+ New workflow" action button at the bottom is always reachable; an
 * empty list shows a one-line nudge instead.
 */
const Workflows: React.FC = () => {
	const dispatch = useDispatch();
	const selectedTabId = useAppSelector(s => s.features.tabs.selectedTab);
	const workflows = useAppSelector(s => s.global.workflows.workflows);
	const [menu, setMenu] = React.useState<ContextMenuState | null>(null);
	const [filter, setFilter] = React.useState('');
	const [renamingId, setRenamingId] = React.useState<string | null>(null);
	const total = Object.keys(workflows).length;
	// Sort by updatedAt desc so the most recently-edited workflow is always
	// near the top — saves the user from scanning a long list. Legacy
	// (no-timestamp) files trail in insertion order via the helper's rule.
	// When a filter is typed, switch to searchWorkflows scoring instead so
	// the row order matches the user's mental model of "best match first".
	const entries = React.useMemo(() => {
		const trimmed = filter.trim();
		if (trimmed === '') return recentWorkflows(workflows);
		// "#auth" → filter to workflows that declare the "auth" tag. Skipping
		// the empty-after-# case so a lone "#" still falls through to the
		// general fuzzy search (the user might be mid-typing).
		if (trimmed.startsWith('#') && trimmed.length > 1) {
			const tag = trimmed.slice(1).trim().toLowerCase();
			if (tag.length > 0) {
				return recentWorkflows(workflows).filter(wf => (wf.tags ?? []).some(t => t === tag));
			}
		}
		const ranked = searchWorkflows(workflows, trimmed);
		return ranked.map(r => workflows[r.id]).filter((wf): wf is NonNullable<typeof wf> => Boolean(wf));
	}, [filter, workflows]);

	if (total === 0) {
		return (
			<Box px='3' py='2' fontSize='11px' color='fg.subtle' lineHeight='1.45'>
				{'Chain requests together. Use the workflow icon at the top of the explorer to add one.'}
			</Box>
		);
	}

	const showFilter = total >= 3;

	return (
		<>
			<Flex direction='column' minW={0}>
				{showFilter && (
					<Box px='3' pt='1' pb='1' position='relative'>
						<Box position='absolute' left='17px' top='50%' transform='translateY(-50%)' pointerEvents='none' color='fg.subtle'>
							<Search size={11} strokeWidth={1.8} />
						</Box>
						<Input
							size='xs'
							placeholder='Filter workflows… (#tag)'
							value={filter}
							onChange={event => setFilter(event.target.value)}
							pl='6'
							fontSize='11px'
							title='Type to fuzzy-search. Prefix with # to filter by exact tag.'
						/>
					</Box>
				)}
				{entries.length === 0 ? (
					<Box px='3' py='2' fontSize='11px' color='fg.subtle' lineHeight='1.45'>
						{`No workflow matches “${filter.trim()}”.`}
					</Box>
				) : (
					renderRows()
				)}
			</Flex>
			{menu && (
				<WorkflowRowContextMenu
					screen={menu.screen}
					workflowName={workflows[menu.workflowId]?.name ?? 'Untitled workflow'}
					onOpen={() => {
						dispatch(changeTab({ type: 'workflow_editor', payload: menu.workflowId, temporary: false }));
						setMenu(null);
					}}
					onRename={() => {
						setRenamingId(menu.workflowId);
						setMenu(null);
					}}
					onDuplicate={() => {
						dispatch(workflowActions.duplicateWorkflow({ sourceId: menu.workflowId }));
						setMenu(null);
					}}
					onDelete={() => {
						dispatch(workflowActions.removeWorkflowFromDisk({ id: menu.workflowId, withConfirmation: true }));
						setMenu(null);
					}}
					onClose={() => setMenu(null)}
				/>
			)}
		</>
	);

	function renderRows() {
		return entries.map(wf => {
				const isActive = selectedTabId === wf.id;
				const nodeCount = wf.nodes.length;
				const health = inspectGraph(wf);
				const warnings = validateWorkflow(wf);
				const issueCount =
					health.unreachable.length + health.unlinkedRequestNodes.length + health.cycleNodes.length + warnings.size;
				const dotColor =
					issueCount > 0
						? 'var(--beak-colors-accent-warning)'
						: nodeCount > 1
							? 'var(--beak-colors-accent-success)'
							: 'var(--beak-colors-fg-subtle)';
				return (
					<ChakraButton
						type='button'
						key={wf.id}
						title={composeTreeTooltip(wf.description, wf.updatedAt)}
						onClick={() => {
							if (renamingId === wf.id) return;
							dispatch(changeTab({ type: 'workflow_editor', payload: wf.id, temporary: true }));
						}}
						onDoubleClick={() => {
							if (renamingId === wf.id) return;
							dispatch(changeTab({ type: 'workflow_editor', payload: wf.id, temporary: false }));
						}}
						onContextMenu={event => {
							event.preventDefault();
							if (renamingId === wf.id) return;
							setMenu({ workflowId: wf.id, screen: { x: event.clientX, y: event.clientY } });
						}}
						display='flex'
						alignItems='center'
						gap='2'
						w='100%'
						minW={0}
						h='26px'
						px='3'
						border='none'
						bg={isActive ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)' : 'transparent'}
						color={isActive ? 'accent.pink' : 'fg.default'}
						fontSize='12px'
						fontWeight='500'
						textAlign='left'
						cursor='pointer'
						transition='background-color .1s linear, color .1s linear'
						_hover={{
							bg: isActive
								? 'color-mix(in srgb, var(--beak-colors-accent-pink) 16%, transparent)'
								: 'color-mix(in srgb, var(--beak-colors-fg-default) 5%, transparent)',
						}}
						_focusVisible={{
							outline: 'none',
							boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent)',
						}}
					>
						<Flex
							align='center'
							justify='center'
							w='14px'
							h='14px'
							flexShrink={0}
							color={isActive ? 'accent.pink' : 'fg.subtle'}
							position='relative'
						>
							<WorkflowIcon size={11} strokeWidth={1.8} />
							<Box
								position='absolute'
								top='-1px'
								right='-1px'
								w='6px'
								h='6px'
								borderRadius='full'
								bg={dotColor}
								borderWidth='1.5px'
								borderColor='bg.surface'
							/>
						</Flex>
						{renamingId === wf.id ? (
							<Box flex='1 1 auto' minW={0}>
								<InlineRename
									initial={wf.name ?? ''}
									onCommit={next => {
										const trimmed = next.trim();
										if (trimmed && trimmed !== wf.name) {
											dispatch(workflowActions.updateWorkflowName({ id: wf.id, name: trimmed }));
										}
										setRenamingId(null);
									}}
									onCancel={() => setRenamingId(null)}
								/>
							</Box>
						) : (
							<Box flex='1 1 auto' minW={0} overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
								{wf.name || 'Untitled workflow'}
							</Box>
						)}
						{wf.tags && wf.tags.length > 0 && (
							<Flex gap='1' flexShrink={0} alignItems='center'>
								{wf.tags.slice(0, 2).map(tag => (
									<Box
										key={tag}
										fontSize='9px'
										px='1'
										h='14px'
										display='inline-flex'
										alignItems='center'
										borderRadius='sm'
										borderWidth='1px'
										borderColor='border.subtle'
										bg='bg.canvas'
										color='fg.muted'
									>
										{tag}
									</Box>
								))}
								{wf.tags.length > 2 && (
									<Box fontSize='9px' color='fg.subtle'>
										{`+${wf.tags.length - 2}`}
									</Box>
								)}
							</Flex>
						)}
						<Box
							as='span'
							flexShrink={0}
							fontSize='10.5px'
							fontVariantNumeric='tabular-nums'
							color={isActive ? 'accent.pink' : 'fg.subtle'}
							opacity={0.7}
							title={
								issueCount > 0
									? `${issueCount} issue${issueCount === 1 ? '' : 's'}`
									: undefined
							}
						>
							{issueCount > 0 ? `${issueCount} issue${issueCount === 1 ? '' : 's'}` : `${nodeCount} step${nodeCount === 1 ? '' : 's'}`}
						</Box>
					</ChakraButton>
				);
			});
	}
};

/**
 * Compose a multi-line tooltip from description + last-edited stamp.
 * Returns undefined when neither is set so the title attr drops off.
 */
function composeTreeTooltip(description: string | undefined, updatedAt: number | undefined): string | undefined {
	const lines: string[] = [];
	const trimmed = description?.trim();
	if (trimmed) lines.push(trimmed);
	if (updatedAt) lines.push(`Last edited ${formatAgo(Date.now() - updatedAt)}`);
	return lines.length === 0 ? undefined : lines.join('\n');
}

function formatAgo(ms: number): string {
	const seconds = Math.max(0, Math.floor(ms / 1000));
	if (seconds < 60) return 'just now';
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

interface WorkflowRowContextMenuProps {
	screen: { x: number; y: number };
	workflowName: string;
	onOpen: () => void;
	onRename: () => void;
	onDuplicate: () => void;
	onDelete: () => void;
	onClose: () => void;
}

/**
 * Floating right-click menu for a workflow row in the project pane.
 * Mirrors the canvas PaneContextMenu — a fixed-position panel that
 * closes on outside-click or Escape. Sits at the bottom of the file so
 * the row component stays focused on the row itself.
 */
const WorkflowRowContextMenu: React.FC<WorkflowRowContextMenuProps> = props => {
	const { screen, workflowName, onOpen, onRename, onDuplicate, onDelete, onClose } = props;
	const ref = React.useRef<HTMLDivElement | null>(null);

	React.useEffect(() => {
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

	const items: { label: string; icon: React.ReactNode; onClick: () => void; tone?: 'danger' }[] = [
		{ label: 'Open', icon: <Pencil size={12} strokeWidth={1.8} />, onClick: onOpen },
		{ label: 'Rename', icon: <Edit3 size={12} strokeWidth={1.8} />, onClick: onRename },
		{ label: 'Duplicate', icon: <Copy size={12} strokeWidth={1.8} />, onClick: onDuplicate },
		{ label: 'Delete…', icon: <Trash2 size={12} strokeWidth={1.8} />, onClick: onDelete, tone: 'danger' },
	];

	return (
		<Box
			ref={ref}
			position='fixed'
			left={`${screen.x}px`}
			top={`${screen.y}px`}
			zIndex={50}
			minW='190px'
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
				overflow='hidden'
				textOverflow='ellipsis'
				whiteSpace='nowrap'
			>
				{workflowName}
			</Box>
			{items.map(item => (
				<Flex
					as='button'
					key={item.label}
					role='menuitem'
					align='center'
					gap='2'
					w='100%'
					px='2.5'
					py='1.5'
					textAlign='left'
					bg='transparent'
					cursor='pointer'
					color={item.tone === 'danger' ? 'accent.alert' : 'fg.default'}
					_hover={{ bg: 'bg.subtle' }}
					onClick={item.onClick}
				>
					<Box w='14px' h='14px' display='inline-flex' alignItems='center' justifyContent='center'>
						{item.icon}
					</Box>
					<Box>{item.label}</Box>
				</Flex>
			))}
		</Box>
	);
};

interface InlineRenameProps {
	initial: string;
	onCommit: (next: string) => void;
	onCancel: () => void;
}

/**
 * Tiny controlled Input that mounts pre-selected with the current name
 * so the user can start typing immediately. Enter commits; Escape /
 * blur cancels — same contract as the tree-view rename pattern. Stops
 * row-level click/double-click propagation so a click in the input
 * doesn't accidentally trip the tab-change handler on the surrounding
 * ChakraButton row.
 */
const InlineRename: React.FC<InlineRenameProps> = ({ initial, onCommit, onCancel }) => {
	const [value, setValue] = React.useState(initial);
	const ref = React.useRef<HTMLInputElement | null>(null);

	React.useEffect(() => {
		const input = ref.current;
		if (!input) return;
		input.focus();
		input.select();
	}, []);

	return (
		<Input
			ref={ref}
			size='xs'
			variant='subtle'
			value={value}
			onChange={event => setValue(event.target.value)}
			onClick={event => event.stopPropagation()}
			onDoubleClick={event => event.stopPropagation()}
			onKeyDown={event => {
				if (event.key === 'Enter') {
					event.preventDefault();
					event.stopPropagation();
					onCommit(value);
				} else if (event.key === 'Escape') {
					event.preventDefault();
					event.stopPropagation();
					onCancel();
				}
			}}
			onBlur={() => onCancel()}
			fontSize='12px'
			h='20px'
			px='1'
		/>
	);
};

export default Workflows;
