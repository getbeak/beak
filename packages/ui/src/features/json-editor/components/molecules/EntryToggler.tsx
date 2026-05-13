import { Box } from '@chakra-ui/react';
import * as React from 'react';
import { useContext } from 'react';
import { useDispatch } from 'react-redux';

import { JsonEditorContext } from '../../contexts/json-editor-context';

interface EntryTogglerProps {
	requestId: string;
	id: string;
	value: boolean;
	onChange?: (enabled: boolean) => void;
}

const EntryToggler: React.FC<EntryTogglerProps> = ({ requestId, id, value, onChange }) => {
	const editorContext = useContext(JsonEditorContext)!;
	const dispatch = useDispatch();

	return (
		<Box mt='0.5'>
			<input
				type='checkbox'
				checked={value}
				onChange={e => {
					dispatch(
						editorContext.enabledChange({
							requestId,
							id,
							enabled: e.target.checked,
						}),
					);

					onChange?.(e.target.checked);
				}}
				style={{ accentColor: 'var(--beak-colors-accent-pink)' }}
			/>
		</Box>
	);
};

export default EntryToggler;
