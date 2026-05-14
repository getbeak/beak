import { TypedObject } from '@beak/common/helpers/typescript';
import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import type { ValueSections } from '@beak/ui/features/variables/values';
import { Button, Flex, Text } from '@chakra-ui/react';
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
	BodyToggleCell,
	HeaderAction,
	HeaderKeyCell,
	HeaderToggleCell,
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
		<Flex direction='column' h='100%' w='100%' fontSize='sm' fontWeight='400' color='fg.muted'>
			{hasRows && (
				<Header>
					<Row data-empty='true'>
						<HeaderToggleCell />
						<HeaderKeyCell>{'Key'}</HeaderKeyCell>
						<HeaderValueCell>{'Value'}</HeaderValueCell>
						{editable && <HeaderAction />}
					</Row>
				</Header>
			)}
			<Body flex='1' display='flex' flexDirection='column' minH={0}>
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
								<BodyToggleCell>
									{editable && showToggle && (
										<EntryToggler value={item.enabled} onChange={enabled => updateItem?.('enabled', k, enabled)} />
									)}
								</BodyToggleCell>
								<BodyPrimaryCell>
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
					<Flex flex='1' align='center' justify='center' direction='column' gap='3' color='fg.subtle'>
						<Flex
							align='center'
							justify='center'
							w='32px'
							h='32px'
							borderRadius='full'
							bg='color-mix(in srgb, var(--beak-colors-fg-default) 6%, transparent)'
							color='fg.subtle'
						>
							<Plus size={14} strokeWidth={1.8} />
						</Flex>
						<Text fontSize='sm' fontWeight='500' color='fg.muted'>
							{readOnly ? 'No entries' : 'No entries yet'}
						</Text>
						{editable && (
							<Button
								size='xs'
								variant='outline'
								borderColor='border.default'
								color='fg.default'
								gap='1'
								fontSize='xs'
								fontWeight='500'
								_hover={{
									borderColor: 'accent.pink',
									color: 'accent.pink',
									bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)',
								}}
								onClick={() => addItem?.()}
							>
								<Plus size={11} strokeWidth={2} />
								{'Add your first row'}
							</Button>
						)}
					</Flex>
				)}
			</Body>

			{hasRows && editable && (
				<Flex justify='flex-end' mt='2' mb='2' mr='2'>
					<Button
						bg='transparent'
						borderWidth='1px'
						borderColor='border.subtle'
						borderRadius='sm'
						color='fg.muted'
						gap='1'
						px='2.5'
						py='1'
						fontSize='xs'
						fontWeight='500'
						h='auto'
						minH='24px'
						transition='border-color .1s linear, background-color .1s linear, color .1s linear'
						_hover={{
							outline: 'none',
							borderColor: 'color-mix(in srgb, var(--beak-colors-fg-default) 25%, transparent)',
							color: 'fg.default',
							bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 6%, transparent)',
						}}
						_focusVisible={{
							outline: 'none',
							borderColor: 'accent.pink',
							boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)',
						}}
						onClick={() => addItem?.()}
					>
						<Plus size={11} strokeWidth={2} />
						{'Add row'}
					</Button>
				</Flex>
			)}
		</Flex>
	);
};

export default BasicTableEditor;
