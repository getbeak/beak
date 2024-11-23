import { Variable } from '@getbeak/types-variables';

const characters = {
	character_carriage_return: {
		name: '\\r',
		description: 'Inserts a carriage return character',
		character: '\r',
	},
	character_newline: {
		name: '\\n',
		description: 'Inserts a newline character',
		character: '\n',
	},
	character_tab: {
		name: '\\t',
		description: 'Inserts a tab character',
		character: '\t',
	},
};

export const characterCarriageReturnRtv = createCharacter('character_carriage_return');
export const characterNewlineRtv = createCharacter('character_newline');
export const characterTabRtv = createCharacter('character_tab');

function createCharacter(type: keyof typeof characters): Variable<any> {
	const character = characters[type];

	return {
		type,
		name: character.name,
		description: character.description,
		sensitive: false,
		external: false,

		createDefaultPayload: async () => void 0,

		getValue: async () => character.character,

		attributes: {},
	};
}
