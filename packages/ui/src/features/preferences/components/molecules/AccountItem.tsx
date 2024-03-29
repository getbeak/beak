import React, { useEffect, useState } from 'react';
import { toHexAlpha } from '@beak/design-system/utils';
import { ipcNestService } from '@beak/ui/lib/ipc';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled, { useTheme } from 'styled-components';

const AccountItem: React.FC<React.PropsWithChildren<unknown>> = () => {
	const theme = useTheme();
	const [primaryEmail, setPrimaryEmail] = useState<string | null>(null);

	useEffect(() => {
		ipcNestService.getUser()
			.then(user => {
				const identifiers = user.identifiers
					.filter(i => i.identifierType === 'email' && i.removedAt === null)
					.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

				const verifiedEmail = identifiers.find(i => i.verifiedAt !== null);
				const backup = identifiers[0];

				if (!backup)
					return;

				setPrimaryEmail((verifiedEmail ?? backup).identifierValue);
			})
			.catch(() => setPrimaryEmail(null));
	}, []);

	if (!primaryEmail)
		return null;

	return (
		<Wrapper>
			<FontAwesomeIcon
				icon={faUserCircle}
				size={'3x'}
				color={theme.ui.primaryFill}
			/>
			<Account>
				<AccountTop>{'Beak'}</AccountTop>
				<AccountEmail title={primaryEmail}>
					{primaryEmail}
				</AccountEmail>
			</Account>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	display: flex;
	align-items: center;
	border-radius: 10px;
	padding: 10px;
	background: ${p => toHexAlpha(p.theme.ui.surface, 0.25)};
	color: ${p => p.theme.ui.textMinor};
`;

const Account = styled.div`
	margin-left: 10px;
	overflow: hidden;
`;

const AccountTop = styled.div`
	font-size: 16px;
	font-weight: 500;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
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
