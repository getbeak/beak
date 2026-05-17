import { type NodeSearchResult, searchNodes, type WorkflowFile } from '@beak/state/workflows';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Dialog, Flex, Input, Stack } from '@chakra-ui/react';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface NodeSearchDialogProps {
	workflow: WorkflowFile;
	open: boolean;
	onClose: () => void;
	onPick: (nodeId: string) => void;
}

/**
 * Cmd-K node finder. Reads `searchNodes` from `@beak/state/workflows`,
 * which is pure — we hand it the live workflow + a `requestId → name`
 * lookup from the project tree so request nodes match on the linked
 * request's display name.
 *
 * Up/Down to move, Enter to pick, Escape to close. The input autofocuses
 * on open and clears its query when the dialog closes.
 */
const NodeSearchDialog: React.FC<NodeSearchDialogProps> = ({ workflow, open, onClose, onPick }) => {
	const [query, setQuery] = useState('');
	const [activeIdx, setActiveIdx] = useState(0);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const requestNames = useAppSelector(s => {
		const map = new Map<string, string>();
		for (const node of Object.values(s.global.project.tree)) {
			if (node.type === 'request') map.set(node.id, node.name);
		}
		return map;
	});

	const results = useMemo<NodeSearchResult[]>(() => {
		return searchNodes(workflow, query, requestNames);
	}, [workflow, query, requestNames]);

	// Reset query/cursor when the dialog opens; keep the lookup helper from
	// retaining state across openings. Open-only — close drops the dialog
	// entirely, so we don't need to clean up on close.
	useEffect(() => {
		if (open) {
			setQuery('');
			setActiveIdx(0);
		}
	}, [open]);

	useEffect(() => {
		setActiveIdx(0);
	}, [query]);

	function commit() {
		const choice = results[activeIdx];
		if (!choice) return;
		onPick(choice.id);
		onClose();
	}

	return (
		<Dialog.Root open={open} onOpenChange={d => (d.open ? null : onClose())} size='md' placement='center' initialFocusEl={() => inputRef.current}>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content>
					<Box px='3' py='2' borderBottomWidth='1px' borderColor='border.subtle'>
						<Input
							ref={inputRef}
							size='sm'
							variant='subtle'
							placeholder='Jump to a step…'
							value={query}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
							onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
								if (e.key === 'ArrowDown') {
									e.preventDefault();
									setActiveIdx(i => Math.min(results.length - 1, i + 1));
								} else if (e.key === 'ArrowUp') {
									e.preventDefault();
									setActiveIdx(i => Math.max(0, i - 1));
								} else if (e.key === 'Enter') {
									e.preventDefault();
									commit();
								}
							}}
						/>
					</Box>
					<Box maxH='320px' overflowY='auto'>
						{results.length === 0 ? (
							<Box px='3' py='6' textAlign='center' fontSize='12px' color='fg.subtle'>
								{'No matching steps.'}
							</Box>
						) : (
							<Stack gap='0' py='1'>
								{results.map((r, idx) => (
									<Flex
										as='button'
										key={r.id}
										role='option'
										aria-selected={idx === activeIdx}
										align='center'
										gap='2'
										px='3'
										py='1.5'
										textAlign='left'
										bg={idx === activeIdx ? 'bg.subtle' : 'transparent'}
										cursor='pointer'
										_hover={{ bg: 'bg.subtle' }}
										onMouseEnter={() => setActiveIdx(idx)}
										onClick={commit}
									>
										<Box
											fontSize='10px'
											fontWeight='700'
											color='fg.muted'
											textTransform='uppercase'
											letterSpacing='0.04em'
											minW='70px'
										>
											{r.kind}
										</Box>
										<Stack gap='0' flex='1' minW={0}>
											<Box
												fontSize='12px'
												fontWeight='600'
												color='fg.default'
												whiteSpace='nowrap'
												overflow='hidden'
												textOverflow='ellipsis'
											>
												{r.label}
											</Box>
											<Box fontSize='10px' color='fg.subtle' whiteSpace='nowrap' overflow='hidden' textOverflow='ellipsis'>
												{r.subtitle}
											</Box>
										</Stack>
									</Flex>
								))}
							</Stack>
						)}
					</Box>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
};

export default NodeSearchDialog;
