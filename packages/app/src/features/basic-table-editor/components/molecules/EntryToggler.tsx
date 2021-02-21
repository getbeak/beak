import React from 'react';
import styled from 'styled-components';

interface EntryTogglerProps {
	value: boolean;
	onChange: (enabled: boolean) => void;
}

const EntryToggler: React.FunctionComponent<EntryTogglerProps> = ({ value, onChange }) => (
	<Wrapper>
		<Checkbox
			type={'checkbox'}
			checked={value}
			onChange={e => onChange(e.target.checked)}
		/>
	</Wrapper>
);

const Wrapper = styled.div`
	margin-top: 1px;
`;

const Checkbox = styled.input``;

export default EntryToggler;
