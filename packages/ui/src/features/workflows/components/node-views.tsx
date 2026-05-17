import { verbToColor, verbToShortLabel } from '@beak/design-system/helpers';
import { overrideBadgeText, previewValueSections, type RequestOverrides } from '@beak/state/workflows';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex, Stack } from '@chakra-ui/react';
import type { RequestNode as ProjectRequestNode } from '@getbeak/types/nodes';
import { Handle, type NodeProps, Position } from '@xyflow/react';
import { Bell, GitBranch, Globe, Play, Repeat } from 'lucide-react';
import * as React from 'react';

/**
 * Canvas node views for the workflow editor. Each kind owns its visual
 * language via `NodeShell` (header tone, icon, body, branch handles).
 *
 * Split out of `WorkflowEditor.tsx` so the editor file stays focused on
 * xyflow plumbing and the kind-specific rendering can grow independently
 * (every new node kind gets a tiny function here, nothing else).
 */

interface BranchHandle {
	id: string;
	label: string;
	tone: string;
}

/**
 * Compact pill: coloured kind header + a kind-specific body. When a node has
 * multiple outbound branches (loop body/after, condition true/false) we render
 * labelled handle rows at the bottom instead of bare dots. xyflow positions
 * each Handle by its actual DOM bounds, so the row layout drives the edge
 * endpoints automatically — no fragile fixed pixel offsets.
 */
const NodeShell: React.FC<{
	tone: string;
	icon: React.ReactNode;
	title: string;
	selected?: boolean;
	noInput?: boolean;
	noOutput?: boolean;
	rightHandles?: BranchHandle[];
	children?: React.ReactNode;
}> = ({ tone, icon, title, selected, noInput, noOutput, rightHandles, children }) => (
	<Box
		minW='200px'
		maxW='260px'
		borderRadius='md'
		bg='bg.surface'
		borderWidth='1px'
		borderColor={selected ? `accent.${tone}` : 'border.default'}
		boxShadow={selected ? `0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-${tone}) 28%, transparent)` : 'sm'}
		fontSize='12px'
		color='fg.default'
		position='relative'
		transition='border-color .12s ease, box-shadow .12s ease'
	>
		{!noInput && <Handle type='target' position={Position.Left} />}
		<Flex
			align='center'
			gap='2'
			px='2.5'
			py='1.5'
			borderTopRadius='md'
			bg={`color-mix(in srgb, var(--beak-colors-accent-${tone}) 16%, transparent)`}
			color={`accent.${tone}`}
		>
			{icon}
			<Box fontWeight='600' fontSize='11px' textTransform='uppercase' letterSpacing='0.04em'>
				{title}
			</Box>
		</Flex>
		{children}
		{rightHandles && rightHandles.length > 0 && (
			<Box borderTopWidth='1px' borderColor='border.subtle'>
				{rightHandles.map(h => (
					<Box
						key={h.id}
						position='relative'
						px='2.5'
						py='1.5'
						_notLast={{ borderBottomWidth: '1px', borderColor: 'border.subtle' }}
					>
						<Flex
							align='center'
							gap='1.5'
							justify='flex-end'
							fontSize='10px'
							fontWeight='600'
							color={`accent.${h.tone}`}
						>
							<Box w='5px' h='5px' borderRadius='full' bg='currentColor' />
							{h.label}
						</Flex>
						<Handle id={h.id} type='source' position={Position.Right} />
					</Box>
				))}
			</Box>
		)}
		{!rightHandles && !noOutput && <Handle type='source' position={Position.Right} />}
	</Box>
);

const VerbBadge: React.FC<{ verb: string }> = ({ verb }) => (
	<Box
		display='inline-flex'
		alignItems='center'
		justifyContent='center'
		minW='38px'
		h='18px'
		px='1.5'
		borderRadius='sm'
		fontSize='9px'
		fontWeight='700'
		letterSpacing='0.04em'
		color='fg.onAccent'
		bg={verbToColor(verb)}
	>
		{verbToShortLabel(verb)}
	</Box>
);

