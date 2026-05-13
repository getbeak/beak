import { Box, Flex } from '@chakra-ui/react';
import { BeakError } from '@beak/common/utils/squawk';
import EditorView from '@beak/ui/components/atoms/EditorView';
import { AlertCircle } from 'lucide-react';
import * as React from 'react';

interface ErrorRendererProps {
	error: unknown;
}

const ErrorRenderer: React.FC<ErrorRendererProps> = ({ error }) => {
	const handled = BeakError.coerce(error);
	const serialised = handled.serialize();
	const fieldErrors = (serialised.meta?.fieldErrors ?? {}) as Record<string, string>;
	const fieldEntries = Object.entries(fieldErrors);

	return (
		<Box
			mx='auto'
			mt='4'
			maxW='720px'
			borderRadius='md'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='bg.surface'
			overflow='hidden'
			textAlign='left'
		>
			<Flex
				align='center'
				gap='2'
				px='3'
				py='2'
				bg='color-mix(in srgb, var(--beak-colors-accent-alert) 12%, transparent)'
				borderBottomWidth='1px'
				borderColor='border.subtle'
				color='accent.alert'
			>
				<AlertCircle size={14} />
				<Box fontSize='xs' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em'>
					{serialised.kind}
				</Box>
				<Box flex='1 1 auto' color='fg.muted' fontSize='xs' fontWeight='500'>
					{serialised.message}
				</Box>
			</Flex>

			{fieldEntries.length > 0 && (
				<Box px='3' py='2' borderBottomWidth='1px' borderColor='border.subtle'>
					<Box fontSize='10px' fontWeight='700' color='fg.subtle' textTransform='uppercase' letterSpacing='0.06em' mb='1.5'>
						{'Field errors'}
					</Box>
					<Flex direction='column' gap='1'>
						{fieldEntries.map(([fieldPath, msg]) => (
							<Flex key={fieldPath} align='flex-start' gap='2' fontSize='xs' fontFamily='mono'>
								<Box flex='0 0 auto' color='accent.pink' minW='120px' maxW='220px' overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
									{fieldPath}
								</Box>
								<Box color='fg.default' wordBreak='break-word'>{msg}</Box>
							</Flex>
						))}
					</Flex>
				</Box>
			)}

			<details>
				<summary
					style={{
						cursor: 'pointer',
						padding: '8px 12px',
						fontSize: 10,
						fontWeight: 700,
						color: 'var(--beak-colors-fg-subtle)',
						textTransform: 'uppercase',
						letterSpacing: '0.06em',
					}}
				>
					{'Raw payload'}
				</summary>
				<Box h='240px'>
					<EditorView
						language='json'
						value={JSON.stringify(serialised, null, '\t')}
						options={{ readOnly: true, lineNumbers: 'off' }}
					/>
				</Box>
			</details>
		</Box>
	);
};

export default ErrorRenderer;
