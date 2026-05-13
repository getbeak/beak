import { Box } from '@chakra-ui/react';
import * as React from 'react';

interface EntryTogglerProps {
	value: boolean;
	onChange: (enabled: boolean) => void;
}

const EntryToggler: React.FC<EntryTogglerProps> = ({ value, onChange }) => (
	<Box mt='0.5'>
		<input
			type='checkbox'
			checked={value}
			onChange={e => onChange(e.target.checked)}
			style={{ accentColor: 'var(--beak-colors-accent-pink)' }}
		/>
	</Box>
);

export default EntryToggler;
