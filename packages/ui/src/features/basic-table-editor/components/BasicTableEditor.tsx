import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { TypedObject } from '@beak/common/helpers/typescript';
import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import type { ValueSections } from '@beak/ui/features/variables/values';
import type { ToggleKeyValue } from '@getbeak/types/request';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import * as React from 'react';

import VariableInput from '../../variable-input/components/VariableInput';
import {
	BodyAction,
	BodyInputValueCell,
	BodyInputWrapper,
	BodyPrimaryCell,
	HeaderAction,
	HeaderKeyCell,
	HeaderValueCell,
} from './atoms/Cells';
import { Body, Header, Row } from './atoms/Structure';
import EntryActions from './molecules/EntryActions';
import EntryToggler from './molecules/EntryToggler';

interface BasicTableEditorProps {
	items: Record<string, ToggleKeyValue>;
	requestId?: string;
	readOnly?: boolean;
	disableItemToggle?: boolean;
	addItem?: () => void;
	updateItem?: (type: keyof ToggleKeyValue, ident: string, value: string | boolean | ValueSections) => void;
	removeItem?: (ident: string) => void;
}

const MotionRow = motion.create(Row);

const BasicTableEditor: React.FC<BasicTableEditorProps> = ({
	items,
	requestId,
	readOnly,
	disableItemToggle,
	addItem,
	updateItem,
	removeItem,
}) => {
	const editable = !readOnly;
	const showToggle = !disableItemToggle;
	const keys = TypedObject.keys(items);
	const hasRows = keys.length > 0;

	return (
		<Box mt='1.5' w='100%' fontSize='sm' fontWeight='400' color='fg.muted'>
			<Header>
				<Row data-empty='true'>
					<HeaderKeyCell>{'Key'}</HeaderKeyCell>
					<HeaderValueCell>{'Value'}</HeaderValueCell>
					{editable && <HeaderAction />}
				</Row>
			</Header>
			<Body>
				<AnimatePresence initial={false}>
					{keys.map(k => {
						const item = items[k];

						return (
							<MotionRow
								key={k}
								layout
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								transition={{ duration: 0.16, ease: 'easeOut' }}
							>
								<BodyPrimaryCell>
									{editable && showToggle && (
										<EntryToggler
											value={item.enabled}
											onChange={enabled => updateItem?.('enabled', k, enabled)}
										/>
									)}
									<BodyInputWrapper>
										<DebouncedInput
											type='text'
											value={item.name}
											disabled={readOnly}
											placeholder='key'
											onChange={v => updateItem?.('name', k, v)}
										/>
									</BodyInputWrapper>
								</BodyPrimaryCell>
								<BodyInputValueCell>
									<BodyInputWrapper>
										<VariableInput
											requestId={requestId}
											parts={item.value}
											readOnly={readOnly}
											disabled={readOnly}
											onChange={parts => updateItem?.('value', k, parts)}
										/>
									</BodyInputWrapper>
								</BodyInputValueCell>
								{editable && (
									<BodyAction>
										<EntryActions onRemove={() => removeItem?.(k)} />
									</BodyAction>
								)}
							</MotionRow>
						);
					})}
				</AnimatePresence>

				{!hasRows && (
					<Flex
						align='center'
						justify='center'
						direction='column'
						gap='2'
						py='6'
						color='fg.subtle'
					>
						<Flex
							align='center'
							justify='center'
							w='34px'
							h='34px'
							borderRadius='full'
							bg='color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)'
							borderWidth='1px'
							borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 26%, transparent)'
							color='accent.pink'
							boxShadow='0 4px 12px color-mix(in srgb, var(--beak-colors-accent-pink) 18%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
						>
							<Plus size={15} strokeWidth={2} />
						</Flex>
						<Text fontSize='sm' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
							{readOnly ? 'No entries' : 'No entries yet'}
						</Text>
						{editable && (
							<Text fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase' color='accent.pink'>
								{'Use Add row to create one'}
							</Text>
						)}
					</Flex>
				)}
			</Body>

			{editable && (
				<Flex justify='flex-end' mt='2' mr='0.5'>
					<Button
						bg='transparent'
						borderWidth='1px'
						borderColor='border.subtle'
						borderRadius='md'
						color='fg.muted'
						gap='1'
						px='2.5'
						py='1'
						fontSize='xs'
						fontWeight='600'
						h='auto'
						minH='24px'
						transition='border-color .12s ease, background-color .12s ease, color .12s ease, transform .08s ease'
						_hover={{
							outline: 'none',
							borderColor: 'accent.pink',
							color: 'accent.pink',
							bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)',
						}}
						_focus={{
							outline: 'none',
							borderColor: 'accent.pink',
							boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)',
						}}
						_active={{ transform: 'scale(0.97)' }}
						onClick={() => addItem?.()}
					>
						<Plus size={11} strokeWidth={2.4} />
						{'Add row'}
					</Button>
				</Flex>
			)}
		</Box>
	);
};

export default BasicTableEditor;
