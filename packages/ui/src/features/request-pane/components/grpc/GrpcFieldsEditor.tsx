import type { GrpcEnumDescriptor, GrpcMessageDescriptor, GrpcMessageField } from '@beak/common/ipc/grpc';
import { Box, chakra, Flex } from '@chakra-ui/react';
import { Hash, List, ToggleLeft, ToggleRight, Type } from 'lucide-react';
import * as React from 'react';
import { useMemo } from 'react';

const ChakraInput = chakra('input');
const ChakraTextarea = chakra('textarea');
const ChakraSelect = chakra('select');

export interface GrpcFieldsEditorProps {
	/** Fully-qualified message type, e.g. `helloworld.HelloRequest`. */
	requestType: string;
	/** Map of FQ message name → descriptor, sourced from the endpoint's `_grpc.json`. */
	messages: Record<string, GrpcMessageDescriptor>;
	enums: Record<string, GrpcEnumDescriptor>;
	/** Parsed JSON request body (or `{}` when blank). Edits flow back via `onChange`. */
	value: Record<string, unknown>;
	onChange: (next: Record<string, unknown>) => void;
}

/**
 * Renders inputs for each field on the request message. Edits commit
 * straight into the message-shaped JSON object that the host's invoker
 * expects, so the Body tab's JSON stays in sync without a separate
 * serialisation pass.
 *
 * Coverage today: scalar fields (string, all numeric types, bool, bytes,
 * enum) and message fields (rendered recursively, one level at a time —
 * deeper nesting still works but the indent gets steep). `repeated`
 * scalars render as a comma-separated input; richer list editing
 * (per-item rows, drag-to-reorder) is a follow-up.
 *
 * Unknown schemas (missing message descriptor for a referenced type) fall
 * back to a stringified JSON textarea so the user can still author the
 * field by hand rather than getting stuck behind a missing piece of
 * reflection data.
 */
const GrpcFieldsEditor: React.FC<GrpcFieldsEditorProps> = ({ requestType, messages, enums, value, onChange }) => {
	const descriptor = messages[requestType];

	if (!descriptor) {
		return (
			<EmptyState
				title='No schema for this message'
				body={`Beak doesn't have a descriptor for ${requestType}. Run Discover again on the endpoint to refresh, or use the JSON tab to author the request directly.`}
			/>
		);
	}

	return (
		<MessageBlock
			descriptor={descriptor}
			messages={messages}
			enums={enums}
			value={value}
			onChange={onChange}
			depth={0}
		/>
	);
};

interface MessageBlockProps {
	descriptor: GrpcMessageDescriptor;
	messages: Record<string, GrpcMessageDescriptor>;
	enums: Record<string, GrpcEnumDescriptor>;
	value: Record<string, unknown>;
	onChange: (next: Record<string, unknown>) => void;
	depth: number;
}

const MessageBlock: React.FC<MessageBlockProps> = ({ descriptor, messages, enums, value, onChange, depth }) => {
	// Group fields by oneof so the renderer can show only one input per group
	// at a time — picking a different oneof member clears the previous one.
	const grouped = useMemo(() => groupByOneof(descriptor), [descriptor]);

	function setFieldValue(field: GrpcMessageField, next: unknown) {
		// `oneof` semantics: setting one member clears every sibling in the
		// same group. proto3 implicit oneofs (used for `optional`) opt out
		// of this so single-field-optional doesn't break the value model.
		if (typeof field.oneofIndex === 'number') {
			const peers = (grouped.byOneof[field.oneofIndex] ?? []).filter(f => f.name !== field.name);
			const cleared = { ...value };
			for (const peer of peers) delete cleared[peer.name];
			onChange({ ...cleared, [field.name]: next });
		} else {
			onChange({ ...value, [field.name]: next });
		}
	}

	function clearField(field: GrpcMessageField) {
		const next = { ...value };
		delete next[field.name];
		onChange(next);
	}

	return (
		<Flex direction='column' gap='3' pl={depth === 0 ? '0' : '3'}>
			{grouped.flat.map(field => (
				<FieldRow
					key={`${descriptor.name}::${field.name}`}
					field={field}
					messages={messages}
					enums={enums}
					oneofName={
						typeof field.oneofIndex === 'number' ? descriptor.oneofs[field.oneofIndex] : undefined
					}
					value={value[field.name]}
					onChange={next => setFieldValue(field, next)}
					onClear={() => clearField(field)}
					depth={depth}
				/>
			))}
		</Flex>
	);
};

interface GroupedFields {
	flat: GrpcMessageField[];
	byOneof: Record<number, GrpcMessageField[]>;
}
function groupByOneof(descriptor: GrpcMessageDescriptor): GroupedFields {
	const byOneof: Record<number, GrpcMessageField[]> = {};
	for (const field of descriptor.fields) {
		if (typeof field.oneofIndex === 'number') {
			byOneof[field.oneofIndex] = byOneof[field.oneofIndex] ?? [];
			byOneof[field.oneofIndex].push(field);
		}
	}
	return { flat: descriptor.fields, byOneof };
}

