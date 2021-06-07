import React from 'react';

interface AlertItemProps {
	title: string;
	description: string;
	action?: {
		cta: string;
		callback: () => void;
	};
}

const AlertItem: React.FunctionComponent<AlertItemProps> = props => {
	const { title, description, action } = props;

	return null;
};

export default AlertItem;
