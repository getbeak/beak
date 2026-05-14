import { Box, Flex } from '@chakra-ui/react';
import Checkbox from '@beak/ui/components/atoms/Checkbox';
import { actions } from '@beak/ui/store/project';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import { Settings2 } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

export interface OptionsViewProps {
	node: ValidRequestNode;
}

const OptionsView: React.FC<OptionsViewProps> = ({ node }) => {
	const options = node.info.options;
	const dispatch = useDispatch();

	return (
		<Flex direction='column' overflow='hidden' px='5' py='4' h='calc(100% - 40px)' gap='3'>
			<Flex align='center' gap='2'>
				<Flex
					align='center'
					justify='center'
					w='22px'
					h='22px'
					borderRadius='md'
					bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
					color='accent.pink'
					boxShadow='inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
				>
					<Settings2 size={11} strokeWidth={2.2} />
				</Flex>
				<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle'>
					{'Request options'}
				</Box>
			</Flex>
			<Box
				borderWidth='1px'
				borderColor='border.subtle'
				borderRadius='md'
				bg='color-mix(in srgb, var(--beak-colors-bg-surface) 50%, transparent)'
				p='3'
			>
				<Checkbox
					id='followRedirects'
					checked={options.followRedirects}
					label='Follow redirects'
					onChange={e =>
						dispatch(
							actions.requestOptionFollowRedirects({
								requestId: node.id,
								followRedirects: e.currentTarget.checked,
							}),
						)
					}
				/>
				<Box fontSize='10px' color='fg.subtle' mt='1' ml='6'>
					{'Automatically follow HTTP 3xx Location headers.'}
				</Box>
			</Box>
		</Flex>
	);
};

export default OptionsView;
