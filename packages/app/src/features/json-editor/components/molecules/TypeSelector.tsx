import React, { useContext, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {
	faBan,
	faCalculator,
	faCarCrash,
	faCheckCircle,
	faFont,
	faLayerGroup,
	faStream,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { EntryType } from '@getbeak/types/body-editor-json';
import styled from 'styled-components';

import { JsonEditorContext } from '../../contexts/json-editor-context';

interface TypeSelectorProps {
	disabled?: boolean;
	requestId: string;
	id: string;
	value: EntryType;
	onChange?: (entryType: EntryType) => void;
}

const TypeSelector: React.FC<React.PropsWithChildren<TypeSelectorProps>> = props => {
	const { disabled, requestId, id, value, onChange } = props;
	const selectRef = useRef<HTMLSelectElement>(null);
	const icon = getIconFromType(value);
	const dispatch = useDispatch();

	const editorContext = useContext(JsonEditorContext)!;

	return (
		<Wrapper>
			<Select
				disabled={disabled}
				ref={selectRef}
				value={value}
				tabIndex={-1}
				onChange={e => {
					const type = e.currentTarget.value as EntryType;

					dispatch(editorContext.typeChange({
						requestId,
						id,
						type,
					}));

					if (onChange)
						onChange(type);

					selectRef.current!.blur();
				}}
			>
				<optgroup label={'Primitives'}>
					<option value={'string'}>{'String'}</option>
					<option value={'number'}>{'Number'}</option>
					<option value={'boolean'}>{'Boolean'}</option>
					<option value={'null'}>{'Null'}</option>
				</optgroup>
				<optgroup label={'Objects'}>
					<option value={'array'}>{'Array'}</option>
					<option value={'object'}>{'Object'}</option>
				</optgroup>
			</Select>
			<Button>
				<FontAwesomeIcon icon={icon} />
			</Button>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	position: relative;
`;

const Button = styled.div`
	padding: 1px 0;
	width: 22px;
	margin: 0 auto;
	margin-top: 1px;
	pointer-events: none;

	text-align: center;
	border-radius: 2px;
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	color: ${p => p.theme.ui.textMinor};

	> svg {
		padding-top: 1px;
		transform: scale(0.9);
	}
`;

const Select = styled.select`
	position: absolute;

	margin: 0 auto;
	opacity: 0;
	width: 100%;
	height: 20px;

	&:disabled {
		cursor: not-allowed;
	}
`;

function getIconFromType(type: EntryType) {
	switch (type) {
		case 'number': return faCalculator;
		case 'boolean': return faCheckCircle;
		case 'null': return faBan;
		case 'object': return faStream;
		case 'array': return faLayerGroup;
		case 'string': return faFont;

		// This should _never_ happen, so let's have some fun
		default:
			return faCarCrash;
	}
}

export default TypeSelector;
