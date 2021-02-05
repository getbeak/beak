import RequestPreferencesContext from '@beak/app/features/request-pane/contexts/request-preferences-context';
import { actions } from '@beak/app/store/project';
import { NamedObjectEntry, ObjectEntry } from '@beak/common/types/beak-json-editor';
import React, { useContext, useState } from 'react';
import { useDispatch } from 'react-redux';

import {
	BodyAction,
	BodyInputWrapper,
	BodyLabelValueCell,
	BodyPrimaryCell,
	BodyTypeCell,
} from '../atoms/Cells';
import { Row } from '../atoms/Structure';
import EntryActions from './EntryActions';
import EntryFolder from './EntryFolder';
import EntryToggler from './EntryToggler';
import { detectName, JsonItemEntry, JsonItemEntryProps } from './JsonItem';
import TypeSelector from './TypeSelector';

interface JsonObjectEntryProps extends JsonItemEntryProps {
	value: ObjectEntry | NamedObjectEntry;
}

const JsonObjectEntry: React.FunctionComponent<JsonObjectEntryProps> = props => {
	const { depth, jPath, requestId, value, arrayIndex } = props;
	const reqPref = useContext(RequestPreferencesContext);
	const [expanded, setExpanded] = useState(reqPref!.getPreferences().jsonEditor?.expands[jPath]);
	const dispatch = useDispatch();
	const children = value.value;

	return (
		<React.Fragment>
			<Row>
				<BodyPrimaryCell depth={depth}>
					<EntryFolder
						jPath={jPath}
						expanded={expanded}
						requestId={requestId}
						onChange={expanded => setExpanded(expanded)}
					/>
					<EntryToggler
						jPath={[jPath, '[enabled]'].filter(Boolean).join('.')}
						requestId={requestId}
						value={value.enabled}
					/>
					<BodyInputWrapper>
						{arrayIndex === void 0 && (
							<input
								disabled={depth === 0}
								type={'text'}
								value={detectName(depth, value)}
								onChange={e => dispatch(actions.requestBodyJsonEditorNameChange({
									requestId,
									name: e.target.value,
									jPath: [jPath, '[name]'].filter(Boolean).join('.'),
								}))}
							/>
						)}
						{arrayIndex !== void 0 && `Index ${arrayIndex}`}
					</BodyInputWrapper>
				</BodyPrimaryCell>
				<BodyTypeCell>
					<TypeSelector
						requestId={requestId}
						jPath={jPath}
						value={value.type}
					/>
				</BodyTypeCell>
				<BodyLabelValueCell>
					{`${children.length} ${children.length === 1 ? 'key' : 'keys'}`}
				</BodyLabelValueCell>
				<BodyAction>
					<EntryActions jPath={jPath} requestId={requestId} />
				</BodyAction>
			</Row>
			{expanded && children.map((c, i) => (
				<JsonItemEntry
					// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
					depth={depth + 1}
					jPath={[jPath, '[value]', `[${i}]`].filter(Boolean).join('.')}
					key={i}
					requestId={requestId}
					value={c}
				/>
			))}
		</React.Fragment>
	);
};

export default JsonObjectEntry;
