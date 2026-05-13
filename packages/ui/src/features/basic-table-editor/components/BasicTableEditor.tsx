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
						gap='1'
						py='5'
						color='fg.subtle'
					>
						<Text fontSize='xs' fontStyle='italic'>
							{readOnly ? 'No entries' : 'No entries yet'}
						</Text>
						{editable && (
							<Text fontSize='xs' opacity={0.7}>
								{'Use Add to create your first row'}
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
						borderColor='border.default'
						borderRadius='md'
						color='fg.default'
						gap='1'
						px='2'
						py='1'
						fontSize='xs'
						h='auto'
						minH='22px'
						transition='border-color .12s ease, background-color .12s ease, transform .08s ease'
						_hover={{
							outline: 'none',
							borderColor: 'accent.pink',
							bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 8%, transparent)',
						}}
						_focus={{ outline: 'none', borderColor: 'accent.pink' }}
						_active={{ transform: 'scale(0.97)' }}
						onClick={() => addItem?.()}
					>
						<Plus size={11} />
						{'Add row'}
					</Button>
				</Flex>
			)}
		</Box>
	);
};

export default BasicTableEditor;
