import { Box, Button, Flex } from '@chakra-ui/react';
import { TypedObject } from '@beak/common/helpers/typescript';
import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import type { ValueSections } from '@beak/ui/features/variables/values';
import type { ToggleKeyValue } from '@getbeak/types/request';
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

	return (
		<Box mt='1.5' w='100%' fontSize='sm' fontWeight='400' color='fg.muted'>
			<Header>
				<Row>
					<HeaderKeyCell>{'Key'}</HeaderKeyCell>
					<HeaderValueCell>{'Value'}</HeaderValueCell>
					{editable && <HeaderAction />}
				</Row>
			</Header>
			<Body>
				{TypedObject.keys(items).map(k => {
					const item = items[k];

					return (
						<Row key={k}>
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
						</Row>
					);
				})}
			</Body>

			{editable && (
				<Flex justify='flex-end' mt='2.5' mr='0.5'>
					<Button
						bg='transparent'
						borderWidth='1px'
						borderColor='border.default'
						borderRadius='lg'
						color='fg.default'
						px='2'
						py='0.5'
						fontSize='xs'
						h='auto'
						_hover={{ outline: 'none', borderColor: 'accent.pink' }}
						_focus={{ outline: 'none', borderColor: 'accent.pink' }}
						_active={{ bg: 'accent.pink' }}
						onClick={() => addItem?.()}
					>
						{'Add'}
					</Button>
				</Flex>
			)}
		</Box>
	);
};

export default BasicTableEditor;