export function RequestNodeView({ data, selected }: NodeProps) {
	const d = data as { requestId: string | null; overrides?: RequestOverrides };
	const linked = useAppSelector(s => {
		if (!d.requestId) return undefined;
		const node = s.global.project.tree[d.requestId];
		return node?.type === 'request' ? (node as ProjectRequestNode) : undefined;
	});

	const overrideBadge = overrideBadgeText(d.overrides);
	const verb = linked?.mode === 'valid' ? linked.info.verb : 'get';
	const urlPreview = linked?.mode === 'valid' ? previewValueSections(linked.info.url) : '';

	return (
		<NodeShell tone='pink' icon={<Globe size={12} strokeWidth={1.8} />} title='Request' selected={selected}>
			{!d.requestId ? (
				<Box px='2.5' py='2' color='fg.subtle' fontStyle='italic'>
					{'Pick a request →'}
				</Box>
			) : !linked ? (
				<Box px='2.5' py='2' color='accent.alert' fontSize='11px'>
					{'Request not found'}
				</Box>
			) : (
				<Stack gap='1' px='2.5' py='2'>
					<Flex align='center' gap='2'>
						<VerbBadge verb={verb} />
						<Box
							flex='1'
							minW={0}
							fontWeight='600'
							fontSize='12px'
							whiteSpace='nowrap'
							overflow='hidden'
							textOverflow='ellipsis'
						>
							{linked.name}
						</Box>
					</Flex>
					{urlPreview && (
						<Box
							fontSize='10px'
							color='fg.muted'
							whiteSpace='nowrap'
							overflow='hidden'
							textOverflow='ellipsis'
							fontFamily='mono'
						>
							{urlPreview}
						</Box>
					)}
					{overrideBadge && (
						<Flex
							alignSelf='flex-start'
							align='center'
							gap='1'
							mt='0.5'
							px='1.5'
							h='16px'
							borderRadius='sm'
							fontSize='9px'
							fontWeight='600'
							letterSpacing='0.04em'
							textTransform='uppercase'
							color='accent.pink'
							bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
						>
							{overrideBadge}
						</Flex>
					)}
				</Stack>
			)}
		</NodeShell>
	);
}

export function StartNodeView({ selected }: NodeProps) {
	return (
		<NodeShell
			tone='success'
			icon={<Play size={12} strokeWidth={2} fill='currentColor' />}
			title='Start'
			selected={selected}
			noInput
		>
			<Box px='2.5' py='1.5' color='fg.subtle' fontSize='11px' fontStyle='italic'>
				{'Workflow entry point'}
			</Box>
		</NodeShell>
	);
}

export function LoopNodeView({ data, selected }: NodeProps) {
	const d = data as { mode: 'count' | 'forEach'; count?: number };
	const subtitle = d.mode === 'count' ? `Repeat ${d.count ?? 0} ×` : 'For each item';
	return (
		<NodeShell
			tone='teal'
			icon={<Repeat size={12} strokeWidth={1.8} />}
			title='Loop'
			selected={selected}
			rightHandles={[
				{ id: 'body', label: 'body', tone: 'teal' },
				{ id: 'after', label: 'after', tone: 'pink' },
			]}
		>
			<Box px='2.5' py='2' color='fg.muted'>
				{subtitle}
			</Box>
		</NodeShell>
	);
}

const operatorLabels: Record<string, string> = {
	equals: '=',
	not_equals: '≠',
	contains: 'contains',
	truthy: 'is truthy',
	falsy: 'is falsy',
};

export function ConditionNodeView({ data, selected }: NodeProps) {
	const d = data as { operator: string };
	return (
		<NodeShell
			tone='indigo'
			icon={<GitBranch size={12} strokeWidth={1.8} />}
			title='Condition'
			selected={selected}
			rightHandles={[
				{ id: 'true', label: 'true', tone: 'success' },
				{ id: 'false', label: 'false', tone: 'alert' },
			]}
		>
			<Box px='2.5' py='2' color='fg.muted'>
				{operatorLabels[d.operator] ?? d.operator}
			</Box>
		</NodeShell>
	);
}

export function NotificationNodeView({ data, selected }: NodeProps) {
	const d = data as { title?: unknown[]; body?: unknown[] };
	const title = previewValueSections(d.title) || 'Untitled notification';
	return (
		<NodeShell tone='warning' icon={<Bell size={12} strokeWidth={1.8} />} title='Notification' selected={selected}>
			<Box
				px='2.5'
				py='2'
				color='fg.default'
				fontWeight='600'
				fontSize='12px'
				whiteSpace='nowrap'
				overflow='hidden'
				textOverflow='ellipsis'
			>
				{title}
			</Box>
		</NodeShell>
	);
}

export const nodeTypes = {
	start: StartNodeView,
	request: RequestNodeView,
	loop: LoopNodeView,
	condition: ConditionNodeView,
	notification: NotificationNodeView,
};
