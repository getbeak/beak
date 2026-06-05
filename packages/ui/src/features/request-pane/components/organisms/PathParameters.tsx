import { valueParts } from '@beak/state';
import VariableInput from '@beak/ui/features/variable-input/components/VariableInput';
import actions from '@beak/ui/store/project/actions';
import { Box, Flex } from '@chakra-ui/react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { ValueSections } from '@getbeak/types/values';
import * as React from 'react';
import { useDispatch } from 'react-redux';

interface PathParametersProps {
	node: ValidRequestNode;
}

/**
 * Inline editor strip for an OpenAPI-linked request's path parameters.
 * Sits directly under the URL header so the relationship between the
 * `:name` placeholders in the URL and the bindable values is visually
 * obvious. Renders nothing when `pathParameters` is missing or empty,
 * so hand-authored requests (no spec metadata) see no chrome.
 */
const PathParameters: React.FC<PathParametersProps> = ({ node }) => {
	const dispatch = useDispatch();
	const pathParameters = node.info.pathParameters;
	if (!pathParameters || Object.keys(pathParameters).length === 0) return null;

	const entries = Object.values(pathParameters);

	function onValueChange(name: string, value: ValueSections) {
		dispatch(actions.requestPathParameterValueUpdated({ requestId: node.id, name, value }));
	}

	return (
		<Flex direction='column' gap='1.5' px='3' py='2' borderBottomWidth='1px' borderColor='border.subtle' bg='bg.surface'>
			<Flex align='center' gap='1.5'>
				<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle'>
					{'Path parameters'}
				</Box>
				<Box fontSize='10px' color='fg.subtle'>
					{`${entries.length} from spec`}
				</Box>
			</Flex>

			<Flex direction='column' gap='1'>
				{entries.map(entry => {
					const showRequiredBadge = entry.required === true && valueParts.isEmpty(entry.value);
					return (
						<Flex
							key={entry.name}
							align='center'
							gap='2'
							px='2'
							py='1'
							borderRadius='md'
							borderWidth='1px'
							borderColor='border.subtle'
							bg='bg.canvas'
							css={{
								'&:focus-within': {
									borderColor: 'var(--beak-colors-accent-pink)',
									boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)',
								},
							}}
						>
							<Box flex='0 0 auto' minW='110px' fontFamily='mono' fontSize='12px' color='fg.default' title={entry.description}>
								<Box as='span' color='accent.pink'>
									{':'}
								</Box>
								{entry.name}
							</Box>
							{showRequiredBadge && (
								<Box
									flex='0 0 auto'
									fontSize='9px'
									fontWeight='700'
									textTransform='uppercase'
									letterSpacing='0.04em'
									px='1.5'
									py='0.5'
									borderRadius='sm'
									bg='color-mix(in srgb, var(--beak-colors-accent-alert) 15%, transparent)'
									color='accent.alert'
								>
									{'Required'}
								</Box>
							)}
							<Box
								flex='1 1 auto'
								minW={0}
								css={{
									'& > div': { display: 'flex', alignItems: 'center', width: '100%' },
									'& > div > article': {
										padding: '2px 6px',
										background: 'transparent',
										border: 'none',
										color: 'var(--beak-colors-fg-default)',
										fontFamily: 'var(--beak-fonts-mono)',
										fontSize: '12px',
										outline: 'none',
										width: '100%',
										lineHeight: '20px',
									},
								}}
							>
								<VariableInput
									requestId={node.id}
									parts={entry.value}
									placeholder={entry.description ?? `value for ${entry.name}`}
									onChange={parts => onValueChange(entry.name, parts)}
								/>
							</Box>
						</Flex>
					);
				})}
			</Flex>
		</Flex>
	);
};

export default PathParameters;
