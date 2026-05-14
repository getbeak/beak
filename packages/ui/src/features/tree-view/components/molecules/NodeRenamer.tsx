import { Box } from '@chakra-ui/react';
import * as React from 'react';
import { useContext, useEffect, useRef, useState } from 'react';
import validFilename from 'valid-filename';

import { TreeViewAbstractionsContext } from '../../contexts/abstractions-context';
import { TreeViewFocusContext } from '../../contexts/focus-context';
import { useActiveRename } from '../../hooks/use-active-rename';
import type { TreeViewItem } from '../../types';

const errors = {
	noName: 'A name must be provided.',
	notValid: 'The name given is not valid.',
};

interface NodeRenamerProps {
	node: TreeViewItem;
}

const NodeRenamer: React.FC<NodeRenamerProps> = ({ node }) => {
	const absContext = useContext(TreeViewAbstractionsContext);
	const focusContext = useContext(TreeViewFocusContext);
	const [activeRename, renaming] = useActiveRename(node);

	const [canShowTooltip, setCanShowTooltip] = useState(false);
	const [error, setError] = useState<string | undefined>(void 0);
	const renameInputRef = useRef<HTMLInputElement>(null);
	const wrappedTextRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		renameInputRef.current?.focus();
		renameInputRef.current?.select();
	}, [activeRename?.id]);

	useEffect(() => {
		if (activeRename || !wrappedTextRef.current) return void 0;

		const element = wrappedTextRef.current;

		// Recompute overflow on each resize tick — capturing it once during
		// effect setup left the tooltip flag stuck on whatever the initial
		// layout said, regardless of later width changes.
		const update = () => {
			setCanShowTooltip(
				element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight,
			);
		};

		update();

		const resizeObserver = new ResizeObserver(update);
		resizeObserver.observe(element);

		return () => {
			resizeObserver.disconnect();
			setCanShowTooltip(false);
		};
	}, [activeRename]);

	if (!renaming) {
		return (
			<Box
				data-tooltip-id='tt-variables-renderer-extension-missing'
				data-tooltip-content={node.name}
				data-tooltip-place='top-end'
				data-tooltip-hidden={!canShowTooltip}
				ref={wrappedTextRef}
				overflow='hidden'
				whiteSpace='nowrap'
				textOverflow='ellipsis'
			>
				{node.name}
			</Box>
		);
	}

	function updateEditValue(value: string) {
		absContext.onRenameUpdated?.(node, value);

		switch (true) {
			case value === '':
				setError(errors.noName);
				break;
			case !validFilename(value):
				setError(errors.notValid);
				break;
			default:
				setError(void 0);
				break;
		}
	}

	const borderColor = error ? 'var(--beak-colors-accent-alert)' : 'var(--beak-colors-accent-pink)';
	const ringColor = error ? 'var(--beak-colors-accent-alert)' : 'var(--beak-colors-accent-pink)';

	return (
		<Box position='relative' flexGrow={2} textOverflow='ellipsis'>
			<input
				ref={renameInputRef}
				type='text'
				value={activeRename!.name}
				style={{
					border: `1px solid ${borderColor}`,
					borderRadius: '4px',
					backgroundColor: 'var(--beak-colors-bg-surface)',
					color: 'var(--beak-colors-fg-default)',
					caretColor: 'var(--beak-colors-accent-pink)',
					width: 'calc(100% - 4px)',
					padding: '2px 6px',
					fontSize: '12px',
					lineHeight: '16px',
					outline: 'none',
					boxShadow: `0 0 0 2px color-mix(in srgb, ${ringColor} 22%, transparent)`,
				}}
				onBlur={() => absContext.onRenameEnded?.(node)}
				onKeyDown={e => {
					if (!['Escape', 'Enter'].includes(e.key)) return;
					if (e.key === 'Escape') absContext.onRenameEnded?.(node);
					if (e.key === 'Enter') {
						if (error !== void 0) return;
						absContext.onRenameSubmitted?.(node);
					}
					focusContext.setFocusedNodeId(node.id);
				}}
				onChange={e => updateEditValue(e.currentTarget.value)}
			/>
			{error && (
				<Box
					position='absolute'
					top='28px'
					left='0'
					right='4px'
					bg='color-mix(in srgb, var(--beak-colors-accent-alert) 10%, var(--beak-colors-bg-surface))'
					borderWidth='1px'
					borderColor='accent.alert'
					borderRadius='md'
					color='accent.alert'
					px='2'
					py='1'
					fontSize='10px'
					fontWeight='600'
					letterSpacing='0.02em'
					zIndex={2}
					boxShadow='0 6px 14px color-mix(in srgb, var(--beak-colors-accent-alert) 20%, transparent)'
				>
					{error}
				</Box>
			)}
		</Box>
	);
};

export default NodeRenamer;
