import { Box, Flex } from '@chakra-ui/react';
import { statusToColor } from '@beak/design-system/helpers';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import { getStatusReasonPhrase } from '@beak/ui/utils/http';
import { convertRequestToUrl } from '@beak/ui/utils/uri';
import type { Flight } from '@getbeak/types/flight';
import * as React from 'react';
import { useEffect, useState } from 'react';

export interface HeaderProps {
	selectedFlight: Flight;
}

const sectionBase = {
	bg: 'bg.canvas',
	borderWidth: '1px',
	borderColor: 'accent.pink',
	borderRadius: 'sm',
	px: '2',
	py: '1.5',
	mx: '1.5',
} as const;

const Header: React.FC<HeaderProps> = ({ selectedFlight }) => {
	const { error, request, response } = selectedFlight;
	const context = useVariableContext(selectedFlight.requestId);
	const [url, setUrl] = useState('');

	useEffect(() => {
		convertRequestToUrl(context, request).then(s => setUrl(s.toString()));
	}, [context, request]);

	const statusColor = response ? statusToColor(response.status) : error ? statusToColor(500) : undefined;

	return (
		<Flex
			position='relative'
			justify='space-between'
			align='center'
			my='6'
			mx='auto'
			px='2.5'
			fontSize='md'
			maxW='calc(100% - 20px)'
		>
			<Box {...sectionBase} flex='0 0 auto'>
				<strong>{request.verb.toUpperCase()}</strong>
			</Box>
			<Box
				{...sectionBase}
				flex='1 1 auto'
				whiteSpace='nowrap'
				overflow='hidden'
				textOverflow='ellipsis'
				direction='rtl'
			>
				<div data-tooltip-id='tt-response-header-url-bar' data-tooltip-content={url}>
					{url}&lrm;
				</div>
			</Box>
			{response && (
				<Box
					{...sectionBase}
					whiteSpace='nowrap'
					style={{ borderColor: statusColor, color: statusColor }}
				>
					<strong>{response.status}</strong> {getStatusReasonPhrase(response.status)}
				</Box>
			)}
			{error && (
				<Box
					{...sectionBase}
					whiteSpace='nowrap'
					style={{ borderColor: statusColor, color: statusColor }}
				>
					<strong>{'Error'}</strong>
				</Box>
			)}
		</Flex>
	);
};

export default Header;
