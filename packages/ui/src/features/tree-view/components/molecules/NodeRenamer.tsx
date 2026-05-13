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
		const textOverflowed = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;

		const resizeObserver = new ResizeObserver(() => {
			setCanShowTooltip(textOverflowed);
		});

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

	return (
		<Box position='relative' flexGrow={2} textOverflow='ellipsis'>
			<input
				ref={renameInputRef}
				type='text'
				value={activeRename!.name}
				style={{
					border: `1px solid ${error ? 'var(--beak-colors-accent-alert)' : 'var(--beak-colors-accent-pink)'}`,
					backgroundColor: 'var(--beak-colors-bg-canvas)',
					color: 'var(--beak-colors-fg-default)',
					width: 'calc(100% - 4px)',
					fontSize: '12px',
					lineHeight: '15px',
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
					top='19px'
					left='0'
					right='0'
					bg='bg.canvas'
					borderWidth='1px'
					borderColor='accent.alert'
					borderTop='none'
					color='fg.default'
					px='0.5'
					py='1'
					fontSize='sm'
				>
					{error}
				</Box>
			)}
		</Box>
	);
};

export default NodeRenamer;
