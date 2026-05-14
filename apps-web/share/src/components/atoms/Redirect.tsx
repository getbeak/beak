import React, { useEffect } from 'react';

const Redirect: React.FC<React.PropsWithChildren<unknown>> = () => {
	useEffect(() => {
		window.location.href = 'https://getbeak.app';
	}, []);

	return null;
};

export default Redirect;
