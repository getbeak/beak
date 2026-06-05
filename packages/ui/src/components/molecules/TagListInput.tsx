import { Box, chakra, Flex } from '@chakra-ui/react';
import { Ban, Check, Hash, Type, X } from 'lucide-react';
import * as React from 'react';
import { useRef, useState } from 'react';

const ChakraInput = chakra('input');
const ChakraButton = chakra('button');

/**
 * Primitive value a tag can carry. Strings, numbers, booleans, and null —
 * matches JSON Schema's `enum` value set. The component auto-detects which
 * type a freshly-typed value is, so authoring stays one input field.
 */
export type TagValue = string | number | boolean | null;

export interface TagListInputProps {
	value: TagValue[];
	onChange: (next: TagValue[]) => void;
	placeholder?: string;
	disabled?: boolean;
	/**
	 * Reject a candidate tag (return a reason string) to flash an inline
	 * error and keep the input populated. Returning `null` accepts.
	 */
	validate?: (candidate: TagValue, existing: TagValue[]) => string | null;
	/**
	 * Marker for the form field — surfaces in tooltips and the rejected-input
	 * label. Defaults to "tag".
	 */
	noun?: string;
	/**
	 * When `false`, the editor only ever commits strings — typed-value parsing
	 * is skipped. Useful for header / row name lists where everything should
	 * stay a string regardless of what it looks like. Defaults to `true` so
	 * enum-of-numbers / -booleans authoring works out of the box.
	 */
	typedParsing?: boolean;
}

/**
 * Chip-style tag input for editing a list of primitive values. Replaces the
 * comma-separated text input pattern: type + Enter / Tab / "," commits a
 * tag; Backspace on an empty input removes the trailing chip; click X on
 * a chip removes it.
 *
 * When `typedParsing` is on (default), the committed value's type is
 * inferred from what the user typed:
 *
 *   - `null` → null
 *   - `true` / `false` → boolean
 *   - parseable as a finite number → number (`200`, `-1.5`, `0`)
 *   - `"..."` (wrapped in matching quotes) → string with the quotes stripped
 *     (escape hatch for forcing the literal `"200"` as a string)
 *   - everything else → string
 *
 * Each chip carries a tiny type indicator (icon + accent color) so the user
 * can see at a glance which entries are numbers, booleans, etc. — important
 * because `200` and `"200"` are different JSON values even if they look the
 * same.
 */
