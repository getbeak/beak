import { Box } from '@chakra-ui/react';
import EditorView from '@beak/ui/components/atoms/EditorView';
import actions from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { attemptJsonStringFormat } from '@beak/ui/utils/json';
import type { Flight } from '@getbeak/types/flight';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import xmlFormatter from 'xml-formatter';

import useDetectedFlightFormat from '../../hooks/use-detected-flight-format';
import useFlightBodyInfo from '../../hooks/use-flight-body-info';
import PrettyRenderSelection from '../molecules/PrettyRenderSelection';
import PrettyViewIneligible from '../molecules/PrettyViewIneligible';

interface PrettyViewerProps {
	flight: Flight;
	mode: 'request' | 'response';
}

const PrettyViewer: React.FC<PrettyViewerProps> = ({ flight, mode }) => {
	const dispatch = useDispatch();
	const requestId = flight.requestId;
	const preferences = useAppSelector(s => s.global.preferences.requests[requestId].response.pretty[mode]);
	const [eligibility, body] = useFlightBodyInfo(flight, mode);
	const [contentType, detectedFormat] = useDetectedFlightFormat(flight, mode);
	const selectedLanguage = preferences.language ?? detectedFormat;

	if (eligibility !== 'eligible') return <PrettyViewIneligible eligibility={eligibility} />;

	return (
		<Box h='calc(100% - 35px)'>
			<PrettyRenderSelection
				selectedLanguage={selectedLanguage}
				onSelectedLanguageChange={lang =>
					dispatch(
						actions.requestPreferenceSetResPrettyLanguage({
							id: requestId,
							mode,
							language: lang,
						}),
					)
				}
			/>
			{renderFormat(selectedLanguage, contentType, body)}
		</Box>
	);
};

function renderFormat(language: string | null, contentType: string | null, body: Uint8Array) {
	switch (language) {
		case 'json': {
			const json = new TextDecoder().decode(body);
			return <EditorView language='json' value={attemptJsonStringFormat(json)} options={{ readOnly: true }} />;
		}

		case 'hex': {
			const outputParts = [];
			const rowLength = 0x10;

			for (let i = 0; i < body.length; i += rowLength) {
				const row = body.slice(i, i + rowLength);

				const hexValue = Array.from(row)
					.map(r => r.toString(16).padStart(2, '0'))
					.join(' ');

				const textValue = new TextDecoder('ascii')
					.decode(row)
					.replaceAll(/[^\x20-\x7F]/g, '.')
					.replaceAll(/\s/g, ' ')
					.padEnd(15, '.');

				const rowParts = [i.toString(16).padStart(8, '0'), hexValue.padEnd(44, ' '), textValue];

				outputParts.push(rowParts.join('  '));
			}

			return <EditorView language='text' value={outputParts.join('\n')} options={{ readOnly: true }} />;
		}

		case 'xml': {
			const xml = new TextDecoder().decode(body);
			return <EditorView language='xml' value={tryFormatXml(xml)} options={{ readOnly: true }} />;
		}

		case 'html': {
			const html = new TextDecoder().decode(body);
			return <EditorView language='html' value={tryFormatXml(html)} options={{ readOnly: true }} />;
		}

		case 'css': {
			const css = new TextDecoder().decode(body);
			return <EditorView language='css' value={css} options={{ readOnly: true }} />;
		}

		case 'image': {
			const blob = URL.createObjectURL(new Blob([body as BlobPart], { type: contentType ?? 'image/jpeg' }));
			return (
				<Box
					h='100%'
					bgPos='center'
					bgSize='contain'
					bgRepeat='no-repeat'
					style={{ backgroundImage: `url(${blob})` }}
				/>
			);
		}

		case 'video': {
			const blob = URL.createObjectURL(new Blob([body as BlobPart], { type: contentType ?? 'video/mp4' }));
			return (
				// biome-ignore lint/a11y/useMediaCaption: response bodies are arbitrary HTTP video responses; no caption track is available.
				<video controls autoPlay style={{ width: '100%', height: '100%' }}>
					<source src={blob} />
				</video>
			);
		}

		default: {
			const text = new TextDecoder().decode(body);
			return <EditorView language='text' value={text} options={{ readOnly: true }} />;
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

export default React.memo(PrettyViewer, (prev, next) => prev.flight.flightId === next.flight.flightId);
