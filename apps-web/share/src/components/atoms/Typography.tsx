import styled from 'styled-components';

export const Title = styled.div`
	font-size: 30px;
	font-weight: 700;
	color: var(--beak-colors-fg-default);
`;

export const TitleSubtle = styled(Title)`
	font-size: 20px;
	line-height: 24px;
	color: var(--beak-colors-fg-muted);
`;

export const SubTitle = styled.div`
	font-size: 16px;
	margin-top: 5px;
	color: var(--beak-colors-fg-muted);
`;

export const BodyRegular = styled.div`
	color: var(--beak-colors-fg-default);
`;

export const BodyBold = styled.div`
	font-weight: 600;
	color: var(--beak-colors-fg-default);
`;
