import React from 'react';
import styled from 'styled-components';

import Container from '../../../../components/atoms/Container';

interface FeatureHighlightProps {
	title: string;
	description: string;
	asset: string;

	flipped?: boolean;
}

const FeatureHighlight: React.FunctionComponent<FeatureHighlightProps> = props => {
	const { title, description, asset, flipped } = props;

	return (
		<Wrapper flipped={flipped}>
			<Container>
				<Grid flipped={flipped}>
					<DetailContainer>
						<Title>{title}</Title>
						<Description>{description}</Description>
					</DetailContainer>
					<VisualContainer>
						<HighlightAsset src={`/assets/${asset}.png`} />
					</VisualContainer>
				</Grid>
			</Container>
		</Wrapper>
	);
};

const Wrapper = styled.div<{ flipped: boolean | undefined }>`
	padding: 80px 0;
	background: ${p => p.flipped ? p.theme.ui.surface : p.theme.ui.secondaryBackground};
`;

const DetailContainer = styled.div`
	flex: 4;
	display: flex;
	flex-direction: column;
	justify-content: center;

	text-align: left;
`;

const Title = styled.div`
	font-weight: 700;
	font-size: 35px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;
const Description = styled.div`
	margin-top: 10px;
	font-size: 16px;
	color: ${p => p.theme.ui.textMinor};
`;

const VisualContainer = styled.div`
	flex: 6;
`;

const HighlightAsset = styled.img`
	overflow: hidden;
	border-radius: 25px;

	max-width: 100%;
	object-fit: contain;
`;

const Grid = styled.div<{ flipped: boolean | undefined }>`
	display: flex;
	flex-direction: ${p => p.flipped ? 'row-reverse' : 'row'};

	padding: 60px 0;

	> ${DetailContainer}, > ${VisualContainer} {
		margin: 0 20px;
	}
`;

export default FeatureHighlight;
