import actions from '@beak/app/store/project/actions';
import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

interface EntryTogglerProps {
	requestId: string;
	jPath: string;
	value: boolean;
	onChange?: (enabled: boolean) => void;
}

const EntryToggler: React.FunctionComponent<EntryTogglerProps> = props => {
	const { requestId, jPath, value, onChange } = props;
	const dispatch = useDispatch();

	return (
		<Wrapper>
			<Checkbox
				type={'checkbox'}
				checked={value}
				onChange={e => {
					dispatch(actions.requestBodyJsonEditorEnabledChange({
						requestId,
						jPath,
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
