import Dialog from '@beak/ui/components/molecules/Dialog';
import { Box, Flex } from '@chakra-ui/react';
import { AlertCircle } from 'lucide-react';
import * as React from 'react';

import Button from '@beak/ui/components/atoms/Button';

interface PreFlightWarningDialogProps {
	/** Total number of required-but-empty fields across the request. */
	missingCount: number;
	/** Short labels for each scope that still has gaps (e.g. ['Headers', 'Body']). */
	scopes: string[];
	onCancel: () => void;
	onConfirm: () => void;
}

/**
 * Confirmation dialog shown when the user fires a request that has
 * unfilled required schema fields. Advisory — the user can still send
 * (their schema might be aspirational, or they might be testing a
 * fallback path). Cancel returns focus to the editor.
 */
const PreFlightWarningDialog: React.FC<PreFlightWarningDialogProps> = ({
	missingCount,
	scopes,
	onCancel,
	onConfirm,
}) => {
	const scopeList =
		scopes.length === 0
			? 'this request'
			: scopes.length === 1
				? scopes[0]
				: scopes.length === 2
					? `${scopes[0]} and ${scopes[1]}`
					: `${scopes.slice(0, -1).join(', ')}, and ${scopes[scopes.length - 1]}`;
	const noun = missingCount === 1 ? 'field' : 'fields';

	return (
		<Dialog onClose={onCancel} tone='alert'>
			<Box w='460px' p='5'>
				<Flex align='center' gap='2.5' mb='3'>
					<Flex
						align='center'
						justify='center'
						w='32px'
						h='32px'
						borderRadius='full'
						bg='color-mix(in srgb, var(--beak-colors-accent-alert) 14%, transparent)'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 28%, transparent)'
						color='accent.alert'
						boxShadow='0 4px 12px color-mix(in srgb, var(--beak-colors-accent-alert) 22%, transparent), inset 0 1px 0 color-mix(in srgb, white 16%, transparent)'
					>
						<AlertCircle size={14} strokeWidth={2} />
					</Flex>
					<Box fontSize='md' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
						{'Required fields are empty'}
					</Box>
				</Flex>
				<Box as='p' fontSize='sm' color='fg.muted' mb='2' lineHeight='1.55'>
					{`${missingCount} required ${noun} in ${scopeList} ${missingCount === 1 ? 'is' : 'are'} empty. `}
					{'The request will still send — your schema is advisory.'}
				</Box>
				<Box as='p' fontSize='xs' color='fg.subtle' mb='4' lineHeight='1.5'>
					{'Cancel to fill them in, or send anyway to continue.'}
				</Box>

				<Flex justify='flex-end' gap='2' mt='3'>
					<Button
						colour='secondary'
						size='sm'
						onClick={onCancel}
						onKeyDown={e => {
							if (e.key === 'Escape') onCancel();
						}}
					>
						{'Cancel'}
					</Button>
					<Button
						size='sm'
						onClick={onConfirm}
						onKeyDown={e => {
							if (e.key === 'Enter') onConfirm();
						}}
					>
						{'Send anyway'}
					</Button>
				</Flex>
			</Box>
		</Dialog>
	);
};

export default PreFlightWarningDialog;
