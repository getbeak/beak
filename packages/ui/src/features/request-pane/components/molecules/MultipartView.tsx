import { pickAndAttachAsset } from '@beak/ui/features/asset-attachment/pick-and-attach';
import VariableInput from '@beak/ui/features/variable-input/components/VariableInput';
import { requestBodyMultipartChanged } from '@beak/ui/store/project/actions';
import { Box, Button, Flex } from '@chakra-ui/react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { MultipartPart, RequestBodyMultipart } from '@getbeak/types/request';
import { File, FileText, GripVertical, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

export interface MultipartViewProps {
	node: ValidRequestNode;
}

/**
 * Minimal multipart editor — first iteration shipped with ADR-0007 §2.
 * Lets the user add text + binary parts and edit names / values via the
 * existing `VariableInput` (so RTVs work inside both name and value
 * fields). Binary parts get a "Pick file" button that wires the
 * `attached_file` RTV into the part's value.
 *
 * Reorder + per-part Content-Type editing land in a follow-up. The data
 * shape is in place; the editor surface is intentionally lean.
 */
const MultipartView: React.FC<MultipartViewProps> = ({ node }) => {
	const dispatch = useDispatch();
	const body = node.info.body as RequestBodyMultipart;
	const parts = body.payload.parts;

	function setParts(next: MultipartPart[]) {
		dispatch(
			requestBodyMultipartChanged({
				requestId: node.id,
				parts: next,
			}),
		);
	}

	function addTextPart() {
		setParts([...parts, { kind: 'text', name: [''], value: [''] }]);
	}

	function addBinaryPart() {
		setParts([...parts, { kind: 'binary', name: [''], filename: [''], value: [''] }]);
	}

	function removePart(idx: number) {
		setParts(parts.filter((_, i) => i !== idx));
	}

	function updatePart(idx: number, next: MultipartPart) {
		const out = parts.slice();
		out[idx] = next;
		setParts(out);
	}

	async function attachFile(idx: number) {
		const outcome = await pickAndAttachAsset();
		if (!outcome || !outcome.ok) return;
		const part = parts[idx];
		if (part.kind !== 'binary') return;
		updatePart(idx, {
			...part,
			filename: outcome.filename ? [outcome.filename] : part.filename,
			value: [
				{
					type: 'attached_file',
					payload: {
						assetRef: outcome.ref,
						filename: outcome.filename,
					},
				},
			],
		});
	}

	return (
		<Flex direction='column' gap='2' p='3'>
			{parts.length === 0 ? (
				<Box
					p='4'
					borderRadius='lg'
					borderWidth='1px'
					borderStyle='dashed'
					borderColor='border.subtle'
					textAlign='center'
					color='fg.subtle'
					fontSize='xs'
				>
					{'No parts yet — add a text or file part to start composing the body.'}
				</Box>
			) : (
				parts.map((part, idx) => (
					<PartRow
						// biome-ignore lint/suspicious/noArrayIndexKey: parts have no stable id today; index suffices until reorder lands
						key={idx}
						part={part}
						onChange={next => updatePart(idx, next)}
						onRemove={() => removePart(idx)}
						onAttachFile={() => attachFile(idx)}
						requestId={node.id}
					/>
				))
			)}

			<Flex gap='2' pt='2'>
				<Button size='xs' variant='outline' onClick={addTextPart}>
					<Plus size={12} />
					{'Add text part'}
				</Button>
				<Button size='xs' variant='outline' onClick={addBinaryPart}>
					<Plus size={12} />
					{'Add file part'}
				</Button>
			</Flex>
		</Flex>
	);
};

interface PartRowProps {
	part: MultipartPart;
	requestId: string;
	onChange: (next: MultipartPart) => void;
	onRemove: () => void;
	onAttachFile: () => void;
}

const PartRow: React.FC<PartRowProps> = ({ part, requestId, onChange, onRemove, onAttachFile }) => {
	const isText = part.kind === 'text';
	const Icon = isText ? FileText : File;

	return (
		<Flex
			direction='column'
			borderRadius='md'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='bg.surface'
			p='2.5'
			gap='2'
		>
			<Flex align='center' gap='2'>
				<Box color='fg.subtle' cursor='grab' opacity='0.6' aria-hidden='true'>
					<GripVertical size={12} />
				</Box>
				<Box color={isText ? 'fg.muted' : 'accent.pink'}>
					<Icon size={14} strokeWidth={2} />
				</Box>
				<Box flex='1 1 auto' fontSize='xs' fontWeight='600' color='fg.default'>
					{isText ? 'Text part' : 'File part'}
				</Box>
				<Button size='xs' variant='ghost' onClick={onRemove} aria-label='Remove part'>
					<Trash2 size={12} />
				</Button>
			</Flex>

			<Box>
				<Box fontSize='10px' color='fg.subtle' mb='1' textTransform='uppercase' letterSpacing='0.04em'>
					{'Name'}
				</Box>
				<VariableInput
					parts={part.name}
					requestId={requestId}
					onChange={next => onChange({ ...part, name: next } as MultipartPart)}
				/>
			</Box>

			{part.kind === 'binary' && (
				<Box>
					<Box fontSize='10px' color='fg.subtle' mb='1' textTransform='uppercase' letterSpacing='0.04em'>
						{'Filename (optional)'}
					</Box>
					<VariableInput
						parts={part.filename ?? ['']}
						requestId={requestId}
						onChange={next => onChange({ ...part, filename: next })}
					/>
				</Box>
			)}

			<Box>
				<Flex align='center' justify='space-between' mb='1'>
					<Box fontSize='10px' color='fg.subtle' textTransform='uppercase' letterSpacing='0.04em'>
						{'Value'}
					</Box>
					{part.kind === 'binary' && (
						<Button size='xs' variant='ghost' onClick={onAttachFile}>
							{hasAttachedFile(part.value) ? 'Replace file' : 'Pick file'}
						</Button>
					)}
				</Flex>
				<VariableInput
					parts={part.value}
					requestId={requestId}
					onChange={next => onChange({ ...part, value: next } as MultipartPart)}
				/>
			</Box>
		</Flex>
	);
};

function hasAttachedFile(value: MultipartPart['value']): boolean {
	for (const part of value) {
		if (typeof part !== 'object' || part === null || part.type !== 'attached_file') continue;
		const payload = part.payload as { assetRef?: unknown };
		if (payload.assetRef) return true;
	}
	return false;
}

export default MultipartView;
