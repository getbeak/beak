import React from 'react';
import { ipcExplorerService } from '@beak/app/lib/ipc';
import { NewsItemGenericBanner } from '@beak/common/types/nest';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled, { useTheme } from 'styled-components';

interface GenericBannerProps {
	item: NewsItemGenericBanner;
}

const GenericBanner: React.FC<React.PropsWithChildren<GenericBannerProps>> = ({ item }) => {
	const { action, body, emoji, title } = item.payload;
	const theme = useTheme();

	function visitAction() {
		if (!action)
			return;

		ipcExplorerService.launchUrl(action.url);
	}

	return (
		<Banner>
			<Emoji>{emoji}</Emoji>
			<Body>
				<TitleText>{title}</TitleText>
				<BodyText>
					{body}
					{' '}
					{action && (
						<ActionButton onClick={visitAction}>
							{action.cta}
						</ActionButton>
					)}
				</BodyText>
			</Body>
			<Dismiss>
				{item.dismissible && (
					<BlankButton>
						<FontAwesomeIcon
							icon={faTimes}
							color={theme.ui.textOnFill}
						/>
					</BlankButton>
				)}
			</Dismiss>
		</Banner>
	);
};

const Banner = styled.div`
	display: grid;
	grid-template-columns: 40px 1fr 20px;

	padding: 12px 20px;
	background: ${p => p.theme.ui.secondaryActionMuted};
	border-radius: 5px;
`;

const Emoji = styled.div`
	grid-column: 1;
	font-size: 20px;
`;

const Body = styled.div`
	grid-column: 2;
`;
const TitleText = styled.div`
	font-size: 14px;
	font-weight: bold;
`;
const BodyText = styled.div`
	font-size: 12px;
	margin-top: 3px;
`;
const ActionButton = styled.button`
	color: ${p => p.theme.ui.textHighlight};
	background: none;
	border: none;
	padding: 0;
	margin: 0;
	cursor: pointer;

	font-size: 12px;
	padding-top: 3px;
`;

const Dismiss = styled.div`
	grid-column: 3;
	text-align: right;
`;

const BlankButton = styled.button`
	background: none;
	border: none;
	padding: 0;
	margin: 0;
	cursor: pointer;
`;

export default GenericBanner;
