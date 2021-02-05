import { actions } from '@beak/app/store/project';
import { NamedNullEntry, NullEntry } from '@beak/common/types/beak-json-editor';
import React from 'react';
import { useDispatch } from 'react-redux';

import {
	BodyAction,
	BodyInputValueCell,
	BodyInputWrapper,
	BodyNullWrapper,
	BodyPrimaryCell,
	BodyTypeCell,
} from '../atoms/Cells';
import { Row } from '../atoms/Structure';
import EntryActions from './EntryActions';
import { EntryFolderIrrelevant } from './EntryFolder';
import EntryToggler from './EntryToggler';
import { detectName, JsonItemEntryProps } from './JsonItem';
import TypeSelector from './TypeSelector';

interface JsonNullEntryProps extends JsonItemEntryProps {
	value: NullEntry | NamedNullEntry;
}

const JsonNullEntry: React.FunctionComponent<JsonNullEntryProps> = props => {
	const { depth, jPath, requestId, value, arrayIndex } = props;
	const dispatch = useDispatch();

	return (
		<Row>
			<BodyPrimaryCell depth={depth}>
				<EntryFolderIrrelevant />
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
			<BodyInputValueCell>
				<BodyNullWrapper>
					{'null'}
				</BodyNullWrapper>
			</BodyInputValueCell>
			<BodyAction>
				<EntryActions jPath={jPath} requestId={requestId} />
			</BodyAction>
		</Row>
	);
};

export default JsonNullEntry;
