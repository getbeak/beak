import { Flex } from '@chakra-ui/react';
import Squawk from '@beak/common/utils/squawk';
import Button from '@beak/ui/components/atoms/Button';
import FormError from '@beak/ui/components/atoms/FormError';
import Input from '@beak/ui/components/atoms/Input';
import { ipcNestService } from '@beak/ui/lib/ipc';
import { Loader2, Mail } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { ActionContainer, SubTitle } from '../atoms/typography';

const emailRegex = /.+@.+/;

interface RequestMagicLinkProps {
	email: string;
	onEmailChange: (email: string) => void;
	onMagicLinkSent: () => void;
}

const RequestMagicLink: React.FC<React.PropsWithChildren<RequestMagicLinkProps>> = props => {
	const { email, onEmailChange, onMagicLinkSent } = props;
	const [working, setWorking] = useState(false);
	const [error, setError] = useState<Squawk | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => inputRef.current?.select(), []);

	function sendMagicLink() {
		if (email === '' || working) return;

		if (!emailRegex.test(email)) {
			setError(new Squawk('invalid_email'));
			return;
		}

		setError(null);
		setWorking(true);

		ipcNestService
			.sendMagicLink(email)
			.then(() => onMagicLinkSent())
			.catch(error => setError(Squawk.coerce(error)))
			.finally(() => setWorking(false));
	}

	return (
		<React.Fragment>
			<SubTitle>{"We'll send a magic link to your inbox."}</SubTitle>
			<ActionContainer>
				<Input
					type='email'
					placeholder='you@example.com'
					value={email}
					ref={inputRef}
					onChange={e => onEmailChange(e.target.value)}
					onKeyDown={e => {
						if (e.key === 'Enter') sendMagicLink();
					}}
				/>
				{error && <FormError>{getErrorMessage(error)}</FormError>}
				<Button disabled={working} onClick={() => sendMagicLink()}>
					<Flex align='center' justify='center' gap='1.5'>
						{working ? (
							<Loader2 size={13} style={{ animation: 'beakSpin 1s linear infinite' }} />
						) : (
							<Mail size={13} />
						)}
						{working ? 'Sending…' : 'Send magic link'}
					</Flex>
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
