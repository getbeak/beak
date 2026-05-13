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
				'0 0 0 0 rgba(249, 186, 64, 0.0)',
				'0 0 0 6px rgba(249, 186, 64, 0.18)',
				'0 0 0 0 rgba(249, 186, 64, 0.0)',
			],
		}}
		transition={{
			boxShadow: { duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' },
			opacity: { duration: 0.18 },
			scale: { duration: 0.18 },
		}}
		onClick={onClick}
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 4,
			padding: '2px 6px',
			cursor: 'pointer',
			fontSize: 10,
			fontWeight: 600,
			letterSpacing: '0.04em',
			borderRadius: 6,
			border: '1px solid #f9ba40',
			background: 'color-mix(in srgb, #f9ba40 90%, transparent)',
			color: '#1a1206',
			zIndex: 101,
		}}
	>
		<AlertTriangle size={10} />
		{children}
	</motion.div>
);

export default WarningLabel;
