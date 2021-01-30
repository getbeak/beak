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
import React, { useRef, useState } from 'react';
import styled from 'styled-components';

const TypeSelector: React.FunctionComponent = () => {
	const [selected, setSelected] = useState<EntryType>('string');
	const selectRef = useRef<HTMLSelectElement>(null);
	const icon = getIconFromType(selected);

	return (
		<Wrapper>
			<Select
				ref={selectRef}
				value={selected}
				onChange={e => {
					setSelected(e.currentTarget.value as EntryType);
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

const Button = styled.button`
	padding: 1px 0;
	width: 24px;
	margin-top: 1px;
	text-align: center;

	background: none;
	border-radius: 2px;
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	color: ${p => p.theme.ui.textMinor};
`;

const Select = styled.select`
	position: absolute;

	opacity: 0;
	width: 24px;
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
