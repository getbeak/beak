import React, { useEffect, useRef, useState } from 'react';
import Squawk from '@beak/common/utils/squawk';
import Button from '@beak/ui/components/atoms/Button';
import Input from '@beak/ui/components/atoms/Input';
import Label from '@beak/ui/components/atoms/Label';
import { ipcDialogService, ipcNestService } from '@beak/ui/lib/ipc';

import { Error } from '../atoms/typography';

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
		if (email === '' || working)
			return;

		if (!emailRegex.test(email)) {
			setError(new Squawk('invalid_email'));

			return;
		}

		setError(null);
		setWorking(true);

		ipcNestService.createTrialAndMagicLink(email)
			.then(() => onMagicLinkSent())
			.catch(error => {
				const squawk = Squawk.coerce(error);

				switch (squawk.code) {
					case 'already_subscribed':
						ipcDialogService.showMessageBox({
							title: 'You\'re already subscribed',
							type: 'info',
							message: 'You already have a Beak subscription. Just sign in with your email!',
						}).then(() => onChangeToDefault());

						break;

					case 'trial_already_used':
						ipcDialogService.showMessageBox({
							title: 'You\'re already used the trial',
							type: 'info',
							message: 'You have already used your Beak trial. You can purchase a subscription to continue using Beak.',
						}).then(() => onChangeToDefault());

						break;

					default: break;
				}

				setError(squawk);
			})
			.finally(() => setWorking(false));
	}

	return (
		<React.Fragment>
			<Label>{'Please enter your email to get started (you\'ll use this to sign in later)'}</Label>
			<Input
				disabled={working}
				type={'email'}
				placeholder={'taylor.swift@gmail.com'}
				value={email}
				ref={inputRef}
				onChange={e => onEmailChange(e.target.value)}
				onKeyDown={e => {
					if (e.key === 'Enter')
						requestTrial();
				}}
			/>
			<Button
				disabled={working}
				onClick={() => requestTrial()}
			>
				{'Continue'}
			</Button>
			{error && (
				<Error>
					{getErrorMessage(error)}
				</Error>
			)}
		</React.Fragment>
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
