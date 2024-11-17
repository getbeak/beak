import React from 'react';
import { TypedObject } from '@beak/common/helpers/typescript';
import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import { ValueSections } from '@beak/ui/features/variables/values';
import type { ToggleKeyValue } from '@getbeak/types/request';
import styled from 'styled-components';

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

const BasicTableEditor: React.FC<React.PropsWithChildren<BasicTableEditorProps>> = props => {
	const { items, requestId, readOnly, disableItemToggle, addItem, updateItem, removeItem } = props;
	const editable = !readOnly;
	const showToggle = !disableItemToggle;

	return (
		<Wrapper>
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
										type={'text'}
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
				<AddButtonWrapper>
					<Button onClick={() => addItem?.()}>
						{'Add'}
					</Button>
				</AddButtonWrapper>
			)}
		</Wrapper>
	);
};

const Wrapper = styled.div`
	margin-top: 5px;
	width: 100%;

	font-size: 12px;
	font-weight: 400;

	color: ${p => p.theme.ui.textMinor};
`;

const AddButtonWrapper = styled.div`
	display: flex;
	justify-content: flex-end;

	margin-top: 10px;
	margin-right: 2px;
`;

const Button = styled.button`
	background: transparent;
	border: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};
	border-radius: 10px;
	color: ${props => props.theme.ui.textOnSurfaceBackground};

	padding: 3px 8px;
	font-size: 11px;

	&:hover, &:focus {
		outline: none;
		border-color: ${props => props.theme.ui.primaryFill};
	}
	&:active {
		background-color: ${props => props.theme.ui.primaryFill};
	}
`;

export default BasicTableEditor;