const TagListInput: React.FC<TagListInputProps> = ({
	value,
	onChange,
	placeholder,
	disabled,
	validate,
	noun = 'tag',
	typedParsing = true,
}) => {
	const [draft, setDraft] = useState('');
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	function commit(raw: string) {
		const trimmed = raw.trim();
		if (trimmed.length === 0) return false;
		const parsed = typedParsing ? parseTagValue(trimmed) : trimmed;
		if (value.some(existing => sameTagValue(existing, parsed))) {
			setError(`Duplicate ${noun}`);
			return false;
		}
		if (validate) {
			const reason = validate(parsed, value);
			if (reason) {
				setError(reason);
				return false;
			}
		}
		onChange([...value, parsed]);
		setError(null);
		return true;
	}

	function remove(index: number) {
		const next = value.slice();
		next.splice(index, 1);
		onChange(next);
		setError(null);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'Enter' || event.key === ',') {
			event.preventDefault();
			if (commit(draft)) setDraft('');
			return;
		}
		if (event.key === 'Tab' && draft.trim().length > 0) {
			event.preventDefault();
			if (commit(draft)) setDraft('');
			return;
		}
		if (event.key === 'Backspace' && draft.length === 0 && value.length > 0) {
			event.preventDefault();
			remove(value.length - 1);
			return;
		}
		if (event.key === 'Escape') {
			setDraft('');
			setError(null);
		}
	}

	function handleBlur() {
		if (draft.trim().length > 0) {
			if (commit(draft)) setDraft('');
		}
	}

	function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
		const text = event.clipboardData.getData('text');
		if (!text.includes(',') && !text.includes('\n')) return;
		event.preventDefault();
		const candidates = text
			.split(/[,\n]/)
			.map(s => s.trim())
			.filter(Boolean);
		const accepted: TagValue[] = [];
		for (const candidate of candidates) {
			const parsed = typedParsing ? parseTagValue(candidate) : candidate;
			if (value.some(v => sameTagValue(v, parsed))) continue;
			if (accepted.some(v => sameTagValue(v, parsed))) continue;
			if (validate) {
				const reason = validate(parsed, [...value, ...accepted]);
				if (reason) continue;
			}
			accepted.push(parsed);
		}
		if (accepted.length > 0) onChange([...value, ...accepted]);
		setDraft('');
	}

	return (
		<Box position='relative' w='100%'>
			<Flex
				align='center'
				wrap='wrap'
				gap='1'
				minH='28px'
				py='1'
				px='1.5'
				borderWidth='1px'
				borderColor={error ? 'accent.alert' : 'border.subtle'}
				borderRadius='sm'
				bg='bg.canvas'
				cursor={disabled ? 'default' : 'text'}
				transition='border-color .12s ease, box-shadow .12s ease'
				_focusWithin={{
					borderColor: error ? 'accent.alert' : 'accent.indigo',
					boxShadow: error
						? `0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-alert) 24%, transparent)`
						: `0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-indigo) 22%, transparent)`,
				}}
				onClick={() => {
					if (disabled) return;
					inputRef.current?.focus();
				}}
			>
				{value.map((tag, index) => (
					<TagChip
						key={`${describeType(tag)}-${index}`}
						value={tag}
						disabled={disabled}
						onRemove={() => remove(index)}
						noun={noun}
					/>
				))}
				<ChakraInput
					ref={inputRef}
					type='text'
					value={draft}
					disabled={disabled}
					placeholder={value.length === 0 ? placeholder : undefined}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						setDraft(event.currentTarget.value);
						if (error) setError(null);
					}}
					onKeyDown={handleKeyDown}
					onBlur={handleBlur}
					onPaste={handlePaste}
					flex='1'
					minW='100px'
					h='20px'
					p='0'
					m='0'
					border='none'
					bg='transparent'
					color='fg.default'
					fontSize='12px'
					outline='none'
					css={{
						'&::placeholder': { color: 'var(--beak-colors-fg-subtle)' },
					}}
				/>
			</Flex>
			{error && (
				<Box mt='1' fontSize='10.5px' color='accent.alert'>
					{error}
				</Box>
			)}
			{typedParsing && value.length === 0 && !disabled && (
				<Box mt='1' fontSize='10px' color='fg.subtle' lineHeight='1.4'>
					{'Typed values supported — '}
					<Box as='span' fontFamily='mono'>
						{'200'}
					</Box>
					{' → number, '}
					<Box as='span' fontFamily='mono'>
						{'true'}
					</Box>
					{' / '}
					<Box as='span' fontFamily='mono'>
						{'null'}
					</Box>
					{' → literal. Wrap in quotes to force string ('}
					<Box as='span' fontFamily='mono'>
						{'"200"'}
					</Box>
					{').'}
				</Box>
			)}
		</Box>
	);
};

interface TagChipProps {
	value: TagValue;
	disabled?: boolean;
	onRemove: () => void;
	noun: string;
}

/**
 * One chip — color-coded by type so a glance is enough to tell a number
 * from a string-that-looks-like-a-number. The label shows the canonical
 * literal (e.g. `null` for null, `true`/`false` for booleans) so what the
 * user sees matches what gets written to the wire.
 */
