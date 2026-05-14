import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import { Box, chakra } from '@chakra-ui/react';
import type { BooleanEntry, NamedBooleanEntry } from '@getbeak/types/body-editor-json';
import { Check } from 'lucide-react';
import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';

import { JsonEditorContext } from '../../contexts/json-editor-context';
import { BodyInputWrapper, BodyNameOverrideWrapper } from '../atoms/Cells';
import EntryActions from './EntryActions';
import EntryRow from './EntryRow';
import EntryToggler from './EntryToggler';
import { detectName, type JsonEntryProps } from './JsonEntry';
import TypeSelector from './TypeSelector';

const HiddenInput = chakra('input', {
	base: {
		position: 'absolute',
		opacity: 0,
		w: '16px',
		h: '16px',
		m: 0,
		cursor: 'pointer',
		'&:focus + span': {
			boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-warning) 30%, transparent)',
		},
	},
});

interface JsonBooleanEntryProps extends JsonEntryProps {
	value: BooleanEntry | NamedBooleanEntry;
}

const JsonBooleanEntry: React.FC<React.PropsWithChildren<JsonBooleanEntryProps>> = props => {
	const { depth, requestId, value, nameOverride } = props;
	const { id } = value;
	const dispatch = useDispatch();

	const editorContext = useContext(JsonEditorContext)!;

	return (
		<EntryRow
			id={id}
			depth={depth}
			parentId={value.parentId}
			canDrag={depth > 0}
			toggle={<EntryToggler id={id} requestId={requestId} value={value.enabled} />}
			primary={
				<BodyInputWrapper>
					{nameOverride === void 0 && (
						<DebouncedInput
							disabled={depth === 0}
							type={'text'}
							value={detectName(depth, value)}
							onChange={name =>
								dispatch(
									editorContext.nameChange({
										id,
										requestId,
										name,
									}),
								)
							}
						/>
					)}
					{nameOverride !== void 0 && <BodyNameOverrideWrapper>{nameOverride}</BodyNameOverrideWrapper>}
				</BodyInputWrapper>
			}
			type={<TypeSelector requestId={requestId} id={id} value={value.type} />}
			value={
				<Box display='flex' alignItems='center' pl='2'>
					<Box position='relative' display='inline-flex'>
						<HiddenInput
							type='checkbox'
							aria-label={`${detectName(depth, value) || 'Value'} (boolean)`}
							checked={value.value}
							onChange={e =>
								dispatch(
									editorContext.valueChange({
										id,
										requestId,
										value: e.target.checked,
									}),
								)
							}
						/>
						<Box
							as='span'
							display='inline-flex'
							alignItems='center'
							justifyContent='center'
							w='16px'
							h='16px'
							borderRadius='sm'
							borderWidth='1px'
							borderColor={value.value ? 'accent.warning' : 'border.default'}
							bg={value.value ? 'accent.warning' : 'var(--beak-colors-bg-surface)'}
							boxShadow={
								value.value
									? '0 2px 6px color-mix(in srgb, var(--beak-colors-accent-warning) 35%, transparent), inset 0 0 0 0.5px color-mix(in srgb, white 22%, transparent)'
									: 'inset 0 1px 2px rgba(0,0,0,0.04)'
							}
							transition='background-color .14s ease, border-color .14s ease, box-shadow .14s ease'
							pointerEvents='none'
						>
							<Box
								as='span'
								display='inline-flex'
								color='fg.onAccent'
								opacity={value.value ? 1 : 0}
								transform={value.value ? 'scale(1)' : 'scale(0.5)'}
								transition='opacity .14s ease, transform .14s ease'
							>
								<Check size={11} strokeWidth={3} />
							</Box>
						</Box>
					</Box>
				</Box>
			}
			actions={<EntryActions id={id} entry={value} requestId={requestId} />}
		/>
	);
};

export default JsonBooleanEntry;
