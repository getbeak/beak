import React from 'react';
import { useDispatch } from 'react-redux';
import { Flight } from '@beak/app/store/flight/types';
import actions from '@beak/app/store/preferences/actions';
import { useAppSelector } from '@beak/app/store/redux';
import { attemptJsonStringFormat } from '@beak/app/utils/json';
import { createDefaultOptions } from '@beak/app/utils/monaco';
import Editor from '@monaco-editor/react';
import styled from 'styled-components';
import xmlFormatter from 'xml-formatter';

import useDetectedFlightFormat from '../../hooks/use-detected-flight-format';
import useFlightBodyInfo from '../../hooks/use-flight-body-info';
import PrettyRenderSelection from '../molecules/PrettyRenderSelection';
import PrettyViewIneligible from '../molecules/PrettyViewIneligible';

interface PrettyViewerProps {
	flight: Flight;
	mode: 'request' | 'response';
}

const PrettyViewer: React.FC<React.PropsWithChildren<PrettyViewerProps>> = ({ flight, mode }) => {
	const dispatch = useDispatch();
	const requestId = flight.requestId;
	const preferences = useAppSelector(s => s.global.preferences.requests[requestId].response.pretty[mode]);
	const [eligibility, body] = useFlightBodyInfo(flight, mode);
	const detectedFormat = useDetectedFlightFormat(flight, mode);
	const selectedLanguage = preferences.language ?? detectedFormat;

	if (eligibility !== 'eligible')
		return <PrettyViewIneligible eligibility={eligibility} />;

	return (
		<Container>
			<PrettyRenderSelection
				selectedLanguage={selectedLanguage}
				onSelectedLanguageChange={lang => dispatch(actions.requestPreferenceSetResPrettyLanguage({
					id: requestId,
					mode,
					language: lang,
				}))}
			/>
			{renderFormat(selectedLanguage, body)}
		</Container>
	);
};

function renderFormat(detectedFormat: string | null, body: Uint8Array) {
	switch (detectedFormat) {
		case 'json': {
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

		case 'xml': {
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

		case 'html': {
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

		case 'css': {
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
		default: {
			const text = new TextDecoder().decode(body);

			return (
				<Editor
					height={'100%'}
					width={'100%'}
					language={'text'}
					theme={'vs-dark'}
					value={text}
					options={{
						...createDefaultOptions(),
						readOnly: true,
					}}
				/>
			);
		}
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
	height: calc(100% - 35px);
`;

export default React.memo(
	PrettyViewer,
	(prev, next) => prev.flight.flightId === next.flight.flightId,
);
