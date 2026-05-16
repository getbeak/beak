import Button from '@beak/ui/components/atoms/Button';
import Dialog, { DialogBody, DialogFooter, DialogHeader } from '@beak/ui/components/molecules/Dialog';
import { Box } from '@chakra-ui/react';
import { AlertCircle } from 'lucide-react';
import * as React from 'react';

interface PreFlightWarningDialogProps {
	missingCount: number;
	scopes: string[];
	onCancel: () => void;
	onConfirm: () => void;
}

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
			<Box w='460px'>
				<DialogHeader
					icon={<AlertCircle size={14} strokeWidth={2.2} />}
					title='Required fields are empty'
					description='Your schema is advisory — the request will still send if you continue.'
				/>
				<DialogBody>
					<Box as='p' fontSize='sm' color='fg.default' lineHeight='1.55'>
						{`${missingCount} required ${noun} in ${scopeList} ${missingCount === 1 ? 'is' : 'are'} empty. `}
						{'Cancel to fill them in, or send anyway to continue.'}
					</Box>
				</DialogBody>
				<DialogFooter>
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
				</DialogFooter>
			</Box>
		</Dialog>
	);
};

export default PreFlightWarningDialog;
