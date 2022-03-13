import Button from '@beak/app/components/atoms/Button';
import Input from '@beak/app/components/atoms/Input';
import { ipcNestService } from '@beak/app/lib/ipc';
import Squawk from '@beak/common/utils/squawk';
import React, { useEffect, useRef, useState } from 'react';

import { ActionContainer, Error, SubTitle } from '../atoms/typography';

const emailRegex = /.+@.+/;

interface RequestMagicLinkProps {
	email: string;
	onEmailChange: (email: string) => void;
	onMagicLinkSent: () => void;
}

const RequestMagicLink: React.FunctionComponent<RequestMagicLinkProps> = props => {
	const { email, onEmailChange, onMagicLinkSent } = props;
	const [working, setWorking] = useState(false);
	const [error, setError] = useState<Squawk | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => inputRef.current?.select(), []);

	function sendMagicLink() {
		if (email === '' || working)
			return;

		if (!emailRegex.test(email)) {
			setError(new Squawk('invalid_email'));

			return;
		}

		setError(null);
		setWorking(true);

		ipcNestService.sendMagicLink(email)
			.then(() => onMagicLinkSent())
			.catch(error => setError(Squawk.coerce(error)))
			.finally(() => setWorking(false));
	}

	return (
		<React.Fragment>
			<SubTitle>
				{'Enter your Beak email address:'}
			</SubTitle>
			<ActionContainer>
				<Input
					type={'email'}
					placeholder={'taylor.swift@gmail.com'}
					value={email}
					ref={inputRef}
					onChange={e => onEmailChange(e.target.value)}
					onKeyDown={e => {
						if (e.key === 'Enter')
							sendMagicLink();
					}}
				/>
				{error && (
					<Error>
						{getErrorMessage(error)}
					</Error>
				)}
				<Button
					disabled={working}
					onClick={() => sendMagicLink()}
				>
					{'Continue'}
				</Button>
			</ActionContainer>
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

export default RequestMagicLink;
