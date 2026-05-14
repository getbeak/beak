import { Box, Flex } from '@chakra-ui/react';
import { TypedObject } from '@beak/common/helpers/typescript';
import { useAppSelector } from '@beak/ui/store/redux';
import { motion } from 'framer-motion';
import { TriangleAlert } from 'lucide-react';

import React, { useRef, useState } from 'react';

import ActionBarButton from '../atoms/ActionBarButton';
import AlertsPopover from '../organisms/AlertsPopover';

interface ActionBarAlertButtonProps {
	id: string;
}

const MotionBox = motion.create(Box);

const ActionBarAlertButton: React.FC<ActionBarAlertButtonProps> = ({ id }) => {
	const [showPopover, setShowPopover] = useState(false);
	const alerts = useAppSelector(s => s.global.project.alerts);
	const alertCount = TypedObject.values(alerts).filter(Boolean).length;
	const hasAlerts = alertCount > 0;
	const parentRef = useRef<HTMLButtonElement | null>(null);

	if (!hasAlerts) return null;

	return (
		<React.Fragment>
			<ActionBarButton id={id} ref={parentRef} onClick={() => setShowPopover(true)}>
				<Flex position='relative' align='center' justify='center'>
					<TriangleAlert color='var(--beak-colors-accent-alert)' />
					<MotionBox
						initial={{ scale: 0.6, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ type: 'spring', stiffness: 700, damping: 28 }}
						position='absolute'
						top='-4px'
						right='-6px'
						minW='12px'
						h='12px'
						px='3px'
						borderRadius='full'
						display='inline-flex'
						alignItems='center'
						justifyContent='center'
						fontSize='9px'
						fontWeight='700'
						bg='accent.alert'
						color='fg.onAccent'
						pointerEvents='none'
						style={{ fontVariantNumeric: 'tabular-nums' }}
						boxShadow='0 0 0 1.5px var(--beak-colors-bg-canvas), 0 3px 8px color-mix(in srgb, var(--beak-colors-accent-alert) 40%, transparent)'
					>
						{alertCount > 9 ? '9+' : alertCount}
					</MotionBox>
				</Flex>
			</ActionBarButton>

			{parentRef.current && showPopover && (
				<AlertsPopover parent={parentRef.current} onClose={() => setShowPopover(false)} />
			)}
		</React.Fragment>
	);
};

export default ActionBarAlertButton;
