import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import * as React from 'react';

interface WarningLabelProps {
	onClick?: () => void;
	children: React.ReactNode;
}

const WarningLabel: React.FC<WarningLabelProps> = ({ onClick, children }) => (
	<motion.div
		initial={{ opacity: 0, scale: 0.96 }}
		animate={{
			opacity: 1,
			scale: 1,
			boxShadow: [
				'0 0 0 0 color-mix(in srgb, var(--beak-colors-accent-warning) 0%, transparent)',
				'0 0 0 6px color-mix(in srgb, var(--beak-colors-accent-warning) 22%, transparent)',
				'0 0 0 0 color-mix(in srgb, var(--beak-colors-accent-warning) 0%, transparent)',
			],
		}}
		transition={{
			boxShadow: { duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' },
			opacity: { duration: 0.18 },
			scale: { duration: 0.18 },
		}}
		whileHover={{ scale: 1.04 }}
		whileTap={{ scale: 0.96 }}
		onClick={onClick}
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 4,
			padding: '2px 7px',
			cursor: 'pointer',
			fontSize: 10,
			fontWeight: 700,
			letterSpacing: '0.06em',
			textTransform: 'uppercase',
			borderRadius: 6,
			border: '1px solid color-mix(in srgb, var(--beak-colors-accent-warning) 75%, transparent)',
			background: 'color-mix(in srgb, var(--beak-colors-accent-warning) 22%, transparent)',
			color: 'var(--beak-colors-accent-warning)',
			zIndex: 101,
		}}
	>
		<AlertTriangle size={10} strokeWidth={2.2} />
		{children}
	</motion.div>
);

export default WarningLabel;
