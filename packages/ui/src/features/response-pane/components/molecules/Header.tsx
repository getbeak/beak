import { Box, Flex, IconButton } from '@chakra-ui/react';
import { statusToColor, verbToColor } from '@beak/design-system/helpers';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import { getStatusReasonPhrase } from '@beak/ui/utils/http';
import { convertRequestToUrl } from '@beak/ui/utils/uri';
import type { Flight } from '@getbeak/types/flight';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Copy, MoveRight, XCircle } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';

const MotionFlex = motion.create(Flex);

export interface HeaderProps {
	selectedFlight: Flight;
}

function statusIcon(status: number) {
	if (status >= 200 && status < 300) return CheckCircle2;
	if (status >= 300 && status < 400) return MoveRight;
	if (status >= 400 && status < 500) return AlertTriangle;
	return XCircle;
}

const Header: React.FC<HeaderProps> = ({ selectedFlight }) => {
	const { error, request, response } = selectedFlight;
	const context = useVariableContext(selectedFlight.requestId);
	const [url, setUrl] = useState('');
	const [justCopied, setJustCopied] = useState(false);

	useEffect(() => {
		convertRequestToUrl(context, request).then(s => setUrl(s.toString()));
	}, [context, request]);

	const verb = request.verb.toUpperCase();
	const verbColor = verbToColor(verb);
	const statusColor = response ? statusToColor(response.status) : error ? statusToColor(500) : undefined;
	const StatusIcon = response ? statusIcon(response.status) : XCircle;

	function copyUrl() {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(url).catch(() => {});
			setJustCopied(true);
			setTimeout(() => setJustCopied(false), 1200);
		}
	}

	return (
		<MotionFlex
			initial={{ opacity: 0, y: -4 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.18, ease: 'easeOut' }}
			position='relative'
			align='center'
			gap='1.5'
			my='4'
			mx='auto'
			px='2.5'
			fontSize='sm'
			maxW='calc(100% - 20px)'
		>
			<Box
				flex='0 0 auto'
				display='inline-flex'
				alignItems='center'
				borderRadius='md'
				borderWidth='1px'
				px='2'
				py='1'
				fontWeight='700'
				fontSize='xs'
				letterSpacing='0.06em'
				textTransform='uppercase'
				style={{
					color: verbColor,
					background: `color-mix(in srgb, ${verbColor} 12%, var(--beak-colors-bg-surface))`,
					borderColor: `color-mix(in srgb, ${verbColor} 35%, var(--beak-colors-border-subtle))`,
					borderLeft: `3px solid ${verbColor}`,
					boxShadow: `inset 0 1px 0 color-mix(in srgb, white 16%, transparent)`,
				}}
			>
				{verb}
			</Box>

			<Flex
				flex='1 1 auto'
				align='center'
				gap='1'
				minW={0}
				bg='bg.canvas'
				borderRadius='md'
				borderWidth='1px'
				borderColor='border.subtle'
				px='2'
				py='1'
				transition='border-color .12s ease, box-shadow .12s ease'
				_hover={{ borderColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 35%, var(--beak-colors-border-subtle))' }}
				_focusWithin={{ borderColor: 'accent.pink', boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)' }}
			>
				<Box
					flex='1 1 auto'
					minW={0}
					overflow='hidden'
					textOverflow='ellipsis'
					whiteSpace='nowrap'
					fontFamily='mono'
					fontSize='xs'
					color='fg.default'
					data-tooltip-id='tt-response-header-url-bar'
					data-tooltip-content={url}
				>
					{url}
				</Box>
				<IconButton
					aria-label='Copy URL'
					title={justCopied ? 'Copied!' : 'Copy URL'}
					size='xs'
					variant='ghost'
					h='18px'
					w='18px'
					minW='18px'
					color={justCopied ? 'accent.teal' : 'fg.subtle'}
					_hover={{ color: 'accent.pink' }}
					onClick={copyUrl}
				>
					<Copy size={11} />
				</IconButton>
			</Flex>

			{response && (
				<MotionFlex
					initial={{ opacity: 0, scale: 0.96 }}
					animate={{ opacity: 1, scale: 1 }}
					key={response.status}
					transition={{ type: 'spring', stiffness: 600, damping: 28 }}
					flex='0 0 auto'
					align='center'
					gap='1'
					px='2'
					py='1'
					borderRadius='md'
					borderWidth='1px'
					whiteSpace='nowrap'
					style={{
						background: `color-mix(in srgb, ${statusColor} 12%, var(--beak-colors-bg-surface))`,
						color: statusColor,
						borderColor: `color-mix(in srgb, ${statusColor} 35%, var(--beak-colors-border-subtle))`,
						borderLeft: `3px solid ${statusColor}`,
						boxShadow: 'inset 0 1px 0 color-mix(in srgb, white 16%, transparent)',
					}}
				>
					<StatusIcon size={12} strokeWidth={2.2} />
					<Box as='span' fontWeight='700' fontFamily='mono'>{response.status}</Box>
					<Box as='span' opacity={0.85} fontWeight='500'>{getStatusReasonPhrase(response.status)}</Box>
				</MotionFlex>
			)}
			{error && (
				<Flex
					flex='0 0 auto'
					align='center'
					gap='1'
					px='2'
					py='1'
					borderRadius='md'
					borderWidth='1px'
					whiteSpace='nowrap'
					style={{
						background: 'color-mix(in srgb, var(--beak-colors-accent-alert) 12%, var(--beak-colors-bg-surface))',
						color: 'var(--beak-colors-accent-alert)',
						borderColor: 'color-mix(in srgb, var(--beak-colors-accent-alert) 35%, var(--beak-colors-border-subtle))',
						borderLeft: '3px solid var(--beak-colors-accent-alert)',
						boxShadow: 'inset 0 1px 0 color-mix(in srgb, white 16%, transparent)',
					}}
				>
					<XCircle size={12} strokeWidth={2.2} />
					<Box as='span' fontWeight='700' letterSpacing='0.04em' textTransform='uppercase' fontSize='10px'>{'Error'}</Box>
				</Flex>
			)}
		</MotionFlex>
	);
};

export default Header;
