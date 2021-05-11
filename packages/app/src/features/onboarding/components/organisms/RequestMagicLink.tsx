import Button from '@beak/app/components/atoms/Button';
import { ipcNestService } from '@beak/app/lib/ipc';
import Squawk from '@beak/common/utils/squawk';
import React, { useEffect, useRef, useState } from 'react';

import FormError from '../../../../components/atoms/FormError';
import FormInput from '../../../../components/atoms/FormInput';
import Input from '../../../../components/atoms/Input';
import Label from '../../../../components/atoms/Label';
import ActionsWrapper from '../atoms/ActionsWrapper';

interface RequestMagicLinkProps {
	email: string;
	complete: () => void;
	updateEmail: (email: string) => void;
}

const RequestMagicLink: React.FunctionComponent<RequestMagicLinkProps> = props => {
	const { email, complete, updateEmail } = props;
	const [error, setError] = useState<Squawk | undefined>(void 0);
	const [working, setWorking] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, [inputRef.current]);

	function requestMagicLink() {
		if (working)
			return;

		inputRef.current?.blur();
		setWorking(true);

		ipcNestService.sendMagicLink(email)
			.then(() => {
				setError(void 0);
				setWorking(false);
				complete();
			})
			.catch(error => {
				setError(error);
				setWorking(false);
			});
	}

	return (
		<React.Fragment>
			<FormInput>
				<Label>{'Email address'}</Label>
				<Input
					placeholder={'taylor.swift@gmail.com'}
					value={email}
					type={'text'}
					ref={inputRef}
					onChange={e => updateEmail(e.target.value)}
					onKeyDown={e => {
						if (e.key === 'Enter')
							requestMagicLink();
					}}
				/>
				{error && (
					<FormError>
						{`There was a problem sending the magic link (${error.code})`}
					</FormError>
				)}
			</FormInput>

			<ActionsWrapper>
				<Button disabled={working} onClick={() => requestMagicLink()}>
					{'Request magic link'}
				</Button>
			</ActionsWrapper>
		</React.Fragment>
	);
};

export default RequestMagicLink;
