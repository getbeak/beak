import React from 'react';

interface HtmlProps {
	body: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	postBodyComponents: any[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	headComponents: any[];
	htmlAttributes: Record<string, unknown>;
	bodyAttributes: Record<string, unknown>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	preBodyComponents: any[];
}

const HTML: React.FC<HtmlProps> = props => (
	<html {...props.htmlAttributes}>
		<head>
			<title>{'Beak :: The feathery cross platform API crafting tool'}</title>

			<meta name={'viewport'} content={'width=device-width, initial-scale=1'} />
			<link rel={'shortcut icon'} href={'/assets/favicon.ico'} />

			{/* connect to domain of font files */}
			<link rel={'preconnect'} href={'https://fonts.gstatic.com'} crossOrigin={'anonymous'} />

			{/* optionally increase loading priority */}
			<link rel={'preload'} as={'style'} href={'https://fonts.googleapis.com/css2?family=Open+Sans:wght@100;200;400;700;800&display=swap'} />

			<link rel={'stylesheet'} href={'https://fonts.googleapis.com/css2?family=Open+Sans:wght@100;200;400;700;800&display=swap'} />

			{/* Primary Meta Tags */}
			<title>{'Beak :: The feathery cross platform API crafting tool'}</title>
			<meta name={'title'} content={'The feathery cross platform API crafting tool'} />
			<meta name={'description'} content={'Beak helps you build and test API\'s, whatever platform you\'re on. Construct requests with dynamic values, or inspect responses with ease.'} />

			{/* Facebook Meta Tags */}
			<meta property={'og:url'} content={'https://getbeak.app/'} />
			<meta property={'og:type'} content={'website'} />
			<meta property={'og:title'} content={'The feathery cross platform API crafting tool'} />
			<meta property={'og:description'} content={'Beak helps you build and test API\'s, whatever platform you\'re on. Construct requests with dynamic values, or inspect responses with ease.'} />
			<meta property={'og:image'} content={'https://getbeak.app/assets/Social share image (regular size).jpg'} />

			{/* Twitter Meta Tags */}
			<meta name={'twitter:card'} content={'summary_large_image'} />
			<meta property={'twitter:domain'} content={'getbeak.app'} />
			<meta property={'twitter:url'} content={'https://getbeak.app/'} />
			<meta name={'twitter:title'} content={'The feathery cross platform API crafting tool'} />
			<meta name={'twitter:description'} content={'Beak helps you build and test API\'s, whatever platform you\'re on. Construct requests with dynamic values, or inspect responses with ease.'} />
			<meta name={'twitter:image'} content={'https://getbeak.app/assets/Social share image (regular size).jpg'} />

			{/* Global site tag (gtag.js) - Google Analytics */}
			<script defer src={'/analytics.js'} />
			<script defer src={'https://www.googletagmanager.com/gtag/js?id=G-PRJ3R4Y55N'} />
			{props.headComponents}
		</head>
		<body {...props.bodyAttributes}>
			{props.preBodyComponents}
			<div
				key={'body'}
				id={'___gatsby'}
				dangerouslySetInnerHTML={{ __html: props.body }}
			/>
			{props.postBodyComponents}
		</body>
	</html>
);

export default HTML;
