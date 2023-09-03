import styled, { css } from 'styled-components';

interface FakeWindowProps {
	$maxWidth?: number;
	$maxHeight?: number;

	$width?: number;
	$height?: number;
}

export const FakeWindow = styled.div<FakeWindowProps>`
	position: relative;
	border-radius: 12px;
	overflow: hidden;

	${p => Boolean(p.$maxHeight) && css`max-height: ${p.$maxHeight}px;`}
	${p => Boolean(p.$maxWidth) && css`max-width: ${p.$maxWidth}px;`}

	${p => Boolean(p.$height) && css`height: ${p.$height}px;`}
	${p => Boolean(p.$width) && css`width: ${p.$width}px;`}

	backdrop-filter: blur(30px);
	box-shadow: 0 22px 70px 4px rgba(0, 0, 0, 0.56);
`;
