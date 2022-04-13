import React, { useState } from 'react';
import { Flight } from '@beak/app/store/flight/types';
import { attemptJsonStringFormat } from '@beak/app/utils/json';
import { createDefaultOptions } from '@beak/app/utils/monaco';
import Editor from '@monaco-editor/react';
import styled from 'styled-components';
import xmlFormatter from 'xml-formatter';

import useDetectedFlightFormat from '../../hooks/use-detected-flight-format';
import useFlightBodyInfo from '../../hooks/use-flight-body-info';
import PrettyRenderSelection from '../molecules/PrettyRenderSelection';

interface PrettyViewerProps {
	flight: Flight;
	mode: 'request' | 'response';
}

const PrettyViewer: React.FunctionComponent<PrettyViewerProps> = ({ flight, mode }) => {
	const [eligibility, body] = useFlightBodyInfo(flight, mode);
	const detectedFormat = useDetectedFlightFormat(flight, mode);
	const [showAutoDetect, setShowAutoDetect] = useState(true);
	const [selectedLanguage, setSelectedLanguage] = useState<string | null>(detectedFormat);

	// TODO(afr): Show error state here
	if (eligibility !== 'eligible')
		return null;

	return (
		<Container>
			<PrettyRenderSelection
				autoDetect={showAutoDetect}
				selectedLanguage={selectedLanguage}
				onAutoDetectToggle={() => setShowAutoDetect(!showAutoDetect)}
				onSelectedLanguageChange={lang => setSelectedLanguage(lang)}
			/>
			{showAutoDetect && renderFormat(flight, detectedFormat, body)}
			{!showAutoDetect && renderFormat(flight, selectedLanguage, body)}
		</Container>
	);
};

function renderFormat(flight: Flight, detectedFormat: string | null, body: Uint8Array) {
	switch (detectedFormat) {
		case 'application/json': {
			const json = new TextDecoder().decode(body);

			return (
				<Editor
					height={'100%'}
					width={'100%'}
					language={'json'}
					theme={'vs-dark'}
					value={attemptJsonStringFormat(json)}
					options={{
						...createDefaultOptions(),
						readOnly: true,
					}}
				/>
			);
		}

		case 'application/xml': {
			const xml = new TextDecoder().decode(body);

			return (
				<Editor
					height={'100%'}
					width={'100%'}
					language={'xml'}
					theme={'vs-dark'}
					value={tryFormatXml(xml)}
					options={{
						...createDefaultOptions(),
						readOnly: true,
					}}
				/>
			);
		}

		case 'text/html': {
			const html = new TextDecoder().decode(body);

			return (
				<Editor
					height={'100%'}
					width={'100%'}
					language={'html'}
					theme={'vs-dark'}
					value={tryFormatXml(html)}
					options={{
						...createDefaultOptions(),
						readOnly: true,
					}}
				/>
			);
		}

		case 'text/css': {
			const css = new TextDecoder().decode(body);

			return (
				<Editor
					height={'100%'}
					width={'100%'}
					language={'css'}
					theme={'vs-dark'}
					value={css}
					options={{
						...createDefaultOptions(),
						readOnly: true,
					}}
				/>
			);
		}

		case null:
		default:
			return 'unknown';
	}
}

function tryFormatXml(xml: string) {
	try {
		return xmlFormatter(xml, { indentation: '\t' });
	} catch {
		return xml;
	}
}

const Container = styled.div`
	height: calc(100% - 26px);
`;

export default React.memo(
	PrettyViewer,
	(prev, next) => prev.flight.flightId === next.flight.flightId,
);