interface FieldRowProps {
	field: GrpcMessageField;
	messages: Record<string, GrpcMessageDescriptor>;
	enums: Record<string, GrpcEnumDescriptor>;
	oneofName?: string;
	value: unknown;
	onChange: (next: unknown) => void;
	onClear: () => void;
	depth: number;
}

const FieldRow: React.FC<FieldRowProps> = ({ field, messages, enums, oneofName, value, onChange, onClear, depth }) => {
	const labelIcon = pickIcon(field);
	const labelBits = [field.name];
	if (field.repeated) labelBits.push('[]');
	const typeLabel = field.type === 'message' || field.type === 'enum' ? field.typeName : field.type;
	return (
		<Flex direction='column' gap='1'>
			<Flex align='center' gap='1.5'>
				<Box color='fg.subtle'>{labelIcon}</Box>
				<Box fontSize='11px' fontWeight='600' color='fg.default' fontFamily='mono'>
					{labelBits.join('')}
				</Box>
				<Box fontSize='10px' color='fg.subtle' fontFamily='mono'>
					{typeLabel}
				</Box>
				{oneofName && (
					<Box
						as='span'
						fontSize='9.5px'
						fontWeight='600'
						letterSpacing='0.04em'
						textTransform='uppercase'
						color='accent.teal'
						bg='color-mix(in srgb, var(--beak-colors-accent-teal) 14%, transparent)'
						borderRadius='sm'
						px='1'
					>
						{`oneof · ${oneofName}`}
					</Box>
				)}
				{field.optional && (
					<Box
						as='span'
						fontSize='9.5px'
						fontWeight='600'
						letterSpacing='0.04em'
						textTransform='uppercase'
						color='fg.subtle'
						borderWidth='1px'
						borderColor='border.subtle'
						borderRadius='sm'
						px='1'
					>
						{'optional'}
					</Box>
				)}
				{value !== undefined && (oneofName || field.optional) && (
					<chakra.button
						type='button'
						onClick={onClear}
						ml='auto'
						fontSize='10px'
						color='fg.subtle'
						bg='transparent'
						border='none'
						cursor='pointer'
						_hover={{ color: 'accent.alert' }}
					>
						{'clear'}
					</chakra.button>
				)}
			</Flex>
			<FieldInput field={field} messages={messages} enums={enums} value={value} onChange={onChange} depth={depth} />
		</Flex>
	);
};

interface FieldInputProps {
	field: GrpcMessageField;
	messages: Record<string, GrpcMessageDescriptor>;
	enums: Record<string, GrpcEnumDescriptor>;
	value: unknown;
	onChange: (next: unknown) => void;
	depth: number;
}

const FieldInput: React.FC<FieldInputProps> = ({ field, messages, enums, value, onChange, depth }) => {
	if (field.repeated) {
		return <RepeatedScalarInput field={field} value={value} onChange={onChange} />;
	}

	if (field.type === 'message') {
		const inner = messages[field.typeName];
		if (!inner) {
			return (
				<Box fontSize='10.5px' color='fg.subtle' fontStyle='italic'>
					{`No schema for ${field.typeName}; edit via JSON tab.`}
				</Box>
			);
		}
		const nested = (value && typeof value === 'object' ? (value as Record<string, unknown>) : {}) as Record<
			string,
			unknown
		>;
		return (
			<Box
				borderLeftWidth='1px'
				borderColor='border.subtle'
				pl='2'
				py='1'
			>
				<MessageBlock
					descriptor={inner}
					messages={messages}
					enums={enums}
					value={nested}
					onChange={next => onChange(next)}
					depth={depth + 1}
				/>
			</Box>
		);
	}

	if (field.type === 'enum') {
		const enumDescriptor = enums[field.typeName];
		const current = typeof value === 'string' ? value : enumDescriptor?.values[0]?.name ?? '';
		return (
			<ChakraSelect
				value={current}
				onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.currentTarget.value)}
				h='28px'
				px='2'
				borderRadius='md'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='bg.canvas'
				color='fg.default'
				fontSize='12px'
			>
				{(enumDescriptor?.values ?? []).map(v => (
					<option key={v.number} value={v.name}>
						{`${v.name} (${v.number})`}
					</option>
				))}
			</ChakraSelect>
		);
	}

	if (field.type === 'bool') {
		const checked = value === true;
		return (
			<chakra.button
				type='button'
				onClick={() => onChange(!checked)}
				display='inline-flex'
				alignItems='center'
				gap='1.5'
				w='fit-content'
				h='24px'
				px='2'
				borderRadius='sm'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='bg.canvas'
				color={checked ? 'accent.success' : 'fg.muted'}
				fontSize='11.5px'
				fontFamily='mono'
				cursor='pointer'
				_hover={{ borderColor: 'border.emphasized' }}
			>
				{checked ? <ToggleRight size={11} strokeWidth={2} /> : <ToggleLeft size={11} strokeWidth={2} />}
				{checked ? 'true' : 'false'}
			</chakra.button>
		);
	}

	if (isIntegerType(field.type) || isFloatType(field.type)) {
		// Long types (int64 / uint64 / sint64 / fixed64 / sfixed64) round-trip
		// as strings to dodge JS's 2^53 mantissa cliff. We keep them as
		// strings here too — the host's protobufjs `fromObject` accepts both.
		const stringMode = isLongType(field.type);
		const current =
			value === undefined || value === null
				? ''
				: stringMode
					? String(value)
					: typeof value === 'number'
						? String(value)
						: String(value);
		return (
			<ChakraInput
				type={stringMode ? 'text' : 'number'}
				value={current}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
					const next = e.currentTarget.value;
					if (next === '') {
						onChange(undefined);
						return;
					}
					onChange(stringMode ? next : Number(next));
				}}
				h='28px'
				px='2'
				borderRadius='md'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='bg.canvas'
				color='fg.default'
				fontFamily='mono'
				fontSize='12px'
				outline='none'
				_focus={{
					borderColor: 'transparent',
					boxShadow:
						'inset 0 0 0 1px var(--beak-colors-accent-teal), 0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-teal) 18%, transparent)',
				}}
			/>
		);
	}

	if (field.type === 'bytes') {
		const current = typeof value === 'string' ? value : '';
		return (
			<ChakraTextarea
				value={current}
				onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.currentTarget.value)}
				placeholder='base64-encoded bytes'
				w='100%'
				h='52px'
				p='1.5'
				borderRadius='md'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='bg.canvas'
				color='fg.default'
				fontFamily='mono'
				fontSize='11.5px'
				resize='vertical'
				outline='none'
				_focus={{
					borderColor: 'transparent',
					boxShadow:
						'inset 0 0 0 1px var(--beak-colors-accent-teal), 0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-teal) 18%, transparent)',
				}}
			/>
		);
	}

	// Default: string. Covers `string` and anything we don't recognise.
	const current = typeof value === 'string' ? value : value !== undefined ? String(value) : '';
	return (
		<ChakraInput
			type='text'
			value={current}
			onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
				const next = e.currentTarget.value;
				onChange(next === '' ? undefined : next);
			}}
			h='28px'
			px='2'
			borderRadius='md'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='bg.canvas'
			color='fg.default'
			fontSize='12px'
			outline='none'
			_focus={{
				borderColor: 'transparent',
				boxShadow:
					'inset 0 0 0 1px var(--beak-colors-accent-teal), 0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-teal) 18%, transparent)',
			}}
		/>
	);
};

