import { Flex } from '@chakra-ui/react';
import Squawk from '@beak/common/utils/squawk';
import Button from '@beak/ui/components/atoms/Button';
import FormError from '@beak/ui/components/atoms/FormError';
import FormInput from '@beak/ui/components/atoms/FormInput';
import Input from '@beak/ui/components/atoms/Input';
import Label from '@beak/ui/components/atoms/Label';
import { ipcDialogService, ipcNestService } from '@beak/ui/lib/ipc';
import { Loader2, Sparkles } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

const emailRegex = /.+@.+/;

interface RequestTrialProps {
	email: string;
	onChangeToDefault: () => void;
	onEmailChange: (email: string) => void;
	onMagicLinkSent: () => void;
}

const RequestTrial: React.FC<React.PropsWithChildren<RequestTrialProps>> = props => {
	const { email, onChangeToDefault, onEmailChange, onMagicLinkSent } = props;
	const [working, setWorking] = useState(false);
	const [error, setError] = useState<Squawk | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => inputRef.current?.focus(), []);

	function requestTrial() {
		if (email === '' || working) return;

		if (!emailRegex.test(email)) {
			setError(new Squawk('invalid_email'));
			return;
		}

		setError(null);
		setWorking(true);

		ipcNestService
			.createTrialAndMagicLink(email)
			.then(() => onMagicLinkSent())
			.catch(error => {
				const squawk = Squawk.coerce(error);

				switch (squawk.code) {
					case 'already_subscribed':
						ipcDialogService
							.showMessageBox({
								title: 'You’re already subscribed',
								type: 'info',
								message: 'You already have a Beak subscription. Just sign in with your email!',
							})
							.then(() => onChangeToDefault());
						return;

					case 'trial_already_used':
						ipcDialogService
							.showMessageBox({
								title: 'You’ve already used the trial',
								type: 'info',
								message:
									'You have already used your Beak trial. You can purchase a subscription to continue using Beak.',
							})
							.then(() => onChangeToDefault());
						return;

					default:
						setError(squawk);
				}
			})
			.finally(() => setWorking(false));
	}

	return (
		<FormInput>
			<Label>{'Email (you’ll use this to sign in later)'}</Label>
			<Input
				disabled={working}
				type='email'
				aria-label='Email'
				placeholder='you@example.com'
				value={email}
				ref={inputRef}
				onChange={e => onEmailChange(e.target.value)}
				onKeyDown={e => {
					if (e.key === 'Enter') requestTrial();
				}}
			/>
			{error && <FormError>{getErrorMessage(error)}</FormError>}
			<Button disabled={working} onClick={() => requestTrial()}>
				<Flex align='center' justify='center' gap='1.5'>
					{working ? (
						<Loader2 size={13} style={{ animation: 'beakSpin 1s linear infinite' }} />
					) : (
						<Sparkles size={13} />
					)}
					{working ? 'Starting trial…' : 'Start trial'}
				</Flex>
			</Button>
		</FormInput>
	);
};

function getErrorMessage(error: Squawk) {
	switch (error.code) {
		case 'invalid_email':
			return 'Please enter a valid email address';

		default:
			return `There was a problem sending the magic link (${error.code})`;
	}
}

export default RequestTrial;
