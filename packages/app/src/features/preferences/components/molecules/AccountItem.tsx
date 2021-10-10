import { ipcNestService } from '@beak/app/lib/ipc';
import { GetUserResponse } from '@beak/common/types/nest';
import { toHexAlpha } from '@beak/design-system/utils';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';

const AccountItem: React.FunctionComponent = () => {
	const theme = useTheme();
	const [primaryEmail, setPrimaryEmail] = useState<string | null>(null);

	useEffect(() => {
		ipcNestService.getUser().then(user => {
			const identifiers = user.identifiers
				.filter(i => i.identifierType === 'email' && i.removedAt === null)
				.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

			const verifiedEmail = identifiers.find(i => i.verifiedAt !== null);
			const backup = identifiers[0];

			if (!backup)
				return;

			setPrimaryEmail((verifiedEmail ?? backup).identifierValue);
		});
	}, []);

	if (!primaryEmail)
		return null;

	return (
		<Wrapper>
			<FontAwesomeIcon
				icon={faUserCircle}
				size={'1x'}
				color={theme.ui.primaryFill}
			/>
			<AccountEmail title={primaryEmail}>
				{primaryEmail}
			</AccountEmail>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	border-radius: 10px;
	font-size: 14px;
	padding: 10px;
	background: ${p => toHexAlpha(p.theme.ui.surface, 0.25)};
	color: ${p => p.theme.ui.textMinor};
`;

const AccountEmail = styled.abbr`
	display: block;
	overflow: hidden;
	word-wrap: break-word;
	white-space: nowrap;
	text-overflow: ellipsis;
`;

export default AccountItem;
