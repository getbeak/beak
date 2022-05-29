import { EditableRealtimeValue } from '@getbeak/types-realtime-value';

type AlbumSlug = '1989' | 'red';

interface Payload {
	albumSlug: AlbumSlug;
}

interface EditorState {
	albumSlug: AlbumSlug;
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
	name: 'TSwift lyric',
	description: 'A random Taylor Swift lyric from a specific album',
	sensitive: false,
	attributes: {
		requiresRequestId: false,
	},

	createDefaultPayload: async () => ({ lyric: '', albumSlug: '1989' }),
	getValue: async (_ctx, payload) => {
		const albumLyrics = lyrics[payload.albumSlug];
		const lyric = randomLyric(albumLyrics);

		return lyric;
	},

	editor: {
		createUserInterface: async () => [{
			type: 'options_input',
			stateBinding: 'albumSlug',
			label: 'Which tswift album should this lyric be from?',
			options: [{ label: '1989', key: '1989' }, { label: 'red', key: 'red' }],
		}],

		load: async (_ctx, payload) => ({ albumSlug: payload.albumSlug }),
		save: async (_ctx, _existingPayload, state) => ({ albumSlug: state.albumSlug }),
	},
};

export default tswiftLyricExtension;
