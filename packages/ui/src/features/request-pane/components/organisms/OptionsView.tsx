import { Box, Flex } from '@chakra-ui/react';
import { actions } from '@beak/ui/store/project';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import * as React from 'react';
import { useDispatch } from 'react-redux';

export interface OptionsViewProps {
	node: ValidRequestNode;
}

const OptionsView: React.FC<OptionsViewProps> = ({ node }) => {
	const options = node.info.options;
	const dispatch = useDispatch();

	return (
		<Flex direction='column' overflow='hidden' px='5' py='4' h='calc(100% - 40px)'>
			<Box py='2.5'>
				<label htmlFor='followRedirects' style={{ display: 'block', fontSize: '13px', color: 'var(--beak-colors-fg-default)' }}>
					{'Follow redirects'}
				</label>
				<input
					name='followRedirects'
					type='checkbox'
					checked={options.followRedirects}
					onChange={e =>
						dispatch(
							actions.requestOptionFollowRedirects({
								requestId: node.id,
								followRedirects: e.target.checked,
							}),
						)
					}
					style={{ marginLeft: 0, accentColor: 'var(--beak-colors-accent-pink)' }}
				/>
			</Box>
		</Flex>
	);
};

export default OptionsView;
