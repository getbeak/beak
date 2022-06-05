import type { ValueParts } from '@getbeak/types/values';
import type { EditableRealtimeValue } from '@getbeak/types-realtime-value';

type AlbumSlug = '1989' | 'red';

interface Payload {
	albumSlug: AlbumSlug;
	suffix: ValueParts;
}

interface EditorState {
	albumSlug: AlbumSlug;
	suffix: ValueParts;
}

const lyrics: Record<AlbumSlug, string[]> = {
	1989: [
		'You come and pick me up, no headlights',
		'You got that James Dean daydream look in your eye',
		'And I got that red lip classic thing that you like',
		'\'Cause we never go out of style, we never go out of style',
	],
	red: [
		'Red',
		'Is an okay Album',
		'But not as good as 1989',
		'Come at me',
	],
};

function randomLyric(lyrics: string[]): string {
	const index = Math.floor(Math.random() * (lyrics.length - 1));

	return lyrics[index] ?? 'Whoops';
}

const tswiftLyricExtension: EditableRealtimeValue<Payload, EditorState> = {
	name: 'Taylor Swift lyric',
	description: 'A random Taylor Swift lyric from a specific album',
	sensitive: false,
	attributes: {
		requiresRequestId: false,
	},

	createDefaultPayload: async () => ({ albumSlug: '1989', suffix: [] }),
	getValue: async (ctx, payload, recursiveSet) => {
		const albumLyrics = lyrics[payload.albumSlug];
		const lyric = randomLyric(albumLyrics);
		const parsed = await beakApi.parseValueParts(ctx, payload.suffix, recursiveSet);

		return `${lyric} ${parsed}`;
	},

	editor: {
		createUserInterface: async () => [{
			type: 'options_input',
			stateBinding: 'albumSlug',
			label: 'Which tswift album should this lyric be from?',
			options: [{ label: '1989', key: '1989' }, { label: 'red', key: 'red' }],
		}, {
			type: 'value_parts_input',
			stateBinding: 'suffix',
			label: 'Do you want a suffix?',
		}],

		load: async (_ctx, payload) => payload,
		save: async (_ctx, _existingPayload, state) => state,
	},
};

export default tswiftLyricExtension;
