import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { VariableGroups } from '@getbeak/types/variable-groups';
import * as uuid from 'uuid';

import { RealtimeValueManager } from '.';
import { ValueParts } from './values';
import { getVariableGroupItemName } from './values/variable-group-item';

export default function renderValueParts(parts: ValueParts, variableGroups: VariableGroups) {
	let safeParts = parts;

	if (!Array.isArray(parts))
		safeParts = [];

	return renderToStaticMarkup(
		<React.Fragment>
			{safeParts.map((p, idx) => {
				if (typeof p === 'string')
					return <span key={p} data-index={idx}>{p}</span>;

				if (typeof p !== 'object') {
					// eslint-disable-next-line no-console
					console.error(`Unknown value part ${p}:(${typeof p})`);

					return null;
				}

				const rtv = RealtimeValueManager.getRealtimeValue(p.type);

				if (!rtv) {
					return (
						<div
							className={'bvs-blob'}
							contentEditable={false}
							data-index={idx}
							data-editable={false}
							data-type={p.type}
							data-payload={void 0}
							key={uuid.v4()}
						>
							&nbsp;
							<div
								data-tooltip-id={'tt-realtime-values-renderer-extension-missing'}
								data-tooltip-content={`Name ${p.type}`}
							>
								{'[Extension missing]'}
							</div>
							&nbsp;
						</div>
					);
				}

				const editable = 'editor' in rtv;
				const name = (() => {
					if (p.type === 'variable_group_item') {
						const payload = p.payload as { itemId: string };

						return getVariableGroupItemName(payload, variableGroups);
					}

					return rtv.name;
				})();

				return (
					<div
						className={'bvs-blob'}
						contentEditable={false}
						data-index={idx}
						data-editable={editable}
						data-type={p.type}
						data-payload={p.payload ? JSON.stringify(p.payload) : void 0}
						key={uuid.v4()}
					>
						&nbsp;
						{name}
						&nbsp;
					</div>
				);
			})}
		</React.Fragment>,
	);
}
