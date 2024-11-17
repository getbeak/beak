import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { VariableSets } from '@getbeak/types/variable-sets';
import * as uuid from 'uuid';

import { VariableManager } from '.';
import { ValueSections } from './values';
import { getVariableSetItemName } from './values/variable-set-item';

export default function renderValueSections(parts: ValueSections, variableSets: VariableSets) {
	let safeParts = parts;

	if (!Array.isArray(parts))
		safeParts = [];

	return renderToStaticMarkup(
		<React.Fragment>
			{safeParts.map((p, idx) => {
				if (typeof p === 'string')
					return <span key={p} data-index={idx}>{p}</span>;

				if (typeof p !== 'object') {
					console.error(`Unknown value part ${p}:(${typeof p})`);

					return null;
				}

				const rtv = VariableManager.getVariable(p.type);

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
								data-tooltip-id={'tt-variable-renderer-extension-missing'}
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
					if (p.type === 'variable_set_item') {
						const payload = p.payload as { itemId: string };

						return getVariableSetItemName(payload, variableSets);
					}

					if (rtv.getContextAwareName !== void 0)
						return rtv.getContextAwareName(p.payload);

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
