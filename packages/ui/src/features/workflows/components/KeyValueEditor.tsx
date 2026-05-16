import ksuid from '@beak/ksuid';
import type { ToggleKeyValueOverride } from '@beak/state/workflows';
import { Box, Checkbox, Flex, IconButton, Input, Stack } from '@chakra-ui/react';
import { Plus, X } from 'lucide-react';
import * as React from 'react';
import { useMemo } from 'react';

interface KeyValueEditorProps {
	rows: Record<string, ToggleKeyValueOverride> | undefined;
	onChange: (next: Record<string, ToggleKeyValueOverride>) => void;
	namePlaceholder?: string;
	valuePlaceholder?: string;
	addLabel?: string;
}

/**
 * Reusable headers/query/form rows editor. Keyed by ksuid so the renderer can
 * reorder/delete rows independently of the rendered key/value strings; that's
 * also the same shape the on-disk request file uses, so this can be reused by
 * the request editor itself later.
 *
 * Values are stored as value-sections (`[stringPart]` today, RTV parts later);
 * the editor reads/writes a single string part for now. The RTV editor pass
 * swaps the value Input for a VariableInput chip strip.
 */
const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
	rows,
	onChange,
	namePlaceholder = 'Name',
	valuePlaceholder = 'Value',
	addLabel = 'Add row',
}) => {
	const entries = useMemo(() => Object.entries(rows ?? {}), [rows]);

	function update(id: string, patch: Partial<ToggleKeyValueOverride>) {
		const current = rows?.[id];
		if (!current) return;
		onChange({ ...(rows ?? {}), [id]: { ...current, ...patch } });
	}

	function remove(id: string) {
		const next = { ...(rows ?? {}) };
		delete next[id];
		onChange(next);
	}

	function add() {
		const id = ksuid.generate('kv').toString();
		onChange({ ...(rows ?? {}), [id]: { name: '', value: [''], enabled: true } });
	}

	function readPlainValue(value: ToggleKeyValueOverride['value']): string {
		return value.filter((p): p is string => typeof p === 'string').join('');
	}

	return (
		<Stack gap='1'>
			{entries.length === 0 && (
				<Box fontSize='11px' color='fg.subtle' py='2' textAlign='center'>
					{'No entries yet'}
				</Box>
			)}
			{entries.map(([id, row]) => (
				<Flex
					key={id}
					align='center'
					gap='1.5'
					px='1.5'
					py='1'
					borderRadius='sm'
					_hover={{ bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 4%, transparent)' }}
				>
					<Checkbox.Root
						size='sm'
						checked={row.enabled}
						onCheckedChange={(d: { checked: boolean | 'indeterminate' }) =>
							update(id, { enabled: d.checked === true })
						}
					>
						<Checkbox.HiddenInput />
						<Checkbox.Control />
					</Checkbox.Root>
					<Input
						size='xs'
						flex='1'
						minW='0'
						placeholder={namePlaceholder}
						value={row.name}
						opacity={row.enabled ? 1 : 0.5}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(id, { name: e.target.value })}
					/>
					<Input
						size='xs'
						flex='1.5'
						minW='0'
						placeholder={valuePlaceholder}
						value={readPlainValue(row.value)}
						opacity={row.enabled ? 1 : 0.5}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							update(id, { value: e.target.value === '' ? [] : [e.target.value] })
						}
					/>
					<IconButton
						type='button'
						aria-label='Remove row'
						size='xs'
						variant='ghost'
						color='fg.subtle'
						_hover={{ color: 'accent.alert' }}
						onClick={() => remove(id)}
					>
						<X size={12} strokeWidth={1.8} />
					</IconButton>
				</Flex>
			))}
			<Flex
				as='button'
				role='button'
				align='center'
				gap='1.5'
				mt='1'
				px='2'
				py='1.5'
				borderRadius='sm'
				borderWidth='1px'
				borderStyle='dashed'
				borderColor='border.default'
				color='fg.muted'
				cursor='pointer'
				fontSize='11px'
				_hover={{ color: 'fg.default', borderColor: 'accent.pink', bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 6%, transparent)' }}
				onClick={add}
			>
				<Plus size={12} strokeWidth={2} />
				<Box>{addLabel}</Box>
			</Flex>
		</Stack>
	);
};

export default KeyValueEditor;
