import React, { useRef } from 'react';
import { useDispatch } from 'react-redux';
import actions from '@beak/app/store/project/actions';
import { EntryType } from '@beak/common/types/beak-json-editor';
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
import styled from 'styled-components';

interface TypeSelectorProps {
	requestId: string;
	id: string;
	value: EntryType;
	onChange?: (entryType: EntryType) => void;
}

const TypeSelector: React.FunctionComponent<React.PropsWithChildren<TypeSelectorProps>> = props => {
	const { requestId, id, value, onChange } = props;
	const selectRef = useRef<HTMLSelectElement>(null);
	const icon = getIconFromType(value);
	const dispatch = useDispatch();

	return (
		<Wrapper>
			<Select
				ref={selectRef}
				value={value}
				tabIndex={-1}
				onChange={e => {
					const type = e.currentTarget.value as EntryType;

					dispatch(actions.requestBodyJsonEditorTypeChange({
						requestId,
						id,
						type,
					}));

					if (onChange)
						onChange(type);

					selectRef.current!.blur();
				}}
			>
				<option value={'string'}>{'String'}</option>
				<option value={'number'}>{'Number'}</option>
				<option value={'boolean'}>{'Boolean'}</option>
				<option value={'null'}>{'Null'}</option>
				<option disabled>{'──────────'}</option>
				<option value={'array'}>{'Array'}</option>
				<option value={'object'}>{'Object'}</option>
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
