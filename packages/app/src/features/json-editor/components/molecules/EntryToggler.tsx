import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { JsonEditorContext } from '../../contexts/json-editor-context';

interface EntryTogglerProps {
	requestId: string;
	id: string;
	value: boolean;
	onChange?: (enabled: boolean) => void;
}

const EntryToggler: React.FC<React.PropsWithChildren<EntryTogglerProps>> = props => {
	const { requestId, id, value, onChange } = props;
	const editorContext = useContext(JsonEditorContext)!;
	const dispatch = useDispatch();

	return (
		<Wrapper>
			<Checkbox
				type={'checkbox'}
				checked={value}
				onChange={e => {
					dispatch(editorContext.enabledChange({
						requestId,
						id,
						enabled: e.target.checked,
					}));

					if (onChange)
						onChange(e.target.checked);
				}}
			/>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	margin-top: 1px;
`;

const Checkbox = styled.input``;

export default EntryToggler;