const RepeatedScalarInput: React.FC<{
	field: GrpcMessageField;
	value: unknown;
	onChange: (next: unknown) => void;
}> = ({ field, value, onChange }) => {
	const items = Array.isArray(value) ? value : [];
	const display = items.map(v => (typeof v === 'string' ? v : JSON.stringify(v))).join(', ');
	return (
		<Flex direction='column' gap='0.5'>
			<ChakraTextarea
				value={display}
				onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
					const next = e.currentTarget.value
						.split(',')
						.map(s => s.trim())
						.filter(s => s.length > 0)
						.map(s => (isIntegerType(field.type) || isFloatType(field.type) ? (isLongType(field.type) ? s : Number(s)) : s));
					onChange(next);
				}}
				placeholder='Comma-separated values'
				w='100%'
				h='40px'
				p='1.5'
				borderRadius='md'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='bg.canvas'
				color='fg.default'
				fontFamily='mono'
				fontSize='11.5px'
				resize='vertical'
				outline='none'
			/>
			<Box fontSize='9.5px' color='fg.subtle'>
				{`${items.length} item${items.length === 1 ? '' : 's'} · per-item editing coming later`}
			</Box>
		</Flex>
	);
};

function pickIcon(field: GrpcMessageField): React.ReactNode {
	if (field.repeated) return <List size={10} strokeWidth={2} />;
	if (field.type === 'bool') return <ToggleLeft size={10} strokeWidth={2} />;
	if (field.type === 'enum') return <List size={10} strokeWidth={2} />;
	if (isIntegerType(field.type) || isFloatType(field.type)) return <Hash size={10} strokeWidth={2} />;
	return <Type size={10} strokeWidth={2} />;
}

function isIntegerType(t: string): boolean {
	return (
		t === 'int32' ||
		t === 'int64' ||
		t === 'uint32' ||
		t === 'uint64' ||
		t === 'sint32' ||
		t === 'sint64' ||
		t === 'fixed32' ||
		t === 'fixed64' ||
		t === 'sfixed32' ||
		t === 'sfixed64'
	);
}
function isFloatType(t: string): boolean {
	return t === 'float' || t === 'double';
}
function isLongType(t: string): boolean {
	return t === 'int64' || t === 'uint64' || t === 'sint64' || t === 'fixed64' || t === 'sfixed64';
}

const EmptyState: React.FC<{ title: string; body: string }> = ({ title, body }) => (
	<Flex direction='column' gap='1' px='3' py='3'>
		<Box fontSize='12px' fontWeight='600' color='fg.muted'>
			{title}
		</Box>
		<Box fontSize='11px' color='fg.subtle' lineHeight='1.5'>
			{body}
		</Box>
	</Flex>
);

export default GrpcFieldsEditor;