const TagChip: React.FC<TagChipProps> = ({ value, disabled, onRemove, noun }) => {
	const meta = describeType(value);
	const label = formatTagLabel(value);
	const Icon = meta.icon;

	return (
		<Flex
			align='center'
			gap='1'
			h='20px'
			pl='1'
			pr='0.5'
			borderRadius='full'
			bg={`color-mix(in srgb, ${meta.colorVar} 14%, transparent)`}
			color={meta.color}
			fontSize='11px'
			fontWeight='500'
			maxW='100%'
			data-tooltip-id='tt-schema-row-description'
			data-tooltip-content={meta.tooltip}
		>
			{Icon && (
				<Box as='span' display='inline-flex' alignItems='center' opacity={0.85}>
					<Icon size={10} strokeWidth={2.2} />
				</Box>
			)}
			<Box
				as='span'
				overflow='hidden'
				textOverflow='ellipsis'
				whiteSpace='nowrap'
				fontFamily={meta.mono ? 'mono' : undefined}
				fontVariantNumeric={meta.mono ? 'tabular-nums' : undefined}
			>
				{label}
			</Box>
			{!disabled && (
				<ChakraButton
					type='button'
					aria-label={`Remove ${noun} ${label}`}
					title={`Remove ${noun}`}
					onClick={(event: React.MouseEvent) => {
						event.stopPropagation();
						onRemove();
					}}
					display='inline-flex'
					alignItems='center'
					justifyContent='center'
					w='14px'
					h='14px'
					p='0'
					border='none'
					bg='transparent'
					color='inherit'
					borderRadius='full'
					cursor='pointer'
					opacity={0.7}
					transition='opacity .1s ease, background-color .1s ease'
					_hover={{
						opacity: 1,
						bg: `color-mix(in srgb, ${meta.colorVar} 28%, transparent)`,
					}}
					_focusVisible={{
						outline: 'none',
						boxShadow: `0 0 0 2px color-mix(in srgb, ${meta.colorVar} 45%, transparent)`,
					}}
				>
					<X size={9} strokeWidth={2.5} />
				</ChakraButton>
			)}
		</Flex>
	);
};

interface TypeMeta {
	type: 'string' | 'number' | 'boolean' | 'null';
	icon: typeof Hash | null;
	color: string;
	colorVar: string;
	tooltip: string;
	mono: boolean;
}

function describeType(value: TagValue): TypeMeta {
	if (value === null) {
		return {
			type: 'null',
			icon: Ban,
			color: 'fg.subtle',
			colorVar: 'var(--beak-colors-fg-subtle)',
			tooltip: 'Type: null',
			mono: true,
		};
	}
	if (typeof value === 'boolean') {
		return {
			type: 'boolean',
			icon: Check,
			color: 'accent.warning',
			colorVar: 'var(--beak-colors-accent-warning)',
			tooltip: `Type: boolean (${value})`,
			mono: true,
		};
	}
	if (typeof value === 'number') {
		return {
			type: 'number',
			icon: Hash,
			color: 'accent.indigo',
			colorVar: 'var(--beak-colors-accent-indigo)',
			tooltip: 'Type: number',
			mono: true,
		};
	}
	return {
		type: 'string',
		icon: Type,
		color: 'accent.pink',
		colorVar: 'var(--beak-colors-accent-pink)',
		tooltip: 'Type: string',
		mono: false,
	};
}

function formatTagLabel(value: TagValue): string {
	if (value === null) return 'null';
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	return String(value);
}

/**
 * Parse what the user typed into a TagValue. Detection order matters:
 *   1. `null` literal → null
 *   2. `true` / `false` literals → boolean
 *   3. Quoted (matching " or ' wrapping) → string with quotes stripped —
 *      escape hatch for forcing `"200"` as a string instead of a number
 *   4. Number.parseable + finite → number
 *   5. Fallback → string
 */
export function parseTagValue(raw: string): TagValue {
	const trimmed = raw.trim();
	if (trimmed === 'null') return null;
	if (trimmed === 'true') return true;
	if (trimmed === 'false') return false;
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
	) {
		return trimmed.slice(1, -1);
	}
	// Number.parseable — reject empty string, NaN, Infinity. Use Number() not
	// parseFloat() so trailing garbage ("12abc") falls through to string.
	if (trimmed.length > 0 && /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
		const n = Number(trimmed);
		if (Number.isFinite(n)) return n;
	}
	return trimmed;
}

function sameTagValue(a: TagValue, b: TagValue): boolean {
	if (a === b) return true;
	// Different types are different values even if their literal looks the
	// same (e.g. number 200 vs string "200").
	return false;
}

export default TagListInput;
