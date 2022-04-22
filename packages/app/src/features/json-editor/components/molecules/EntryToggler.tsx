import React from 'react';
import { useDispatch } from 'react-redux';
import actions from '@beak/app/store/project/actions';
import styled from 'styled-components';

interface EntryTogglerProps {
	requestId: string;
	id: string;
	value: boolean;
	onChange?: (enabled: boolean) => void;
}

const EntryToggler: React.FunctionComponent<React.PropsWithChildren<EntryTogglerProps>> = props => {
	const { requestId, id, value, onChange } = props;
	const dispatch = useDispatch();

	return (
		<Wrapper>
			<Checkbox
				type={'checkbox'}
				checked={value}
				onChange={e => {
					dispatch(actions.requestBodyJsonEditorEnabledChange({
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
