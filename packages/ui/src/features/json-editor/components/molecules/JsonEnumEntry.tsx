import { Box, chakra, Flex } from '@chakra-ui/react';
import type { EnumEntry, EnumOption, NamedEnumEntry } from '@getbeak/types/body-editor-json';
import { ChevronDown } from 'lucide-react';
import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';

import { JsonEditorContext } from '../../contexts/json-editor-context';
import { BodyInputWrapper } from '../atoms/Cells';
import EntryActions from './EntryActions';
import EntryPrimary from './EntryPrimary';
import EntryRow from './EntryRow';
import EntryToggler from './EntryToggler';
import type { JsonEntryProps } from './JsonEntry';
import TypeSelector from './TypeSelector';

interface JsonEnumEntryProps extends JsonEntryProps {
	value: EnumEntry | NamedEnumEntry;
}

const ChakraSelect = chakra('select');

/**
 * Native-styled select for enum value rendering inside a JSON entry's
 * value cell. Falls back to the plain DebouncedInput when no options are
 * defined yet (schema mode is still authoring the contract). Off-list
 * values surface explicitly so existing data isn't silently dropped.
 */
function formatEnumOption(value: EnumOption): string {
	if (value === null) return 'null';
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	return String(value);
}

const EnumValueSelect: React.FC<{
	options: EnumOption[];
	value: string;
	disabled?: boolean;
	onChange: (next: string) => void;
}> = ({ options, value, disabled, onChange }) => {
	const stringOptions = options.map(formatEnumOption);
	return (
		<Box position='relative' flexGrow={1} display='inline-flex' alignItems='stretch'>
			<ChakraSelect
				value={value}
				disabled={disabled}
				onChange={e => onChange((e.target as HTMLSelectElement).value)}
				w='100%'
				h='30px'
				minH='30px'
				px='10px'
				pr='28px'
				borderWidth='0'
				borderRadius='0'
				bg='transparent'
				color='fg.default'
				fontSize='12px'
				fontFamily='inherit'
				appearance='none'
				cursor={disabled ? 'default' : 'pointer'}
				outline='none'
				_focus={{
					bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 5%, transparent)',
					boxShadow: 'inset 0 -1px 0 var(--beak-colors-accent-pink)',
				}}
			>
				{!stringOptions.includes(value) && value !== '' && <option value={value}>{`${value} (off-list)`}</option>}
				{value === '' && <option value=''>{'Choose a value…'}</option>}
				{options.map(o => {
					const label = formatEnumOption(o);
					return (
						<option key={label} value={label}>
							{label}
						</option>
					);
				})}
			</ChakraSelect>
			<Box
				position='absolute'
				right='8px'
				top='50%'
				transform='translateY(-50%)'
				pointerEvents='none'
				color='fg.subtle'
				display='inline-flex'
				alignItems='center'
			>
				<ChevronDown size={12} strokeWidth={1.8} />
			</Box>
		</Box>
	);
};

const JsonEnumEntry: React.FC<React.PropsWithChildren<JsonEnumEntryProps>> = props => {
	const { depth, requestId, value, nameOverride } = props;
	const { id } = value;
	const dispatch = useDispatch();

	const editorContext = useContext(JsonEditorContext)!;
	const isRoot = depth === 0;
	const options = value.options ?? [];
	const literal = value.value.length === 1 && typeof value.value[0] === 'string' ? value.value[0] : '';

	return (
		<EntryRow
			id={id}
			depth={depth}
			parentId={value.parentId}
			canDrag={!isRoot}
			toggle={<EntryToggler id={id} requestId={requestId} value={value.enabled} />}
			primary={<EntryPrimary depth={depth} requestId={requestId} value={value} nameOverride={nameOverride} />}
			type={<TypeSelector requestId={requestId} id={id} value={value.type} />}
			value={
				<BodyInputWrapper>
					{options.length > 0 ? (
						<EnumValueSelect
							options={options}
							value={literal}
							onChange={next =>
								dispatch(
									editorContext.valueChange({
										id,
										requestId,
										value: [next],
									}),
								)
							}
						/>
					) : (
						<Flex flexGrow={1} align='center' gap='2' pl='10px' color='fg.subtle' fontStyle='italic' fontSize='11.5px'>
							{'Define options in schema mode'}
						</Flex>
					)}
				</BodyInputWrapper>
			}
			actions={<EntryActions id={id} entry={value} requestId={requestId} />}
		/>
	);
};

export default JsonEnumEntry;
