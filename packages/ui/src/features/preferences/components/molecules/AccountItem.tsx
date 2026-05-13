import { ipcNestService } from '@beak/ui/lib/ipc';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

const AccountItem: React.FC<React.PropsWithChildren<unknown>> = () => {
	const [primaryEmail, setPrimaryEmail] = useState<string | null>(null);

	useEffect(() => {
		ipcNestService
			.getUser()
			.then(user => {
				const identifiers = user.identifiers
					.filter(i => i.identifierType === 'email' && i.removedAt === null)
					.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

				const verifiedEmail = identifiers.find(i => i.verifiedAt !== null);
				const backup = identifiers[0];

				if (!backup) return;

				setPrimaryEmail((verifiedEmail ?? backup).identifierValue);
			})
			.catch(() => setPrimaryEmail(null));
	}, []);

	if (!primaryEmail) return null;

	return (
		<Wrapper>
			<FontAwesomeIcon icon={faUserCircle} size={'3x'} color={'var(--beak-colors-accent-pink)'} />
			<Account>
				<AccountTop>{'Beak'}</AccountTop>
				<AccountEmail title={primaryEmail}>{primaryEmail}</AccountEmail>
			</Account>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	display: flex;
	align-items: center;
	border-radius: 10px;
	padding: 10px;
	background: color-mix(in srgb, var(--beak-colors-bg-surface) 25%, transparent);
	color: var(--beak-colors-fg-muted);
`;

const Account = styled.div`
	margin-left: 10px;
	overflow: hidden;
`;

const AccountTop = styled.div`
	font-size: 16px;
	font-weight: 500;
	color: var(--beak-colors-fg-default);
`;

const AccountEmail = styled.abbr`
	display: block;
	overflow: hidden;
	word-wrap: break-word;
	white-space: nowrap;
	text-overflow: ellipsis;
	font-size: 12px;
	text-decoration: none;
`;

export default AccountItem;
